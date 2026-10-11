import { CuttingOrderRepository } from "../../database/repositories/CuttingOrderRepository";
import { VerificationQueueRepository } from "../../database/repositories/VerificationQueueRepository";
import { VerificationLogRepository } from "../../database/repositories/VerificationLogRepository";

import { CuttingOrderStatus } from "../../database/enums/CuttingOrderStatus";
import { VerificationDecision } from "../../database/enums/VerificationDecision";

import { withTransaction, query, DatabaseClient } from "../../database/query";

import { ApiError } from "../../utils/ApiError";

async function getPendingLocked(orderId: string, client: DatabaseClient) {
  const order = await CuttingOrderRepository.findByIdForUpdate(orderId, client);

  if (!order) {
    throw new ApiError(404, "Cutting order not found");
  }

  if (order.status !== CuttingOrderStatus.PENDING_VERIFICATION) {
    throw new ApiError(409, "Order is not pending verification");
  }

  return order;
}

async function calculateWastage(
  recipeId: string,
  targetQty: number,
  actual: number | null,
  client: DatabaseClient,
) {
  const recipes = await query<{
    std_fabric_yards: number;
  }>(
    `SELECT std_fabric_yards
     FROM recipes
     WHERE id = $1`,
    [recipeId],
    client,
  );

  const expected = Number(recipes[0]?.std_fabric_yards) * targetQty;

  const actualFabric = Number(actual);

  if (
    !Number.isFinite(expected) ||
    expected <= 0 ||
    actual === null ||
    !Number.isFinite(actualFabric)
  ) {
    throw new ApiError(422, "Fabric data is incomplete");
  }

  return Math.round(((actualFabric - expected) / expected) * 10000) / 100;
}

export async function listPendingOrders() {
  return VerificationQueueRepository.listPending();
}

export async function getPendingOrder(orderId: string) {
  const order = await CuttingOrderRepository.findById(orderId);

  if (!order || order.status !== CuttingOrderStatus.PENDING_VERIFICATION) {
    throw new ApiError(404, "Pending verification order not found");
  }

  const items = await VerificationQueueRepository.getItems(orderId);

  return {
    ...order,
    items,
  };
}

export async function recordCount(
  orderId: string,
  itemId: string,
  actualQty: number,
) {
  return withTransaction(async (client) => {
    await getPendingLocked(orderId, client);

    const item = await VerificationQueueRepository.updateCount(
      orderId,
      itemId,
      actualQty,
      client,
    );

    if (!item) {
      throw new ApiError(404, "Verification item not found");
    }

    return item;
  });
}

export async function approveOrder(orderId: string, verifierId: string) {
  return withTransaction(async (client) => {
    const order = await getPendingLocked(orderId, client);

    const valid = await VerificationQueueRepository.verifyRecipeItems(
      order.recipe_id,
      order.target_qty,
      order.id,
      client,
    );

    if (!valid) {
      throw new ApiError(
        422,
        "All components must be counted with no shortages",
      );
    }

    const items = await VerificationQueueRepository.getItems(orderId, client);

    const wastage = await calculateWastage(
      order.recipe_id,
      order.target_qty,
      order.actual_fabric_yds,
      client,
    );

    const snapshot = items.map((item) => ({
      component_id: item.component_id,
      component_name: item.component_name,
      expected_qty: item.expected_qty,
      actual_qty: item.actual_qty,
      variance: item.actual_qty! - item.expected_qty,
      status: item.actual_qty === item.expected_qty ? "GREEN" : "YELLOW",
    }));

    const log = await VerificationLogRepository.create(
      {
        order_id: orderId,
        verifier_id: verifierId,
        decision: VerificationDecision.APPROVED,
        rejection_note: null,
        wastage_pct: wastage,
        component_snapshot: snapshot,
      },
      client,
    );

    await VerificationQueueRepository.setStatus(
      orderId,
      CuttingOrderStatus.PENDING_VERIFICATION,
      CuttingOrderStatus.VERIFIED,
      client,
    );

    return {
      order_id: orderId,
      status: CuttingOrderStatus.VERIFIED,
      audit: log,
    };
  });
}

export async function rejectOrder(
  orderId: string,
  verifierId: string,
  reason: string,
) {
  return withTransaction(async (client) => {
    const order = await getPendingLocked(orderId, client);

    const items = await VerificationQueueRepository.getItems(orderId, client);

    const wastage = await calculateWastage(
      order.recipe_id,
      order.target_qty,
      order.actual_fabric_yds,
      client,
    );

    const snapshot = items.map((item) => ({
      component_id: item.component_id,
      component_name: item.component_name,
      expected_qty: item.expected_qty,
      actual_qty: item.actual_qty,
      variance:
        item.actual_qty === null ? null : item.actual_qty - item.expected_qty,
      status:
        item.actual_qty === null
          ? "UNCOUNTED"
          : item.actual_qty < item.expected_qty
            ? "RED"
            : item.actual_qty === item.expected_qty
              ? "GREEN"
              : "YELLOW",
    }));

    const log = await VerificationLogRepository.create(
      {
        order_id: orderId,
        verifier_id: verifierId,
        decision: VerificationDecision.REJECTED,
        rejection_note: reason,
        wastage_pct: wastage,
        component_snapshot: snapshot,
      },
      client,
    );

    await VerificationQueueRepository.setStatus(
      orderId,
      CuttingOrderStatus.PENDING_VERIFICATION,
      CuttingOrderStatus.REJECTED,
      client,
    );

    return {
      order_id: orderId,
      status: CuttingOrderStatus.REJECTED,
      audit: log,
    };
  });
}
