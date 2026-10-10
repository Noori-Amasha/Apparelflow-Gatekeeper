import { CuttingOrder } from "../models/CuttingOrder";
import { CuttingOrderStatus } from "../enums/CuttingOrderStatus";
import { DatabaseClient, query } from "../query";

export class CuttingOrderRepository {
  static async findAll(): Promise<CuttingOrder[]> {
    return query<CuttingOrder>(
      `SELECT *
       FROM cutting_orders
       ORDER BY created_at DESC`,
    );
  }

  static async findById(
    id: string,
    client?: DatabaseClient,
  ): Promise<CuttingOrder | null> {
    const rows = await query<CuttingOrder>(
      `SELECT *
       FROM cutting_orders
       WHERE id = $1`,
      [id],
      client,
    );

    return rows[0] ?? null;
  }

  static async findByIdForUpdate(
    id: string,
    client: DatabaseClient,
  ): Promise<CuttingOrder | null> {
    const rows = await query<CuttingOrder>(
      `SELECT *
       FROM cutting_orders
       WHERE id = $1
       FOR UPDATE`,
      [id],
      client,
    );

    return rows[0] ?? null;
  }

  static async findBySupervisor(supervisorId: string): Promise<CuttingOrder[]> {
    return query<CuttingOrder>(
      `SELECT *
       FROM cutting_orders
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [supervisorId],
    );
  }

  static async create(
    data: {
      order_no: string;
      recipe_id: string;
      target_qty: number;
      fabric_roll_id: string;
      actual_fabric_yds: number;
      created_by: string;
    },
    client: DatabaseClient,
  ): Promise<CuttingOrder> {
    const rows = await query<CuttingOrder>(
      `INSERT INTO cutting_orders (
        order_no,
        recipe_id,
        target_qty,
        fabric_roll_id,
        actual_fabric_yds,
        created_by,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.order_no,
        data.recipe_id,
        data.target_qty,
        data.fabric_roll_id,
        data.actual_fabric_yds,
        data.created_by,
        CuttingOrderStatus.IN_PROGRESS,
      ],
      client,
    );

    return rows[0];
  }

  static async submit(
    orderId: string,
    supervisorId: string,
    client: DatabaseClient,
  ): Promise<CuttingOrder | null> {
    const rows = await query<CuttingOrder>(
      `UPDATE cutting_orders
       SET
         status = $3,
         updated_at = NOW()
       WHERE
         id = $1
         AND created_by = $2
         AND status = $4
       RETURNING *`,
      [
        orderId,
        supervisorId,
        CuttingOrderStatus.PENDING_VERIFICATION,
        CuttingOrderStatus.IN_PROGRESS,
      ],
      client,
    );

    return rows[0] ?? null;
  }

  static async updateFabricUsage(
    orderId: string,
    supervisorId: string,
    actualFabricYards: number,
  ): Promise<CuttingOrder | null> {
    const rows = await query<CuttingOrder>(
      `UPDATE cutting_orders
       SET
         actual_fabric_yds = $3,
         updated_at = NOW()
       WHERE
         id = $1
         AND created_by = $2
         AND status = $4
       RETURNING *`,
      [
        orderId,
        supervisorId,
        actualFabricYards,
        CuttingOrderStatus.IN_PROGRESS,
      ],
    );

    return rows[0] ?? null;
  }
}
