import { z } from "zod";

const projectNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a project name.")
  .max(100, "Use no more than 100 characters.");

const projectKeySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        /^[A-Z][A-Z0-9]{1,9}$/,
        "Use 2–10 letters or numbers, starting with a letter.",
      ),
  );

const projectColorSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^#[0-9A-F]{6}$/, "Choose a valid project color."));

const projectDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Use no more than 2,000 characters.");

export const projectReferenceSchema = z.object({
  workspaceId: z.uuid(),
  workspaceSlug: z.string().min(2).max(48),
  projectId: z.uuid(),
});

export const createProjectSchema = z.object({
  workspaceId: z.uuid(),
  workspaceSlug: z.string().min(2).max(48),
  name: projectNameSchema,
  key: projectKeySchema,
  color: projectColorSchema,
  description: projectDescriptionSchema,
});

export const updateProjectSchema = createProjectSchema.extend({
  projectId: z.uuid(),
});
