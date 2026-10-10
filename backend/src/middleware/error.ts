import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export const handleError: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.status).json({
      message: error.message,
    });
    return;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: string }).code;

    if (code === "23505") {
      res.status(409).json({
        message: "Record already exists",
      });
      return;
    }

    if (["23503", "23514", "23502", "22P02", "22003"].includes(String(code))) {
      res.status(400).json({
        message: "Invalid database input",
      });
      return;
    }
  }

  console.error(error);

  res.status(500).json({
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : "Unexpected server error",
  });
};
