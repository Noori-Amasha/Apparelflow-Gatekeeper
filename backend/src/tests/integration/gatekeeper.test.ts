import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { pool } from "../../database/pool";
import { SewingRepository } from "../../database/repositories/SewingRepository";

import {
  api,
  approve,
  countAll,
  createOrder,
  createTestUsers,
  getItems,
  getRecipeId,
  reject,
  saveCount,
  submitOrder,
  TestUsers,
} from "./helpers";

describe("ApparelFlow backend integration tests", () => {
  let users: TestUsers;
  let blouseRecipeId: string;
  let cropTopRecipeId: string;

  before(async () => {
    users = await createTestUsers();

    blouseRecipeId = await getRecipeId("REC-BL01");
    cropTopRecipeId = await getRecipeId("REC-CT02");
  });

  after(async () => {
    await pool.end();
  });

  // =====================================================
  // MANDATORY ASSIGNMENT TESTS
  // =====================================================

  it("M1: authenticated Verifier approves all-GREEN batch", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    const items = await countAll(users.verifier.token, order.id);

    assert.equal(items.length, 5);
    assert.ok(items.every((item) => item.status === "GREEN"));

    const response = await approve(users.verifier.token, order.id).expect(200);

    assert.equal(response.body.status, "VERIFIED");
    assert.equal(response.body.audit.decision, "APPROVED");
    assert.equal(response.body.audit.verifier_id, users.verifier.id);

    const result = await pool.query(
      "SELECT status FROM cutting_orders WHERE id = $1",
      [order.id],
    );

    assert.equal(result.rows[0].status, "VERIFIED");
  });

  it("M2: RED shortage blocks approval with HTTP 422", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);
    await countAll(users.verifier.token, order.id);

    const items = await getItems(users.verifier.token, order.id);

    const shortage = await saveCount(
      users.verifier.token,
      order.id,
      items[0].id,
      items[0].expected_qty - 1,
    );

    assert.equal(shortage.status, "RED");

    await approve(users.verifier.token, order.id).expect(422);

    const result = await pool.query(
      "SELECT status FROM cutting_orders WHERE id = $1",
      [order.id],
    );

    assert.equal(result.rows[0].status, "PENDING_VERIFICATION");

    const audit = await pool.query(
      "SELECT id FROM verification_logs WHERE order_id = $1",
      [order.id],
    );

    assert.equal(audit.rows.length, 0);
  });

  it("M3: rejection without reason fails backend validation", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    const payloads = [{}, { rejection_note: "" }, { rejection_note: "   " }];

    for (const payload of payloads) {
      await api
        .post(`/api/verification/orders/${order.id}/reject`)
        .set("Authorization", `Bearer ${users.verifier.token}`)
        .send(payload)
        .expect(400);
    }

    const result = await pool.query(
      "SELECT status FROM cutting_orders WHERE id = $1",
      [order.id],
    );

    assert.equal(result.rows[0].status, "PENDING_VERIFICATION");
  });

  it("M4: non-verifier roles receive HTTP 403 on approval", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    await approve(users.supervisor.token, order.id).expect(403);

    await approve(users.sewing.token, order.id).expect(403);
  });

  it("M5: unapproved orders are excluded from Sewing Queue database query", async () => {
    const inProgress = await createOrder(
      users.supervisor.token,
      blouseRecipeId,
    );

    const pending = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, pending.id);

    const rejected = await createOrder(
      users.supervisor.token,
      cropTopRecipeId,
      10,
      11,
    );

    await submitOrder(users.supervisor.token, rejected.id);

    await reject(
      users.verifier.token,
      rejected.id,
      "Component shortage detected",
    ).expect(200);

    const verified = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, verified.id);
    await countAll(users.verifier.token, verified.id);

    await approve(users.verifier.token, verified.id).expect(200);

    // Real repository query, not a mocked array.
    const databaseQueue = await SewingRepository.listQueue();

    const databaseIds = databaseQueue.map((order) => order.id);

    assert.ok(databaseIds.includes(verified.id));

    for (const id of [inProgress.id, pending.id, rejected.id]) {
      assert.ok(!databaseIds.includes(id));
    }

    // Real HTTP endpoint must apply the same isolation.
    const response = await api
      .get("/api/sewing/queue")
      .set("Authorization", `Bearer ${users.sewing.token}`)
      .query({ status: "REJECTED" })
      .expect(200);

    const apiIds = response.body.map((order: { id: string }) => order.id);

    assert.ok(apiIds.includes(verified.id));
    assert.ok(!apiIds.includes(inProgress.id));
    assert.ok(!apiIds.includes(pending.id));
    assert.ok(!apiIds.includes(rejected.id));
  });

  // =====================================================
  // AUTHENTICATION AND RBAC
  // =====================================================

  it("rejects requests without JWT authentication", async () => {
    await api.get("/api/cutting-orders").expect(401);
    await api.get("/api/verification/queue").expect(401);
    await api.get("/api/sewing/queue").expect(401);
  });

  it("rejects an invalid JWT", async () => {
    await api
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
  });

  it("authenticates a user through the actual login endpoint", async () => {
    const response = await api
      .post("/api/auth/login")
      .send({
        email: users.verifier.email,
        password: users.verifier.password,
      })
      .expect(200);

    assert.equal(response.body.user.id, users.verifier.id);
    assert.equal(typeof response.body.token, "string");

    const profile = await api
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${response.body.token}`)
      .expect(200);

    assert.equal(profile.body.role, "cutting_verifier");
    assert.equal(profile.body.password_hash, undefined);
  });

  it("rejects incorrect login credentials", async () => {
    await api
      .post("/api/auth/login")
      .send({
        email: users.verifier.email,
        password: "wrong-password",
      })
      .expect(401);
  });

  it("prevents non-supervisors from creating orders", async () => {
    for (const token of [users.verifier.token, users.sewing.token]) {
      await api
        .post("/api/cutting-orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          recipe_id: blouseRecipeId,
          target_qty: 10,
          fabric_roll_id: "TEST-ROLL",
          actual_fabric_yds: 18,
        })
        .expect(403);
    }
  });

  it("enforces role isolation for verification and sewing queues", async () => {
    await api
      .get("/api/verification/queue")
      .set("Authorization", `Bearer ${users.supervisor.token}`)
      .expect(403);

    await api
      .get("/api/sewing/queue")
      .set("Authorization", `Bearer ${users.verifier.token}`)
      .expect(403);

    await api
      .get("/api/sewing/queue")
      .set("Authorization", `Bearer ${users.supervisor.token}`)
      .expect(403);
  });

  // =====================================================
  // RECIPE AND CUTTING ORDER LOGIC
  // =====================================================

  it("calculates Casual Blouse components correctly", async () => {
    const order = await createOrder(
      users.supervisor.token,
      blouseRecipeId,
      20,
      36,
    );

    const components = Object.fromEntries(
      order.expected_components.map((component) => [
        component.component_name,
        component.expected_qty,
      ]),
    );

    assert.equal(components["Front Body Panel"], 20);
    assert.equal(components["Back Body Panel"], 20);
    assert.equal(components["Sleeves (Left & Right)"], 40);
    assert.equal(components["Collar & Stand"], 20);
    assert.equal(components["Sleeve Cuffs"], 40);
  });

  it("calculates Crop Top components correctly", async () => {
    const order = await createOrder(
      users.supervisor.token,
      cropTopRecipeId,
      15,
      16.5,
    );

    const components = Object.fromEntries(
      order.expected_components.map((component) => [
        component.component_name,
        component.expected_qty,
      ]),
    );

    assert.equal(components["Front Chest Panel"], 15);
    assert.equal(components["Back Support Panel"], 15);
    assert.equal(components["Neck Binding Strip"], 15);
    assert.equal(components["Hem Elastic Casing"], 15);
    assert.equal(components["Side Strap Accents"], 30);
  });

  it("rejects invalid cutting quantities through the API", async () => {
    for (const quantity of [0, -1, 2.5, "ten"]) {
      await api
        .post("/api/cutting-orders")
        .set("Authorization", `Bearer ${users.supervisor.token}`)
        .send({
          recipe_id: blouseRecipeId,
          target_qty: quantity,
          fabric_roll_id: "TEST-ROLL",
          actual_fabric_yds: 18,
        })
        .expect(400);
    }
  });

  it("rejects repeated order submission", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    await api
      .post(`/api/cutting-orders/${order.id}/submit`)
      .set("Authorization", `Bearer ${users.supervisor.token}`)
      .send({})
      .expect(409);
  });

  it("prevents editing fabric after submission", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    await api
      .patch(`/api/cutting-orders/${order.id}/fabric`)
      .set("Authorization", `Bearer ${users.supervisor.token}`)
      .send({ actual_fabric_yds: 25 })
      .expect(409);
  });

  // =====================================================
  // VERIFICATION HARD STOP AND AUDIT
  // =====================================================

  it("blocks approval when component counts are missing", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    const items = await getItems(users.verifier.token, order.id);

    await saveCount(
      users.verifier.token,
      order.id,
      items[0].id,
      items[0].expected_qty,
    );

    await approve(users.verifier.token, order.id).expect(422);
  });

  it("allows YELLOW excess components to be approved", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    const items = await countAll(users.verifier.token, order.id, 1);

    assert.ok(items.every((item) => item.status === "YELLOW"));

    const response = await approve(users.verifier.token, order.id).expect(200);

    assert.equal(response.body.status, "VERIFIED");
  });

  it("rejects negative counts and client-supplied statuses", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    const items = await getItems(users.verifier.token, order.id);

    for (const payload of [
      { actual_qty: -1 },
      { actual_qty: 2.5 },
      { actual_qty: "10" },
      { actual_qty: 10, status: "GREEN" },
    ]) {
      await api
        .patch(`/api/verification/orders/${order.id}/items/${items[0].id}`)
        .set("Authorization", `Bearer ${users.verifier.token}`)
        .send(payload)
        .expect(400);
    }
  });

  it("records server-owned verifier attribution", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);
    await countAll(users.verifier.token, order.id);

    const response = await api
      .post(`/api/verification/orders/${order.id}/approve`)
      .set("Authorization", `Bearer ${users.verifier.token}`)
      .send({
        verifier_id: users.supervisor.id,
        wastage_pct: 999,
        timestamp: "2000-01-01T00:00:00Z",
      })
      .expect(200);

    assert.equal(response.body.audit.verifier_id, users.verifier.id);

    assert.equal(response.body.audit.wastage_pct, 0);

    assert.notEqual(
      new Date(response.body.audit.timestamp).getFullYear(),
      2000,
    );
  });

  it("stores positive fabric variance", async () => {
    const order = await createOrder(
      users.supervisor.token,
      blouseRecipeId,
      20,
      39.6,
    );

    await submitOrder(users.supervisor.token, order.id);
    await countAll(users.verifier.token, order.id);

    const response = await approve(users.verifier.token, order.id).expect(200);

    assert.equal(response.body.audit.wastage_pct, 10);
  });

  it("preserves negative fabric variance", async () => {
    const order = await createOrder(
      users.supervisor.token,
      blouseRecipeId,
      20,
      18.5,
    );

    await submitOrder(users.supervisor.token, order.id);
    await countAll(users.verifier.token, order.id);

    const response = await approve(users.verifier.token, order.id).expect(200);

    assert.equal(response.body.audit.wastage_pct, -48.61);
  });

  it("preserves rejected audit history after rework", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    await reject(
      users.verifier.token,
      order.id,
      "Sleeve shortage detected",
    ).expect(200);

    await api
      .post(`/api/cutting-orders/${order.id}/rework`)
      .set("Authorization", `Bearer ${users.supervisor.token}`)
      .send({})
      .expect(200);

    await submitOrder(users.supervisor.token, order.id);
    await countAll(users.verifier.token, order.id);

    await approve(users.verifier.token, order.id).expect(200);

    const logs = await pool.query<{
      decision: string;
      rejection_note: string | null;
    }>(
      `SELECT decision, rejection_note
       FROM verification_logs
       WHERE order_id = $1`,
      [order.id],
    );

    assert.equal(logs.rows.length, 2);

    assert.ok(logs.rows.some((log) => log.decision === "REJECTED"));

    assert.ok(logs.rows.some((log) => log.decision === "APPROVED"));
  });

  it("prevents audit log modification and deletion", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);
    await countAll(users.verifier.token, order.id);

    const response = await approve(users.verifier.token, order.id).expect(200);

    const logId = response.body.audit.id;

    await assert.rejects(
      pool.query(
        `UPDATE verification_logs
         SET wastage_pct = 999
         WHERE id = $1`,
        [logId],
      ),
      /Verification audit logs are immutable/,
    );

    await assert.rejects(
      pool.query(`DELETE FROM verification_logs WHERE id = $1`, [logId]),
      /Verification audit logs are immutable/,
    );
  });

  // =====================================================
  // SEWING WORKFLOW
  // =====================================================

  it("blocks sewing for unverified batches", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    await api
      .post(`/api/sewing/orders/${order.id}/start`)
      .set("Authorization", `Bearer ${users.sewing.token}`)
      .send({})
      .expect(409);
  });

  it("allows sewing to start only once", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);
    await countAll(users.verifier.token, order.id);
    await approve(users.verifier.token, order.id).expect(200);

    const response = await api
      .post(`/api/sewing/orders/${order.id}/start`)
      .set("Authorization", `Bearer ${users.sewing.token}`)
      .send({})
      .expect(200);

    assert.equal(response.body.status, "SEWING_STARTED");
    assert.equal(response.body.started_by, users.sewing.id);

    await api
      .post(`/api/sewing/orders/${order.id}/start`)
      .set("Authorization", `Bearer ${users.sewing.token}`)
      .send({})
      .expect(409);

    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM sewing_assemblies
       WHERE order_id = $1`,
      [order.id],
    );

    assert.equal(Number(result.rows[0].count), 1);
  });

  it("prevents other roles from starting sewing", async () => {
    const order = await createOrder(users.supervisor.token, blouseRecipeId);

    await submitOrder(users.supervisor.token, order.id);

    for (const token of [users.supervisor.token, users.verifier.token]) {
      await api
        .post(`/api/sewing/orders/${order.id}/start`)
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(403);
    }
  });
});
