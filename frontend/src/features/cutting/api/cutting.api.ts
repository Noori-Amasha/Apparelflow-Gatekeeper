import { api } from "../../../lib/api";
import type {
  Recipe,
  CuttingOrder,
  OrderDetail,
  CreateOrder,
} from "../../../types/production";

export const cuttingApi = {
  orders: () => api.get<CuttingOrder[]>("/cutting-orders").then((r) => r.data),

  detail: (id: string) =>
    api.get<OrderDetail>(`/cutting-orders/${id}`).then((r) => r.data),

  recipes: () => api.get<Recipe[]>("/recipes").then((r) => r.data),

  recipe: (id: string) => api.get<Recipe>(`/recipes/${id}`).then((r) => r.data),

  create: (data: CreateOrder) =>
    api.post("/cutting-orders", data).then((r) => r.data),

  submit: (id: string) =>
    api.post(`/cutting-orders/${id}/submit`, {}).then((r) => r.data),

  rework: (id: string) =>
    api.post(`/cutting-orders/${id}/rework`, {}).then((r) => r.data),

  updateFabric: (id: string, actual_fabric_yds: number) =>
    api
      .patch(`/cutting-orders/${id}/fabric`, {
        actual_fabric_yds,
      })
      .then((r) => r.data),
};
