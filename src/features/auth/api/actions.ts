"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { publicEnvironment } from "@/shared/config/env";
import { getSafeRedirectPath } from "@/shared/lib";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

import type { AuthActionState } from "../model/action-state";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "../model/schemas";

function getValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(
    keys.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === "string" ? value : ""];
    }),
  );
}

function validationError(
  error: { flatten: () => { fieldErrors: Record<string, string[]> } },
  values: Record<string, string>,
): AuthActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors,
    values,
  };
}

function getAuthErrorMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "email_not_confirmed":
      return "Confirm your email before signing in.";
    case "weak_password":
      return "Choose a stronger password.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return fallback;
  }
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      // Fall through to the configured canonical URL.
    }
  }

  return new URL(publicEnvironment.NEXT_PUBLIC_SITE_URL).origin;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const values = getValues(formData, ["email", "next"]);
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!result.success) {
    return validationError(result.error, values);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(
        error.code,
        "We could not sign you in. Please try again.",
      ),
      values,
    };
  }

  revalidatePath("/", "layout");
  redirect(getSafeRedirectPath(result.data.next));
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const values = getValues(formData, ["fullName", "email"]);
  const result = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return validationError(result.error, values);
  }

  const supabase = await createServerSupabaseClient();
  const origin = await getRequestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { full_name: result.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(
        error.code,
        "We could not create your account. Please try again.",
      ),
      values,
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    status: "success",
    message:
      "Check your inbox to confirm your email. The link will continue your setup.",
    values,
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const values = getValues(formData, ["email"]);
  const result = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!result.success) {
    return validationError(result.error, values);
  }

  const supabase = await createServerSupabaseClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(
    result.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(
        error.code,
        "We could not send a reset email. Please try again.",
      ),
      values,
    };
  }

  return {
    status: "success",
    message:
      "If an account exists for that email, a password reset link is on its way.",
    values,
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return validationError(result.error, {});
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: getAuthErrorMessage(
        error.code,
        "This reset link is invalid or expired. Request a new one.",
      ),
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/login");
}
