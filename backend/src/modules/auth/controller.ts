import { RequestHandler } from "express";
import * as service from "./service";
import { loginSchema } from "./validation";

export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const result = await service.login(data.email, data.password);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await service.getCurrentUser(req.user!.id);

    res.json(user);
  } catch (error) {
    next(error);
  }
};
