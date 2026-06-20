import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/shared/config/env";

import type { Database } from "./database.types";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicConfig();

  return createBrowserClient<Database>(url, publishableKey);
}
