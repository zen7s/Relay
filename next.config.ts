import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

import { publicEnvironment } from "./src/shared/config/env";

const isProduction = process.env.VERCEL_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";
const supabaseOrigin = publicEnvironment.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(publicEnvironment.NEXT_PUBLIC_SUPABASE_URL).origin
  : undefined;
const supabaseWebSocketOrigin = supabaseOrigin?.replace(/^http/, "ws");
const sentryOrigin = publicEnvironment.NEXT_PUBLIC_SENTRY_DSN
  ? new URL(publicEnvironment.NEXT_PUBLIC_SENTRY_DSN).origin
  : undefined;

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${supabaseWebSocketOrigin ? ` ${supabaseWebSocketOrigin}` : ""}${sentryOrigin ? ` ${sentryOrigin}` : ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  ...(process.env.SENTRY_AUTH_TOKEN
    ? { authToken: process.env.SENTRY_AUTH_TOKEN }
    : {}),
  ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
  ...(process.env.SENTRY_PROJECT
    ? { project: process.env.SENTRY_PROJECT }
    : {}),
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
  telemetry: false,
});
