import { api } from "../../../lib/api";
import type { SewingOrder, SewingDetail } from "../../../types/production";

export const sewingApi = {
  queue: () => api.get<SewingOrder[]>("/sewing/queue").then((r) => r.data),

  started: () => api.get<SewingOrder[]>("/sewing/started").then((r) => r.data),

  detail: (id: string) =>
    api.get<SewingDetail>(`/sewing/orders/${id}`).then((r) => r.data),

  start: (id: string) =>
    api.post(`/sewing/orders/${id}/start`, {}).then((r) => r.data),
};
