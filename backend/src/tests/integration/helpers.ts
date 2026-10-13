import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";

import { app } from "../../app";
import { env } from "../../config/env";
import { pool } from "../../database/pool";

export const api = request(app);

export type TestUser = {
  id: string;
  email: string;
  password: string;
  token: string;
};

export type TestUsers = {
  supervisor: TestUser;
  verifier: TestUser;
  sewing: TestUser;
};

export type TestOrder = {
  id: string;
  status: string;
  expected_components: Array<{
    component_name: string;
    expected_qty: number;
    pieces_per_garment: number;
  }>;
};

export type TestItem = {
  id: string;
  expected_qty: number;
  actual_qty: number | null;
  status: string;
  component_name: string;
};

export async function verifyDatabase(): Promise<void> {
  const result = await pool.query<{
    database_name: string;
    server_address: string | null;
  }>(
    `SELECT
       current_database() AS database_name,
       inet_server_addr()::text AS server_address`,
  );

  const database = result.rows[0];

  if (
    env.NODE_ENV !== "test" ||
    database?.database_name !== "apparelflow_test"
  ) {
    throw new Error("Unsafe database connection. Integration tests stopped.");
  }

  const url = new URL(env.DATABASE_URL);

  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Integration tests must use a local database.");
  }
}

async function createUser(
  role: "cutting_supervisor" | "cutting_verifier" | "sewing_supervisor",
): Promise<TestUser> {
  const idSuffix = randomUUID().slice(0, 8);
  const email = `${role}-${idSuffix}@test.local`;
  const password = "TestPassword123!";

  const passwordHash = await bcrypt.hash(password, 4);

  const result = await pool.query<{ id: string }>(
    `INSERT INTO users (
       email, password_hash, role, full_name
     )
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [email, passwordHash, role, `Test ${role}`],
  );

  const id = result.rows[0].id;

  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: id,
    expiresIn: "1h",
  });

  return {
    id,
    email,
    password,
    token,
  };
}

export async function createTestUsers(): Promise<TestUsers> {
  await verifyDatabase();

  const supervisor = await createUser("cutting_supervisor");
  const verifier = await createUser("cutting_verifier");
  const sewing = await createUser("sewing_supervisor");

  return {
    supervisor,
    verifier,
    sewing,
  };
}

export async function getRecipeId(
  recipeCode: "REC-BL01" | "REC-CT02",
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `SELECT id
     FROM recipes
     WHERE recipe_code = $1`,
    [recipeCode],
  );

  assert.equal(
    result.rows.length,
    1,
    `Recipe ${recipeCode} must exist in the test database`,
  );

  return result.rows[0].id;
}

export async function createOrder(
  token: string,
  recipeId: string,
  targetQuantity = 10,
  actualFabric = 18,
): Promise<TestOrder> {
  const response = await api
    .post("/api/cutting-orders")
    .set("Authorization", `Bearer ${token}`)
    .send({
      recipe_id: recipeId,
      target_qty: targetQuantity,
      fabric_roll_id: `TEST-${randomUUID().slice(0, 8)}`,
      actual_fabric_yds: actualFabric,
    })
    .expect(201);

  assert.equal(response.body.status, "IN_PROGRESS");

  return response.body as TestOrder;
}

export async function submitOrder(
  token: string,
  orderId: string,
): Promise<void> {
  const response = await api
    .post(`/api/cutting-orders/${orderId}/submit`)
    .set("Authorization", `Bearer ${token}`)
    .send({})
    .expect(200);

  assert.equal(response.body.status, "PENDING_VERIFICATION");
}

export async function getItems(
  token: string,
  orderId: string,
): Promise<TestItem[]> {
  const response = await api
    .get(`/api/verification/orders/${orderId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.ok(Array.isArray(response.body.items));

  return response.body.items as TestItem[];
}

export async function saveCount(
  token: string,
  orderId: string,
  itemId: string,
  quantity: number,
): Promise<TestItem> {
  const response = await api
    .patch(`/api/verification/orders/${orderId}/items/${itemId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ actual_qty: quantity })
    .expect(200);

  return response.body as TestItem;
}

export async function countAll(
  token: string,
  orderId: string,
  extra = 0,
): Promise<TestItem[]> {
  const items = await getItems(token, orderId);

  const savedItems: TestItem[] = [];

  for (const item of items) {
    const saved = await saveCount(
      token,
      orderId,
      item.id,
      item.expected_qty + extra,
    );

    savedItems.push(saved);
  }

  return savedItems;
}

export function approve(token: string, orderId: string) {
  return api
    .post(`/api/verification/orders/${orderId}/approve`)
    .set("Authorization", `Bearer ${token}`)
    .send({});
}

export function reject(token: string, orderId: string, reason: string) {
  return api
    .post(`/api/verification/orders/${orderId}/reject`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      rejection_note: reason,
    });
}
