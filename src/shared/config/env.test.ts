import { describe, expect, it } from "vitest";

import { parsePublicEnvironment } from "./env";

describe("parsePublicEnvironment", () => {
  it("uses a safe local site URL before Supabase is configured", () => {
    expect(parsePublicEnvironment({})).toEqual({
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
    });
  });

  it("accepts a complete Supabase configuration", () => {
    expect(
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toEqual({
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    });
  });

  it("rejects partial Supabase configuration", () => {
    expect(() =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow("Supabase URL and publishable key must be configured together");
  });

  it("accepts a Sentry DSN and rejects malformed monitoring URLs", () => {
    expect(
      parsePublicEnvironment({
        NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
      }).NEXT_PUBLIC_SENTRY_DSN,
    ).toBe("https://public@example.ingest.sentry.io/1");

    expect(() =>
      parsePublicEnvironment({ NEXT_PUBLIC_SENTRY_DSN: "not-a-url" }),
    ).toThrow();
  });
});
