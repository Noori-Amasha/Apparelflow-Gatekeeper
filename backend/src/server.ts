import { app } from "./app";
import { env } from "./config/env";
import { pool } from "./database/pool";

async function startServer() {
  await pool.query("SELECT 1");

  console.log("PostgreSQL connected");

  const server = app.listen(env.PORT, () => {
    console.log(`Backend running at http://localhost:${env.PORT}`);
  });

  async function shutdown() {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
