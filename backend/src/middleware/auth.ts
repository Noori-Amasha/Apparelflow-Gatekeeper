import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { UserRepository } from "../database/repositories/UserRepository";
import { ApiError } from "../utils/ApiError";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = authorization.slice(7);

    const payload = jwt.verify(token, env.JWT_SECRET);

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new ApiError(401, "Invalid token");
    }

    const user = await UserRepository.findById(payload.sub);

    if (!user) {
      throw new ApiError(401, "User does not exist");
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, "Invalid or expired token"));
      return;
    }

    next(error);
  }
};
