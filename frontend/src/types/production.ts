export type OrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "SEWING_STARTED";

export type Recipe = {
  id: string;
  recipe_code: string;
  name: string;
  category: string;
  std_fabric_yards: number;
  wastage_cap: number;
  components?: RecipeComponent[];
};

export type RecipeComponent = {
  id: string;
  recipe_id: string;
  component_name: string;
  pieces_per_garment: number;
  image_url: string | null;
};

export type CuttingOrder = {
  id: string;
  order_no: string;
  recipe_id: string;
  target_qty: number;
  fabric_roll_id: string;
  actual_fabric_yds: number | null;
  status: OrderStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type VerificationOrder = CuttingOrder & {
  verifier_name: string | null;
  verified_at: string | null;
  rejection_note?: string | null;
};

export type VerificationItem = {
  id: string;
  order_id: string;
  component_id: string;
  component_name?: string;
  expected_qty: number;
  actual_qty: number | null;
  status: "GREEN" | "YELLOW" | "RED" | null;
  pieces_per_garment?: number;
};

export type OrderDetail = CuttingOrder & {
  items: VerificationItem[];
};

export type SewingOrder = CuttingOrder & {
  recipe_code: string;
  recipe_name: string;
  category: string;
  expected_fabric_yds: number;
  verifier_id: string;
  verifier_name: string;
  verified_at: string;
  wastage_pct: number;
  component_snapshot: unknown;
  started_by: string | null;
  started_by_name: string | null;
  started_at: string | null;
};

export type SewingDetail = SewingOrder & {
  items: VerificationItem[];
};

export type CreateOrder = {
  recipe_id: string;
  target_qty: number;
  fabric_roll_id: string;
  actual_fabric_yds: number;
};

export const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

export const numberValue = (value: unknown) => Number(value ?? 0);
