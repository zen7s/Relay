import { z } from "zod";

const defaultInvitationFromEmail = "Relay <onboarding@resend.dev>";

const serverEnvironmentSchema = z
  .object({
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    INVITATION_FROM_EMAIL: z.string().min(3).optional(),
    MAILPIT_SMTP_URL: z
      .url()
      .startsWith("smtp://", "Use an smtp:// URL.")
      .default("smtp://127.0.0.1:54325"),
  })
  .superRefine((environment, context) => {
    if (
      environment.RESEND_API_KEY &&
      environment.INVITATION_FROM_EMAIL === undefined
    ) {
      context.addIssue({
        code: "custom",
        message:
          "INVITATION_FROM_EMAIL must be configured when RESEND_API_KEY is set.",
        path: ["INVITATION_FROM_EMAIL"],
      });
    }
  })
  .transform((environment) => ({
    ...environment,
    INVITATION_FROM_EMAIL:
      environment.INVITATION_FROM_EMAIL ?? defaultInvitationFromEmail,
  }));

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  environment: Record<string, string | undefined>,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment);
}
