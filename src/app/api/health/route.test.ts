import { afterEach, describe, expect, it, vi } from "vitest";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("authenticates the Supabase health probe with the publishable key", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://example-project.supabase.co",
    );
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_example",
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example-project.supabase.co/auth/v1/health",
      expect.objectContaining({
        headers: { apikey: "sb_publishable_example" },
      }),
    );
  });
});
