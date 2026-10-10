import { VerificationDecision } from "../enums/VerificationDecision";

export class VerificationLog {
  id!: string;
  order_id!: string;
  verifier_id!: string;
  decision!: VerificationDecision;
  rejection_note!: string | null;
  wastage_pct!: number;
  created_at!: Date;
}
