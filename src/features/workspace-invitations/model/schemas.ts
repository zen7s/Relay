import { z } from "zod";

export const inviteMemberSchema = z.object({
  workspaceId: z.uuid(),
  workspaceSlug: z.string().min(2).max(48),
  email: z
    .string()
    .trim()
    .pipe(
      z.email("Enter a valid email address.").max(320, "Email is too long."),
    )
    .transform((email) => email.trim().toLowerCase()),
  role: z.enum(["admin", "member"]),
});

export const invitationReferenceSchema = z.object({
  invitationId: z.uuid(),
  workspaceId: z.uuid(),
  workspaceSlug: z.string().min(2).max(48),
});

export const invitationTokenSchema = z
  .string()
  .min(16, "Invitation token is invalid.")
  .max(512, "Invitation token is invalid.");
