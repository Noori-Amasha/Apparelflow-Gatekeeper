import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import dotenv from "dotenv";
import { Client } from "pg";

async function main() {
  const filePath = resolve(process.cwd(), ".env.test");

  if (!existsSync(filePath)) {
    throw new Error(
      "Missing .env.test. Create it before running integration tests.",
    );
  }

  const configuration = dotenv.parse(readFileSync(filePath));
  const databaseUrl = configuration.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing from .env.test.");
  }

  const url = new URL(databaseUrl);
  const localHosts = ["localhost", "127.0.0.1", "[::1]", "::1"];

  if (
    configuration.NODE_ENV !== "test" ||
    !localHosts.includes(url.hostname) ||
    url.pathname !== "/apparelflow_test"
  ) {
    throw new Error(
      "Integration tests require NODE_ENV=test and a local apparelflow_test database.",
    );
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    // Verify the actual connected database and PostgreSQL server.
    const identity = await client.query<{
      database_name: string;
      server_address: string | null;
    }>(
      `SELECT
         current_database() AS database_name,
         inet_server_addr()::text AS server_address`,
    );

    const database = identity.rows[0];

    // PostgreSQL may return ::1/128 instead of ::1.
    const serverAddress = database?.server_address?.split("/")[0];

    if (
      database?.database_name !== "apparelflow_test" ||
      !["127.0.0.1", "::1"].includes(serverAddress ?? "")
    ) {
      throw new Error(
        `Unsafe database connection. Database: ${
          database?.database_name ?? "unknown"
        }, server address: ${database?.server_address ?? "null"}`,
      );
    }

    // Verify required database tables.
    const requiredTables = [
      "users",
      "recipes",
      "recipe_components",
      "cutting_orders",
      "verification_items",
      "verification_logs",
      "sewing_assemblies",
    ];

    const tables = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'`,
    );

    const existingTables = new Set(tables.rows.map((row) => row.table_name));

    const missingTables = requiredTables.filter(
      (table) => !existingTables.has(table),
    );

    if (missingTables.length > 0) {
      throw new Error(
        `Missing test database tables: ${missingTables.join(", ")}`,
      );
    }

    // Verify required verification columns.
    const columns = await client.query<{
      table_name: string;
      column_name: string;
    }>(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN (
           'verification_items',
           'verification_logs'
         )`,
    );

    const existingColumns = new Set(
      columns.rows.map((row) => `${row.table_name}.${row.column_name}`),
    );

    const requiredColumns = [
      "verification_items.expected_qty",
      "verification_items.actual_qty",
      "verification_items.status",
      "verification_logs.verifier_id",
      "verification_logs.decision",
      "verification_logs.rejection_note",
      "verification_logs.wastage_pct",
      "verification_logs.component_snapshot",
    ];

    const missingColumns = requiredColumns.filter(
      (column) => !existingColumns.has(column),
    );

    if (missingColumns.length > 0) {
      throw new Error(
        `Missing test database columns: ${missingColumns.join(", ")}`,
      );
    }

    console.log("Test database verified: apparelflow_test");
    console.log("Local PostgreSQL connection verified.");
    console.log("Required tables and columns verified.");
  } finally {
    await client.end();
  }

  // Run integration tests only after all safety checks pass.
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--test",
      "--test-concurrency=1",
      "src/tests/integration/gatekeeper.test.ts",
    ],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      env: {
        ...process.env,
        ...configuration,
        NODE_ENV: "test",
      },
    },
  );

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);

  process.exitCode = 1;
});
