import { CuttingOrder } from "../models/CuttingOrder";
import { VerificationItem } from "../models/VerificationItem";
import { DatabaseClient, query } from "../query";
import { CuttingOrderStatus } from "../enums/CuttingOrderStatus";

export type ItemDetail = VerificationItem & {
  component_name: string;
  pieces_per_garment: number;
  image_url: string | null;
};

export class VerificationQueueRepository {
  static listPending(): Promise<CuttingOrder[]> {
    return query<CuttingOrder>(
      `SELECT *
       FROM cutting_orders
       WHERE status = $1
       ORDER BY created_at ASC`,
      [CuttingOrderStatus.PENDING_VERIFICATION],
    );
  }

  static getItems(
    orderId: string,
    client?: DatabaseClient,
  ): Promise<ItemDetail[]> {
    return query<ItemDetail>(
      `SELECT
         vi.*,
         rc.component_name,
         rc.pieces_per_garment,
         rc.image_url
       FROM verification_items vi
       JOIN recipe_components rc
         ON rc.id = vi.component_id
       WHERE vi.order_id = $1
       ORDER BY rc.component_name`,
      [orderId],
      client,
    );
  }

  static async updateCount(
    orderId: string,
    itemId: string,
    count: number,
    client: DatabaseClient,
  ): Promise<ItemDetail | null> {
    const rows = await query<ItemDetail>(
      `
    UPDATE verification_items
      SET actual_qty = $3::integer,
          status = (
            CASE
              WHEN $3::integer = expected_qty THEN 'GREEN'
              WHEN $3::integer > expected_qty THEN 'YELLOW'
              ELSE 'RED'
            END
          )
      WHERE id = $2::uuid
        AND order_id = $1::uuid
      RETURNING *
      `,
      [orderId, itemId, count],
    );

    if (!rows[0]) {
      return null;
    }

    const items = await this.getItems(orderId, client);

    return items.find((item) => item.id === itemId) ?? null;
  }

  static async setStatus(
    orderId: string,
    from: CuttingOrderStatus,
    to: CuttingOrderStatus,
    client: DatabaseClient,
  ): Promise<void> {
    const rows = await query<{ id: string }>(
      `UPDATE cutting_orders
       SET status = $3,
           updated_at = NOW()
       WHERE id = $1
         AND status = $2
       RETURNING id`,
      [orderId, from, to],
      client,
    );

    if (rows.length !== 1) {
      throw new Error("Unexpected order state change");
    }
  }

  static async verifyRecipeItems(
    recipeId: string,
    targetQty: number,
    orderId: string,
    client: DatabaseClient,
  ): Promise<boolean> {
    const rows = await query<{ valid: boolean }>(
      `SELECT (
         EXISTS (
           SELECT 1
           FROM recipe_components
           WHERE recipe_id = $1
         )
         AND NOT EXISTS (
           SELECT 1
           FROM recipe_components rc
           LEFT JOIN verification_items vi
             ON vi.component_id = rc.id
             AND vi.order_id = $3
           WHERE rc.recipe_id = $1
             AND (
               vi.id IS NULL
               OR vi.expected_qty <>
                 $2::bigint * rc.pieces_per_garment
               OR vi.actual_qty IS NULL
               OR vi.actual_qty < vi.expected_qty
             )
         )
         AND NOT EXISTS (
           SELECT 1
           FROM verification_items vi
           LEFT JOIN recipe_components rc
             ON rc.id = vi.component_id
             AND rc.recipe_id = $1
           WHERE vi.order_id = $3
             AND rc.id IS NULL
         )
       ) AS valid`,
      [recipeId, targetQty, orderId],
      client,
    );

    return rows[0]?.valid === true;
  }
}
