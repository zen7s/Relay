import { z } from "zod";

export const onboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(80, "Use no more than 80 characters."),
  workspaceName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(80, "Use no more than 80 characters."),
});
