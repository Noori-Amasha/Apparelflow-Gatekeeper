import { api } from "../../../lib/api";
import type { CuttingOrder, OrderDetail } from "../../../types/production";

export const verificationApi = {
  queue: () =>
    api.get<CuttingOrder[]>("/verification/queue").then((r) => r.data),

  detail: (id: string) =>
    api.get<OrderDetail>(`/verification/orders/${id}`).then((r) => r.data),

  count: (orderId: string, itemId: string, actual_qty: number) =>
    api
      .patch(`/verification/orders/${orderId}/items/${itemId}`, {
        actual_qty,
      })
      .then((r) => r.data),

  approve: (id: string) =>
    api.post(`/verification/orders/${id}/approve`).then((r) => r.data),

  reject: (id: string, rejection_note: string) =>
    api
      .post(`/verification/orders/${id}/reject`, {
        rejection_note,
      })
      .then((r) => r.data),
};
