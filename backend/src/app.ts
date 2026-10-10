import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import apiRoutes from "./routes";
import { handleError } from "./middleware/error";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "apparelflow-backend",
  });
});

app.use("/api", apiRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use(handleError);
