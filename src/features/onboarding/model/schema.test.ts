import { describe, expect, it } from "vitest";

import { onboardingSchema } from "./schema";

describe("onboardingSchema", () => {
  it("trims valid profile and workspace names", () => {
    expect(
      onboardingSchema.parse({
        displayName: "  Alex Morgan  ",
        workspaceName: "  Northstar Studio  ",
      }),
    ).toEqual({
      displayName: "Alex Morgan",
      workspaceName: "Northstar Studio",
    });
  });

  it("rejects empty names", () => {
    expect(
      onboardingSchema.safeParse({ displayName: " ", workspaceName: "x" })
        .success,
    ).toBe(false);
  });
});
