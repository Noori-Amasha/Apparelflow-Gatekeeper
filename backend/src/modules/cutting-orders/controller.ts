import { RequestHandler } from "express";
import { z } from "zod";

import * as service from "./service";

import { createOrderSchema, updateFabricSchema } from "./validation";

const idSchema = z.string().uuid();

export const getOrders: RequestHandler = async (req, res, next) => {
  try {
    const orders = await service.getOrders(req.user!.id);

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById: RequestHandler = async (req, res, next) => {
  try {
    const orderId = idSchema.parse(req.params.id);

    const order = await service.getOrderById(orderId, req.user!.id);

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const createOrder: RequestHandler = async (req, res, next) => {
  try {
    const data = createOrderSchema.parse(req.body);

    const order = await service.createOrder(data, req.user!.id);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export const updateFabricUsage: RequestHandler = async (req, res, next) => {
  try {
    const orderId = idSchema.parse(req.params.id);

    const data = updateFabricSchema.parse(req.body);

    const order = await service.updateFabricUsage(
      orderId,
      req.user!.id,
      data.actual_fabric_yds,
    );

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const submitOrder: RequestHandler = async (req, res, next) => {
  try {
    const orderId = idSchema.parse(req.params.id);

    const order = await service.submitOrder(orderId, req.user!.id);

    res.json(order);
  } catch (error) {
    next(error);
  }
};
