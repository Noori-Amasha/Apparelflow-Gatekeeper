import { z } from "zod";

export const sewingOrderIdSchema = z.string().uuid();

export const startSewingSchema = z.object({}).strict();
