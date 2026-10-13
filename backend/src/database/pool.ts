import { Pool, types } from "pg";
import { env } from "../config/env";

// PostgreSQL NUMERIC -> JavaScript number
types.setTypeParser(1700, Number);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,

  // Required for Supabase PostgreSQL connections
  ssl: {
    rejectUnauthorized: false,
  },

  max: 10,
});

pool.on("error", (error) => {
  console.error("PostgreSQL connection error:", error);
});
