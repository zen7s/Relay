import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/shared/config/env";
import { getSafeRedirectPath } from "@/shared/lib";

import type { Database } from "./database.types";

const guestOnlyPaths = new Set(["/login", "/signup", "/forgot-password"]);
const protectedPrefixes = [
  "/onboarding",
  "/reset-password",
  "/projects",
  "/team",
  "/reports",
  "/settings",
  "/help",
];

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    protectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicConfig();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const pathname = request.nextUrl.pathname;
  const isAuthenticated = typeof claims?.sub === "string";

  if (!isAuthenticated && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      getSafeRedirectPath(`${pathname}${request.nextUrl.search}`),
    );

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && guestOnlyPaths.has(pathname)) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/";
    appUrl.search = "";
    return NextResponse.redirect(appUrl);
  }

  return response;
}
