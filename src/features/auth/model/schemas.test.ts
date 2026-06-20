import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./schemas";

describe("auth schemas", () => {
  it("normalizes a valid login email", () => {
    expect(
      loginSchema.parse({
        email: "ALEX@EXAMPLE.COM",
        password: "secret",
      }).email,
    ).toBe("alex@example.com");
  });

  it("requires a strong-enough signup password and matching confirmation", () => {
    const result = signupSchema.safeParse({
      fullName: "Alex Morgan",
      email: "alex@example.com",
      password: "short",
      confirmPassword: "different",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      password: ["Use at least 8 characters."],
      confirmPassword: ["Passwords do not match."],
    });
  });

  it("validates forgot and reset password inputs", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        password: "new-password",
        confirmPassword: "new-password",
      }).success,
    ).toBe(true);
  });
});
