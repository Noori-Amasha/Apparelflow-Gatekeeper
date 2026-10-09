import { app } from "./app";
import { env } from "./config/env";
import { pool } from "./database/pool";

const server = app.listen(env.PORT, () => {
  console.log(`ApparelFlow API running on http://localhost:${env.PORT}`);
});

const shutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    await pool.end();

    console.log("PostgreSQL pool closed.");
    console.log("HTTP server closed.");

    process.exit(0);
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
