import { randomUUID } from "crypto";
import { z } from "zod";

import { withTransaction } from "../../database/query";

import { RecipeRepository } from "../../database/repositories/RecipeRepository";
import { RecipeComponentRepository } from "../../database/repositories/RecipeComponentRepository";
import { CuttingOrderRepository } from "../../database/repositories/CuttingOrderRepository";
import { VerificationItemRepository } from "../../database/repositories/VerificationItemRepository";

import { CuttingOrderStatus } from "../../database/enums/CuttingOrderStatus";
import { ApiError } from "../../utils/ApiError";

import { createOrderSchema } from "./validation";

export async function getOrders(supervisorId: string) {
  return CuttingOrderRepository.findBySupervisor(supervisorId);
}

export async function getOrderById(orderId: string, supervisorId: string) {
  const order = await CuttingOrderRepository.findById(orderId);

  if (!order || order.created_by !== supervisorId) {
    throw new ApiError(404, "Cutting order not found");
  }

  const items = await VerificationItemRepository.findByOrder(orderId);

  return {
    ...order,
    items,
  };
}

export async function createOrder(
  data: z.infer<typeof createOrderSchema>,
  supervisorId: string,
) {
  return withTransaction(async (client) => {
    const recipe = await RecipeRepository.findById(data.recipe_id, client);

    if (!recipe) {
      throw new ApiError(404, "Recipe not found");
    }

    const components = await RecipeComponentRepository.findByRecipe(
      data.recipe_id,
      client,
    );

    if (components.length === 0) {
      throw new ApiError(422, "Recipe has no components");
    }

    const orderNo = `CO-${randomUUID().slice(0, 12).toUpperCase()}`;

    const order = await CuttingOrderRepository.create(
      {
        order_no: orderNo,
        recipe_id: data.recipe_id,
        target_qty: data.target_qty,
        fabric_roll_id: data.fabric_roll_id,
        actual_fabric_yds: data.actual_fabric_yds,
        created_by: supervisorId,
      },
      client,
    );

    for (const component of components) {
      const expectedQty = data.target_qty * component.pieces_per_garment;

      if (!Number.isSafeInteger(expectedQty)) {
        throw new ApiError(422, "Expected component quantity is too large");
      }

      await VerificationItemRepository.create(
        {
          order_id: order.id,
          component_id: component.id,
          expected_qty: expectedQty,
        },
        client,
      );
    }

    return {
      ...order,
      expected_components: components.map((component) => ({
        component_id: component.id,
        component_name: component.component_name,
        pieces_per_garment: component.pieces_per_garment,
        expected_qty: data.target_qty * component.pieces_per_garment,
      })),
    };
  });
}

export async function updateFabricUsage(
  orderId: string,
  supervisorId: string,
  actualFabricYards: number,
) {
  const order = await CuttingOrderRepository.updateFabricUsage(
    orderId,
    supervisorId,
    actualFabricYards,
  );

  if (!order) {
    throw new ApiError(409, "Order not editable or not owned by supervisor");
  }

  return order;
}

export async function submitOrder(orderId: string, supervisorId: string) {
  return withTransaction(async (client) => {
    const order = await CuttingOrderRepository.findByIdForUpdate(
      orderId,
      client,
    );

    if (!order || order.created_by !== supervisorId) {
      throw new ApiError(404, "Cutting order not found");
    }

    if (order.status !== CuttingOrderStatus.IN_PROGRESS) {
      throw new ApiError(409, "Only in-progress orders can be submitted");
    }

    if (
      order.actual_fabric_yds === null ||
      Number(order.actual_fabric_yds) <= 0
    ) {
      throw new ApiError(422, "Actual fabric usage must be greater than zero");
    }

    const items = await VerificationItemRepository.findByOrder(orderId, client);

    if (items.length === 0) {
      throw new ApiError(422, "Order has no verification items");
    }

    const submitted = await CuttingOrderRepository.submit(
      orderId,
      supervisorId,
      client,
    );

    if (!submitted) {
      throw new ApiError(409, "Order could not be submitted");
    }

    return submitted;
  });
}
