import { NextResponse } from "next/server";

import { publicEnvironment } from "@/shared/config/env";

export const dynamic = "force-dynamic";

type ServiceStatus = "ok" | "degraded";

export async function GET() {
  const startedAt = performance.now();
  let supabase: ServiceStatus = "degraded";

  if (
    publicEnvironment.NEXT_PUBLIC_SUPABASE_URL &&
    publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    try {
      const response = await fetch(
        `${publicEnvironment.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`,
        {
          cache: "no-store",
          headers: {
            apikey: publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          },
          signal: AbortSignal.timeout(3_000),
        },
      );
      supabase = response.ok ? "ok" : "degraded";
    } catch {
      supabase = "degraded";
    }
  }

  const status: ServiceStatus = supabase === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      checks: { supabase },
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      durationMs: Math.round(performance.now() - startedAt),
    },
    {
      status: status === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
