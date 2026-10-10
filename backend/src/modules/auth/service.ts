import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { env } from "../../config/env";
import { UserRepository } from "../../database/repositories/UserRepository";
import { User } from "../../database/models/User";
import { ApiError } from "../../utils/ApiError";

import { createUserSchema } from "./validation";

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    created_at: user.created_at,
  };
}

export async function login(email: string, password: string) {
  const user = await UserRepository.findByEmail(email.trim().toLowerCase());

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  return {
    token,
    user: publicUser(user),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await UserRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return publicUser(user);
}

export async function createUser(input: z.infer<typeof createUserSchema>) {
  const data = createUserSchema.parse(input);

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await UserRepository.create({
    email: data.email.trim().toLowerCase(),
    password_hash: passwordHash,
    full_name: data.full_name,
    role: data.role,
  });

  return publicUser(user);
}
