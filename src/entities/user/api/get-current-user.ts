import { cache } from "react";

import { createServerSupabaseClient } from "@/shared/api/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (typeof claims?.sub !== "string") {
    return null;
  }

  const email = typeof claims.email === "string" ? claims.email : "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email,
    displayName: profile?.display_name || email.split("@")[0] || "Relay member",
  };
});
