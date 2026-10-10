import { z } from "zod";

export const createOrderSchema = z.object({
  recipe_id: z.string().uuid(),

  target_qty: z.number().int().positive().max(1000000),

  fabric_roll_id: z.string().trim().min(1).max(100),

  actual_fabric_yds: z
    .number()
    .finite()
    .nonnegative()
    .multipleOf(0.001)
    .max(999999999.999),
});

export const updateFabricSchema = z.object({
  actual_fabric_yds: z
    .number()
    .finite()
    .nonnegative()
    .multipleOf(0.001)
    .max(999999999.999),
});
