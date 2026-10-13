import { VerificationLog } from "../models/VerificationLog";
import { VerificationDecision } from "../enums/VerificationDecision";
import { DatabaseClient, query } from "../query";

export class VerificationLogRepository {
  static async findByOrder(orderId: string): Promise<VerificationLog[]> {
    return query<VerificationLog>(
      `SELECT
         *,
         created_at AS timestamp
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
      component_snapshot: unknown;
    },
    client: DatabaseClient,
  ): Promise<VerificationLog> {
    const rows = await query<VerificationLog>(
      `INSERT INTO verification_logs (
        order_id,
        verifier_id,
        decision,
        rejection_note,
        wastage_pct,
        component_snapshot
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6::jsonb
      )
      RETURNING *, created_at AS timestamp`,
      [
        data.order_id,
        data.verifier_id,
        data.decision,
        data.rejection_note,
        data.wastage_pct,
        JSON.stringify(data.component_snapshot),
      ],
      client,
    );

    return rows[0];
  }
}
