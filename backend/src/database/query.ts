import type { QueryResultRow } from "pg";
import { pool } from "./pool";

export const query = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) => {
  return pool.query<T>(text, params);
};
