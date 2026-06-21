import { z } from "zod";

export const workspaceNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(80, "Use no more than 80 characters."),
});

export const workspaceReferenceSchema = z.object({
  workspaceId: z.uuid(),
  workspaceSlug: z.string().min(2).max(48),
});

export const renameWorkspaceSchema = workspaceNameSchema.extend(
  workspaceReferenceSchema.shape,
);

export const deleteWorkspaceSchema = workspaceReferenceSchema.extend({
  workspaceName: z.string().min(1).max(80),
  confirmation: z.string(),
});

export const memberMutationSchema = workspaceReferenceSchema.extend({
  userId: z.uuid(),
});

export const updateMemberRoleSchema = memberMutationSchema.extend({
  role: z.enum(["admin", "member"]),
});

export const transferOwnershipSchema = memberMutationSchema;
