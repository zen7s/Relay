import "server-only";

import { execFileSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/shared/config/env";
import { serverEnvironment } from "@/shared/config/server-env";

import type { Database } from "./database.types";

type LocalSupabaseStatus = { SECRET_KEY?: string };

function getLocalSecretKey(url: string) {
  const hostname = new URL(url).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") return null;

  try {
    const output = execFileSync(
      "pnpm",
      ["exec", "supabase", "status", "-o", "json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return (JSON.parse(output) as LocalSupabaseStatus).SECRET_KEY ?? null;
  } catch {
    return null;
  }
}

export function createAdminSupabaseClient() {
  const { url } = getSupabasePublicConfig();
  const secretKey =
    serverEnvironment.SUPABASE_SECRET_KEY ?? getLocalSecretKey(url);

  if (!secretKey) {
    throw new Error(
      "Account deletion is not configured. Set the server-only SUPABASE_SECRET_KEY.",
    );
  }

  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
