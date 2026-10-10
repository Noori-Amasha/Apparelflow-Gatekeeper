import { RequestHandler } from "express";
import { UserRole } from "../database/enums/UserRole";
import { ApiError } from "../utils/ApiError";

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiError(403, "Forbidden: insufficient role"));
      return;
    }

    next();
  };
}
