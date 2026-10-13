import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createUserSchema, loginSchema } from "../../modules/auth/validation";

describe("Login validation", () => {
  it("accepts valid login credentials", () => {
    const result = loginSchema.safeParse({
      email: "supervisor@example.com",
      password: "Password123!",
    });

    assert.equal(result.success, true);
  });

  it("rejects invalid email addresses", () => {
    const emails = ["", "invalid-email", "user@", "@example.com"];

    for (const email of emails) {
      assert.equal(
        loginSchema.safeParse({
          email,
          password: "Password123!",
        }).success,
        false,
      );
    }
  });

  it("rejects empty passwords", () => {
    const result = loginSchema.safeParse({
      email: "supervisor@example.com",
      password: "",
    });

    assert.equal(result.success, false);
  });
});

describe("User creation validation", () => {
  const validUser = {
    email: "supervisor@example.com",
    password: "Password123!",
    full_name: "Cutting Supervisor",
    role: "cutting_supervisor",
  };

  it("accepts a valid Cutting Supervisor", () => {
    assert.equal(createUserSchema.safeParse(validUser).success, true);
  });

  it("accepts all three supported roles", () => {
    const roles = [
      "cutting_supervisor",
      "cutting_verifier",
      "sewing_supervisor",
    ];

    for (const role of roles) {
      assert.equal(
        createUserSchema.safeParse({
          ...validUser,
          role,
        }).success,
        true,
      );
    }
  });

  it("rejects unsupported roles", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      role: "administrator",
    });

    assert.equal(result.success, false);
  });

  it("rejects passwords shorter than eight characters", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "1234567",
    });

    assert.equal(result.success, false);
  });

  it("rejects names containing only whitespace", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      full_name: "   ",
    });

    assert.equal(result.success, false);
  });
});
