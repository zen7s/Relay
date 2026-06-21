import { execFileSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

import { seededMember, seededUser } from "./fixtures";

type LocalSupabaseStatus = {
  API_URL: string;
  SECRET_KEY: string;
};

function getLocalSupabaseStatus() {
  const output = execFileSync(
    "pnpm",
    ["exec", "supabase", "status", "-o", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );

  return JSON.parse(output) as LocalSupabaseStatus;
}

export default async function globalSetup() {
  const status = getLocalSupabaseStatus();
  const admin = createClient(status.API_URL, status.SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: users, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  const seededEmails = new Set([seededUser.email, seededMember.email]);
  const existingUsers = users.users.filter((user) =>
    seededEmails.has(user.email ?? ""),
  );

  await admin
    .from("workspaces")
    .delete()
    .in("slug", [
      seededUser.workspaceSlug,
      "relay-e2e-sandbox",
      "relay-client-workspace",
    ]);

  for (const existingUser of existingUsers) {
    const { error } = await admin.auth.admin.deleteUser(existingUser.id);
    if (error) throw error;
  }

  const { data, error: createError } = await admin.auth.admin.createUser({
    email: seededUser.email,
    password: seededUser.password,
    email_confirm: true,
    user_metadata: { full_name: seededUser.displayName },
  });

  if (createError) {
    throw createError;
  }

  const { data: memberData, error: memberCreateError } =
    await admin.auth.admin.createUser({
      email: seededMember.email,
      password: seededMember.password,
      email_confirm: true,
      user_metadata: { full_name: seededMember.displayName },
    });

  if (memberCreateError) {
    throw memberCreateError;
  }

  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .insert({
      name: seededUser.workspaceName,
      slug: seededUser.workspaceSlug,
      created_by: data.user.id,
    })
    .select("id")
    .single();

  if (workspaceError) {
    throw workspaceError;
  }

  const { error: membershipError } = await admin
    .from("workspace_members")
    .insert([
      {
        workspace_id: workspace.id,
        user_id: data.user.id,
        role: "owner",
      },
      {
        workspace_id: workspace.id,
        user_id: memberData.user.id,
        role: "member",
      },
    ]);

  if (membershipError) {
    throw membershipError;
  }
}
