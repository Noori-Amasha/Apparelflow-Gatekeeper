import { RequestHandler } from "express";

import * as service from "./service";

import {
  countSchema,
  itemIdSchema,
  orderIdSchema,
  rejectionSchema,
} from "./validation";

export const getQueue: RequestHandler = async (_req, res, next) => {
  try {
    const orders = await service.listPendingOrders();

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrder: RequestHandler = async (req, res, next) => {
  try {
    const orderId = orderIdSchema.parse(req.params.id);

    const order = await service.getPendingOrder(orderId);

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const updateCount: RequestHandler = async (req, res, next) => {
  try {
    const orderId = orderIdSchema.parse(req.params.id);

    const itemId = itemIdSchema.parse(req.params.itemId);

    const { actual_qty } = countSchema.parse(req.body);

    const item = await service.recordCount(orderId, itemId, actual_qty);

    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const approve: RequestHandler = async (req, res, next) => {
  try {
    const orderId = orderIdSchema.parse(req.params.id);

    const result = await service.approveOrder(orderId, req.user!.id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const reject: RequestHandler = async (req, res, next) => {
  try {
    const orderId = orderIdSchema.parse(req.params.id);

    const { rejection_note } = rejectionSchema.parse(req.body);

    const result = await service.rejectOrder(
      orderId,
      req.user!.id,
      rejection_note,
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};
