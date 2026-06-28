import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "./server-env.schema";

describe("parseServerEnvironment", () => {
  it("uses local Mailpit defaults when production email is not configured", () => {
    expect(parseServerEnvironment({})).toEqual({
      INVITATION_FROM_EMAIL: "Relay <onboarding@resend.dev>",
      MAILPIT_SMTP_URL: "smtp://127.0.0.1:54325",
    });
  });

  it("requires an explicit verified sender when Resend is enabled", () => {
    expect(() =>
      parseServerEnvironment({ RESEND_API_KEY: "re_test_key" }),
    ).toThrow(
      "INVITATION_FROM_EMAIL must be configured when RESEND_API_KEY is set",
    );
  });

  it("accepts production invitation email delivery configuration", () => {
    expect(
      parseServerEnvironment({
        RESEND_API_KEY: "re_test_key",
        INVITATION_FROM_EMAIL: "Relay <invites@example.com>",
      }),
    ).toMatchObject({
      RESEND_API_KEY: "re_test_key",
      INVITATION_FROM_EMAIL: "Relay <invites@example.com>",
      MAILPIT_SMTP_URL: "smtp://127.0.0.1:54325",
    });
  });

  it("rejects malformed Mailpit SMTP URLs", () => {
    expect(() =>
      parseServerEnvironment({ MAILPIT_SMTP_URL: "localhost:54325" }),
    ).toThrow();
  });
});
