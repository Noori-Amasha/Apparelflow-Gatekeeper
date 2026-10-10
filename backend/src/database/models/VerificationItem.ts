import { VerificationItemStatus } from "../enums/VerificationItemStatus";

export class VerificationItem {
  id!: string;
  order_id!: string;
  component_id!: string;
  expected_qty!: number;
  actual_qty!: number | null;
  status!: VerificationItemStatus;
}
