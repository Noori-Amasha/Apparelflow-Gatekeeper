import { VerificationLog } from "../models/VerificationLog";
import { VerificationDecision } from "../enums/VerificationDecision";
import { DatabaseClient, query } from "../query";

export class VerificationLogRepository {
  static async findByOrder(orderId: string): Promise<VerificationLog[]> {
    return query<VerificationLog>(
      `SELECT *
       FROM verification_logs
       WHERE order_id = $1
       ORDER BY created_at DESC`,
      [orderId],
    );
  }

  static async create(
    data: {
      order_id: string;
      verifier_id: string;
      decision: VerificationDecision;
      rejection_note: string | null;
      wastage_pct: number;
    },
    client: DatabaseClient,
  ): Promise<VerificationLog> {
    const rows = await query<VerificationLog>(
      `INSERT INTO verification_logs (
        order_id,
        verifier_id,
        decision,
        rejection_note,
        wastage_pct
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        data.order_id,
        data.verifier_id,
        data.decision,
        data.rejection_note,
        data.wastage_pct,
      ],
      client,
    );

    return rows[0];
  }
}
