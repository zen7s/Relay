"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/shared/api/supabase/server";

import { onboardingSchema } from "../model/schema";

export type OnboardingActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export async function completeOnboardingAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const result = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    workspaceName: formData.get("workspaceName"),
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: result.error.flatten().fieldErrors,
      values: {
        displayName:
          typeof formData.get("displayName") === "string"
            ? String(formData.get("displayName"))
            : "",
        workspaceName:
          typeof formData.get("workspaceName") === "string"
            ? String(formData.get("workspaceName"))
            : "",
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .rpc("complete_onboarding", {
      profile_display_name: result.data.displayName,
      requested_workspace_name: result.data.workspaceName,
    })
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: "We could not create your workspace. Please try again.",
      values: result.data,
    };
  }

  revalidatePath("/", "layout");
  redirect(`/w/${data.workspace_slug}`);
}
