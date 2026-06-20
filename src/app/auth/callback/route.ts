import { type NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/shared/api/supabase/server";
import { publicEnvironment } from "@/shared/config/env";
import { getSafeRedirectPath } from "@/shared/lib";

function getRedirectOrigin(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const host = request.headers.get("host");

    if (host) {
      return `${request.nextUrl.protocol}//${host}`;
    }
  }

  return new URL(publicEnvironment.NEXT_PUBLIC_SITE_URL).origin;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = getSafeRedirectPath(
    request.nextUrl.searchParams.get("next"),
    "/",
  );
  const origin = getRedirectOrigin(request);

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set(
    "error",
    "This sign-in link is invalid or expired. Please try again.",
  );
  return NextResponse.redirect(loginUrl);
}
