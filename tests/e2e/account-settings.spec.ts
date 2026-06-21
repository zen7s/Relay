import { execFileSync } from "node:child_process";

import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { seededUser } from "./fixtures";
import { signInUser } from "./support/auth";

const account = {
  email: "relay.account.e2e@example.com",
  password: "Relay-Account-2026!",
  nextPassword: "Relay-Account-2027!",
};

type LocalSupabaseStatus = { API_URL: string; SECRET_KEY: string };

let admin: SupabaseClient;
let userId = "";

test.beforeAll(async () => {
  const status = JSON.parse(
    execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  ) as LocalSupabaseStatus;
  admin = createClient(status.API_URL, status.SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const previous = existing.users.find((user) => user.email === account.email);
  if (previous) await admin.auth.admin.deleteUser(previous.id);

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { full_name: "Profile Tester" },
  });
  if (error) throw error;
  userId = data.user.id;

  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", seededUser.workspaceSlug)
    .single();
  if (workspaceError) throw workspaceError;

  const { error: membershipError } = await admin
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: userId, role: "member" });
  if (membershipError) throw membershipError;
});

test.afterAll(async () => {
  if (!userId) return;
  const { data } = await admin.auth.admin.getUserById(userId);
  if (data.user) await admin.auth.admin.deleteUser(userId);
});

test("manages profile, theme, password, logout, and account deletion", async ({
  page,
}) => {
  test.slow();

  await signInUser(page, account);
  await expect(page).toHaveURL(`/w/${seededUser.workspaceSlug}`);

  await page.getByLabel("Open account menu").first().click();
  await page.getByRole("menuitem", { name: "Personal settings" }).click();
  await expect(page).toHaveURL(
    `/w/${seededUser.workspaceSlug}/settings/profile`,
  );
  await expect(page.getByLabel("Email")).toHaveValue(account.email);

  await page.getByLabel("Display name").fill("Relay Profile");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile updated.")).toBeVisible();
  await expect(page.getByText("Relay Profile").first()).toBeVisible();

  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  await page.getByLabel("Choose image").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: onePixelPng,
  });
  await page.getByRole("button", { name: "Upload avatar" }).click();
  await expect(page.getByText("Avatar updated.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Your avatar" })).toBeVisible();

  await page.getByRole("radio", { name: /^Dark/ }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByLabel("Current password").fill(account.password);
  await page
    .getByLabel("New password", { exact: true })
    .fill(account.nextPassword);
  await page.getByLabel("Confirm new password").fill(account.nextPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Password updated.")).toBeVisible();

  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL("/login");

  await signInUser(page, {
    email: account.email,
    password: account.nextPassword,
  });
  await expect(page).toHaveURL(`/w/${seededUser.workspaceSlug}`);
  await page.goto(`/w/${seededUser.workspaceSlug}/settings/profile`);

  await page.getByLabel(`Type ${account.email} to confirm`).fill(account.email);
  await page
    .getByRole("button", { name: "Delete account permanently" })
    .click();
  await expect(page).toHaveURL(/\/login\?deleted=1$/);

  await signInUser(page, {
    email: account.email,
    password: account.nextPassword,
  });
  await expect(page.getByText(/Email or password is incorrect/i)).toBeVisible();
});
