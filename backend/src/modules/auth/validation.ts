import { z } from "zod";
import { UserRole } from "../../database/enums/UserRole";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().trim().min(2).max(150),
  role: z.nativeEnum(UserRole),
});
