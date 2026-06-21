import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  INVITATION_FROM_EMAIL: z
    .string()
    .min(3)
    .default("Relay <onboarding@resend.dev>"),
  MAILPIT_SMTP_URL: z.url().default("smtp://127.0.0.1:54325"),
});

export const serverEnvironment = serverEnvironmentSchema.parse({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || undefined,
  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  INVITATION_FROM_EMAIL: process.env.INVITATION_FROM_EMAIL || undefined,
  MAILPIT_SMTP_URL: process.env.MAILPIT_SMTP_URL || undefined,
});
