import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  deleteAccountSchema,
  profileSchema,
} from "./schemas";

describe("account settings schemas", () => {
  it("normalizes a valid profile name", () => {
    expect(profileSchema.parse({ displayName: "  Ada Lovelace  " })).toEqual({
      displayName: "Ada Lovelace",
    });
  });

  it("requires a verified and distinct password change", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "old-password",
        password: "new-password",
        confirmPassword: "different-password",
      }).success,
    ).toBe(false);

    expect(
      changePasswordSchema.safeParse({
        currentPassword: "same-password",
        password: "same-password",
        confirmPassword: "same-password",
      }).success,
    ).toBe(false);
  });

  it("accepts an email-shaped account confirmation", () => {
    expect(
      deleteAccountSchema.parse({ confirmation: " member@example.com " }),
    ).toEqual({ confirmation: "member@example.com" });
  });
});
