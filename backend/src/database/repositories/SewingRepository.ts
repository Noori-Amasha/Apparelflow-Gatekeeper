import { CuttingOrder } from "../models/CuttingOrder";
import { SewingAssembly } from "../models/SewingAssembly";
import { VerificationItem } from "../models/VerificationItem";
import { DatabaseClient, query } from "../query";
import { CuttingOrderStatus } from "../enums/CuttingOrderStatus";

export type SewingOrder = CuttingOrder & {
  recipe_code: string;
  recipe_name: string;
  category: string;
  expected_fabric_yds: number;
  verifier_id: string;
  verifier_name: string;
  verified_at: Date;
  wastage_pct: number;
  component_snapshot: unknown;
  started_by: string | null;
  started_by_name: string | null;
  started_at: Date | null;
};

export type SewingItem = VerificationItem & {
  component_name: string;
  pieces_per_garment: number;
  image_url: string | null;
  variance: number;
};

export class SewingRepository {
  private static readonly orderSelect = `
    SELECT
      co.*,
      r.recipe_code,
      r.name AS recipe_name,
      r.category,
      (r.std_fabric_yards * co.target_qty)
        AS expected_fabric_yds,

      vl.verifier_id,
      verifier.full_name AS verifier_name,
      vl.timestamp AS verified_at,
      vl.wastage_pct,
      vl.component_snapshot,

      sa.started_by,
      supervisor.full_name AS started_by_name,
      sa.started_at

    FROM cutting_orders co

    JOIN recipes r
      ON r.id = co.recipe_id

    JOIN LATERAL (
      SELECT
        log.verifier_id,
        log.timestamp,
        log.wastage_pct,
        log.component_snapshot
      FROM verification_logs log
      WHERE log.order_id = co.id
        AND log.decision = 'APPROVED'
      ORDER BY log.timestamp DESC, log.id DESC
      LIMIT 1
    ) vl ON TRUE

    JOIN users verifier
      ON verifier.id = vl.verifier_id

    LEFT JOIN sewing_assemblies sa
      ON sa.order_id = co.id

    LEFT JOIN users supervisor
      ON supervisor.id = sa.started_by
  `;

  static listQueue(): Promise<SewingOrder[]> {
    return query<SewingOrder>(
      `${this.orderSelect}
       WHERE co.status = $1
         AND sa.id IS NULL
       ORDER BY co.created_at ASC`,
      [CuttingOrderStatus.VERIFIED],
    );
  }

  static listStarted(): Promise<SewingOrder[]> {
    return query<SewingOrder>(
      `${this.orderSelect}
       WHERE co.status = $1
         AND sa.id IS NOT NULL
       ORDER BY sa.started_at DESC`,
      [CuttingOrderStatus.SEWING_STARTED],
    );
  }

  static async findAccessibleOrder(
    orderId: string,
    client?: DatabaseClient,
  ): Promise<SewingOrder | null> {
    const rows = await query<SewingOrder>(
      `${this.orderSelect}
       WHERE co.id = $1::uuid
         AND (
           (co.status = $2 AND sa.id IS NULL)
           OR
           (co.status = $3 AND sa.id IS NOT NULL)
         )`,
      [orderId, CuttingOrderStatus.VERIFIED, CuttingOrderStatus.SEWING_STARTED],
      client,
    );

    return rows[0] ?? null;
  }

  static getItems(
    orderId: string,
    client?: DatabaseClient,
  ): Promise<SewingItem[]> {
    return query<SewingItem>(
      `SELECT
         vi.*,
         rc.component_name,
         rc.pieces_per_garment,
         rc.image_url,
         (vi.actual_qty - vi.expected_qty) AS variance

       FROM verification_items vi

       JOIN cutting_orders co
         ON co.id = vi.order_id

       JOIN recipe_components rc
         ON rc.id = vi.component_id
        AND rc.recipe_id = co.recipe_id

       WHERE vi.order_id = $1::uuid
         AND co.status IN ($2, $3)
         AND EXISTS (
           SELECT 1
           FROM verification_logs vl
           WHERE vl.order_id = co.id
             AND vl.decision = 'APPROVED'
         )
         AND (
           (
             co.status = $2
             AND NOT EXISTS (
               SELECT 1
               FROM sewing_assemblies sa
               WHERE sa.order_id = co.id
             )
           )
           OR
           (
             co.status = $3
             AND EXISTS (
               SELECT 1
               FROM sewing_assemblies sa
               WHERE sa.order_id = co.id
             )
           )
         )

       ORDER BY rc.component_name ASC`,
      [orderId, CuttingOrderStatus.VERIFIED, CuttingOrderStatus.SEWING_STARTED],
      client,
    );
  }

  static async lockVerifiedOrder(
    orderId: string,
    client: DatabaseClient,
  ): Promise<CuttingOrder | null> {
    const rows = await query<CuttingOrder>(
      `SELECT *
       FROM cutting_orders
       WHERE id = $1::uuid
         AND status = $2
       FOR UPDATE`,
      [orderId, CuttingOrderStatus.VERIFIED],
      client,
    );

    return rows[0] ?? null;
  }

  static async hasValidApproval(
    orderId: string,
    client: DatabaseClient,
  ): Promise<boolean> {
    const rows = await query<{ valid: boolean }>(
      `SELECT (
        EXISTS (
          SELECT 1
          FROM verification_logs vl
          JOIN users u
            ON u.id = vl.verifier_id
          WHERE vl.order_id = co.id
            AND vl.decision = 'APPROVED'
            AND u.role = 'cutting_verifier'
            AND vl.component_snapshot IS NOT NULL
        )

        AND EXISTS (
          SELECT 1
          FROM recipe_components rc
          WHERE rc.recipe_id = co.recipe_id
        )

        AND NOT EXISTS (
          SELECT 1
          FROM recipe_components rc

          LEFT JOIN verification_items vi
            ON vi.component_id = rc.id
           AND vi.order_id = co.id

          WHERE rc.recipe_id = co.recipe_id
            AND (
              vi.id IS NULL
              OR vi.actual_qty IS NULL
              OR vi.actual_qty < vi.expected_qty
              OR vi.expected_qty <>
                 co.target_qty * rc.pieces_per_garment
            )
        )

        AND NOT EXISTS (
          SELECT 1
          FROM verification_items vi

          LEFT JOIN recipe_components rc
            ON rc.id = vi.component_id
           AND rc.recipe_id = co.recipe_id

          WHERE vi.order_id = co.id
            AND rc.id IS NULL
        )

        AND NOT EXISTS (
          SELECT 1
          FROM sewing_assemblies sa
          WHERE sa.order_id = co.id
        )
      ) AS valid

      FROM cutting_orders co

      WHERE co.id = $1::uuid
        AND co.status = $2`,
      [orderId, CuttingOrderStatus.VERIFIED],
      client,
    );

    return rows[0]?.valid === true;
  }

  static async startAssembly(
    orderId: string,
    supervisorId: string,
    client: DatabaseClient,
  ): Promise<SewingAssembly | null> {
    const updated = await query<{ id: string }>(
      `UPDATE cutting_orders
       SET status = $2,
           updated_at = NOW()
       WHERE id = $1::uuid
         AND status = $3
       RETURNING id`,
      [orderId, CuttingOrderStatus.SEWING_STARTED, CuttingOrderStatus.VERIFIED],
      client,
    );

    if (updated.length !== 1) {
      return null;
    }

    const rows = await query<SewingAssembly>(
      `INSERT INTO sewing_assemblies (
         order_id,
         started_by
       )
       VALUES ($1::uuid, $2::uuid)
       RETURNING *`,
      [orderId, supervisorId],
      client,
    );

    return rows[0] ?? null;
  }
}
