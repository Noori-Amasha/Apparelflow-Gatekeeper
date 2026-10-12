import { SewingRepository } from "../../database/repositories/SewingRepository";
import { CuttingOrderStatus } from "../../database/enums/CuttingOrderStatus";
import { withTransaction } from "../../database/query";
import { ApiError } from "../../utils/ApiError";

export async function getSewingQueue() {
  return SewingRepository.listQueue();
}

export async function getStartedAssemblies() {
  return SewingRepository.listStarted();
}

export async function getSewingOrder(orderId: string) {
  const order = await SewingRepository.findAccessibleOrder(orderId);

  if (!order) {
    throw new ApiError(404, "Sewing batch not found");
  }

  const items = await SewingRepository.getItems(orderId);

  return {
    ...order,
    items,
  };
}

export async function startSewing(orderId: string, supervisorId: string) {
  return withTransaction(async (client) => {
    // Locks the VERIFIED order until COMMIT or ROLLBACK.
    const order = await SewingRepository.lockVerifiedOrder(orderId, client);

    if (!order) {
      throw new ApiError(409, "Batch is not available to start sewing");
    }

    // Defense in depth: verify component completeness
    // and the authorized verification sign-off.
    const valid = await SewingRepository.hasValidApproval(orderId, client);

    if (!valid) {
      throw new ApiError(422, "Batch has not passed complete verification");
    }

    const assembly = await SewingRepository.startAssembly(
      orderId,
      supervisorId,
      client,
    );

    if (!assembly) {
      throw new ApiError(409, "Sewing assembly could not be started");
    }

    return {
      order_id: orderId,
      status: CuttingOrderStatus.SEWING_STARTED,
      started_by: assembly.started_by,
      started_at: assembly.started_at,
    };
  });
}
