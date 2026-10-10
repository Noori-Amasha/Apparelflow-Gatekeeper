import { PoolClient, QueryResultRow } from "pg";
import { pool } from "./pool";

export type DatabaseClient = Pick<PoolClient, "query">;

export async function query<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
  client: DatabaseClient = pool,
): Promise<T[]> {
  const result = await client.query<T>(sql, params);

  return result.rows;
}

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await work(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
