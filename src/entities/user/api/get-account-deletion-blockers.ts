import { createServerSupabaseClient } from "@/shared/api/supabase/server";

export type AccountDeletionBlocker = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
};

export async function getAccountDeletionBlockers(): Promise<
  AccountDeletionBlocker[]
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_account_deletion_blockers");

  if (error) throw error;

  return (data ?? []).map((workspace) => ({
    workspaceId: workspace.workspace_id,
    workspaceName: workspace.workspace_name,
    workspaceSlug: workspace.workspace_slug,
  }));
}
