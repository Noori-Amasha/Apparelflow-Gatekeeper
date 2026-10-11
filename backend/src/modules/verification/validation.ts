import { z } from "zod";

export const orderIdSchema = z.string().uuid();

export const itemIdSchema = z.string().uuid();

export const countSchema = z
  .object({
    actual_qty: z.number().int().nonnegative().safe(),
  })
  .strict();

export const rejectionSchema = z
  .object({
    rejection_note: z.string().trim().min(1).max(2000),
  })
  .strict();
