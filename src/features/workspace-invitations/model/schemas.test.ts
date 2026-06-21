import { describe, expect, it } from "vitest";

import { inviteMemberSchema, invitationTokenSchema } from "./schemas";

describe("workspace invitation schemas", () => {
  it("normalizes an invitation email and restricts roles", () => {
    const base = {
      workspaceId: "21000000-0000-4000-8000-000000000001",
      workspaceSlug: "product-lab",
      email: "  INVITEE@EXAMPLE.COM ",
    };

    expect(inviteMemberSchema.parse({ ...base, role: "member" }).email).toBe(
      "invitee@example.com",
    );
    expect(
      inviteMemberSchema.safeParse({ ...base, role: "owner" }).success,
    ).toBe(false);
  });

  it("rejects implausible invitation tokens", () => {
    expect(invitationTokenSchema.safeParse("short").success).toBe(false);
  });
});
