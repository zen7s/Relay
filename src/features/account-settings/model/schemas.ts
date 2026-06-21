import { z } from "zod";

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Use no more than 80 characters."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(72, "Use no more than 72 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.password !== values.currentPassword, {
    message: "Choose a password you have not just used.",
    path: ["password"],
  });

export const deleteAccountSchema = z.object({
  confirmation: z.string().trim().email("Enter your account email."),
});
