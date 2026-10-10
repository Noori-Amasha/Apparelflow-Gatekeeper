import { VerificationItem } from "../models/VerificationItem";
import { VerificationItemStatus } from "../enums/VerificationItemStatus";
import { DatabaseClient, query } from "../query";

export class VerificationItemRepository {
  static async findByOrder(
    orderId: string,
    client?: DatabaseClient,
  ): Promise<VerificationItem[]> {
    return query<VerificationItem>(
      `SELECT *
       FROM verification_items
       WHERE order_id = $1
       ORDER BY id`,
      [orderId],
      client,
    );
  }

  static async findById(
    id: string,
    client?: DatabaseClient,
  ): Promise<VerificationItem | null> {
    const rows = await query<VerificationItem>(
      `SELECT *
       FROM verification_items
       WHERE id = $1`,
      [id],
      client,
    );

    return rows[0] ?? null;
  }

  static async create(
    data: {
      order_id: string;
      component_id: string;
      expected_qty: number;
    },
    client: DatabaseClient,
  ): Promise<VerificationItem> {
    const rows = await query<VerificationItem>(
      `INSERT INTO verification_items (
        order_id,
        component_id,
        expected_qty,
        status
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        data.order_id,
        data.component_id,
        data.expected_qty,
        VerificationItemStatus.YELLOW,
      ],
      client,
    );

    return rows[0];
  }
}
