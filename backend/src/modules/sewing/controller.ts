import { RequestHandler } from "express";

import * as service from "./service";
import { sewingOrderIdSchema, startSewingSchema } from "./validation";

export const getQueue: RequestHandler = async (_req, res, next) => {
  try {
    const orders = await service.getSewingQueue();
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getStarted: RequestHandler = async (_req, res, next) => {
  try {
    const orders = await service.getStartedAssemblies();
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrder: RequestHandler = async (req, res, next) => {
  try {
    const orderId = sewingOrderIdSchema.parse(req.params.id);

    const order = await service.getSewingOrder(orderId);

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const start: RequestHandler = async (req, res, next) => {
  try {
    const orderId = sewingOrderIdSchema.parse(req.params.id);

    startSewingSchema.parse(req.body ?? {});

    const result = await service.startSewing(orderId, req.user!.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
