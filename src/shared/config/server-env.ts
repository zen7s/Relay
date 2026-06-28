import "server-only";

import { parseServerEnvironment } from "./server-env.schema";

export const serverEnvironment = parseServerEnvironment({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || undefined,
  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  INVITATION_FROM_EMAIL: process.env.INVITATION_FROM_EMAIL || undefined,
  MAILPIT_SMTP_URL: process.env.MAILPIT_SMTP_URL || undefined,
});
