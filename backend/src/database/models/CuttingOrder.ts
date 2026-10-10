import { CuttingOrderStatus } from "../enums/CuttingOrderStatus";

export class CuttingOrder {
  id!: string;
  order_no!: string;
  recipe_id!: string;
  target_qty!: number;
  fabric_roll_id!: string;
  actual_fabric_yds!: number | null;
  status!: CuttingOrderStatus;
  created_by!: string;
  created_at!: Date;
  updated_at!: Date;
}
