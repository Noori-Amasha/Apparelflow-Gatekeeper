import { api } from "../../../lib/api";
import type { Role } from "../../../types/auth";
export type Batch = {
  id: string;
  order_no: string;
  status: string;
  recipe_name?: string;
  target_qty?: number;
  fabric_roll_id?: string;
  created_at?: string;
  verified_at?: string;
};
export async function fetchWorkspace(role: Role): Promise<Batch[]> {
  const path: Record<Role, string> = {
    cutting_supervisor: "/cutting-orders",
    cutting_verifier: "/verification/queue",
    sewing_supervisor: "/sewing/queue",
  };
  const result = await api.get<Batch[]>(path[role]);
  return result.data;
}
