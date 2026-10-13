import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createOrderSchema,
  updateFabricSchema,
} from "../../modules/cutting-orders/validation";

import {
  countSchema,
  rejectionSchema,
} from "../../modules/verification/validation";

const validOrder = {
  recipe_id: "11111111-1111-4111-8111-111111111111",
  target_qty: 20,
  fabric_roll_id: "FAB-ROLL-001",
  actual_fabric_yds: 36,
};

describe("Cutting Order Validation", () => {
  it("accepts valid cutting order data", () => {
    const result = createOrderSchema.safeParse(validOrder);

    assert.equal(result.success, true);
  });

  it("rejects zero and negative quantities", () => {
    for (const quantity of [0, -1, -10]) {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        target_qty: quantity,
      });

      assert.equal(result.success, false);
    }
  });

  it("rejects decimal quantities", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      target_qty: 2.5,
    });

    assert.equal(result.success, false);
  });

  it("rejects nonnumeric quantities", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      target_qty: "twenty",
    });

    assert.equal(result.success, false);
  });

  it("rejects an invalid recipe ID", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      recipe_id: "invalid-id",
    });

    assert.equal(result.success, false);
  });

  it("rejects empty fabric roll identifiers", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      fabric_roll_id: "   ",
    });

    assert.equal(result.success, false);
  });

  it("rejects quantities above the configured maximum", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      target_qty: 1000001,
    });

    assert.equal(result.success, false);
  });
});

describe("Fabric Usage Validation", () => {
  it("accepts valid fabric measurements", () => {
    for (const fabric of [0, 18, 18.5, 18.125]) {
      const result = updateFabricSchema.safeParse({
        actual_fabric_yds: fabric,
      });

      assert.equal(result.success, true);
    }
  });

  it("rejects negative fabric measurements", () => {
    const result = updateFabricSchema.safeParse({
      actual_fabric_yds: -5,
    });

    assert.equal(result.success, false);
  });

  it("rejects nonnumeric and non-finite fabric measurements", () => {
    for (const fabric of ["invalid", NaN, Infinity]) {
      const result = updateFabricSchema.safeParse({
        actual_fabric_yds: fabric,
      });

      assert.equal(result.success, false);
    }
  });

  it("rejects more than three decimal places", () => {
    const result = updateFabricSchema.safeParse({
      actual_fabric_yds: 18.1234,
    });

    assert.equal(result.success, false);
  });
});

describe("Component Count Validation", () => {
  it("accepts zero and positive integer counts", () => {
    for (const quantity of [0, 1, 20, 100]) {
      const result = countSchema.safeParse({
        actual_qty: quantity,
      });

      assert.equal(result.success, true);
    }
  });

  it("rejects negative and decimal counts", () => {
    for (const quantity of [-1, 2.5]) {
      const result = countSchema.safeParse({
        actual_qty: quantity,
      });

      assert.equal(result.success, false);
    }
  });

  it("rejects client-supplied component status", () => {
    const result = countSchema.safeParse({
      actual_qty: 10,
      status: "GREEN",
    });

    assert.equal(result.success, false);
  });
});

describe("Rejection Reason Validation", () => {
  it("accepts a meaningful rejection reason", () => {
    const result = rejectionSchema.safeParse({
      rejection_note: "Sleeve components are missing.",
    });

    assert.equal(result.success, true);
  });

  it("rejects missing and blank rejection reasons", () => {
    const inputs = [{}, { rejection_note: "" }, { rejection_note: "   " }];

    for (const input of inputs) {
      const result = rejectionSchema.safeParse(input);

      assert.equal(result.success, false);
    }
  });

  it("rejects spoofed audit fields", () => {
    const result = rejectionSchema.safeParse({
      rejection_note: "Shortage found",
      verifier_id: "fake-verifier",
    });

    assert.equal(result.success, false);
  });
});
