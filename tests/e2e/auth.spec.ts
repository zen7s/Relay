import { expect, test } from "@playwright/test";

import { getMailLink } from "./support/auth";

test("completes signup, email confirmation, onboarding, and password recovery", async ({
  context,
  page,
}, testInfo) => {
  test.slow();

  const email = `relay-flow-${Date.now()}-${testInfo.workerIndex}@example.com`;
  const originalPassword = "Relay-Flow-2026!";
  const newPassword = "Relay-Reset-2026!";

  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Taylor Reed");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(originalPassword);
  await page.getByLabel("Confirm password").fill(originalPassword);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("status")).toContainText("Check your inbox");

  const confirmationLink = await getMailLink(email, /confirm/i);
  await page.goto(confirmationLink);
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(
    page.getByRole("heading", { name: "Create your first workspace" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Use another account" }).click();
  await expect(page).toHaveURL("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(originalPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/onboarding");

  await page.getByLabel("Your name").fill("Taylor Reed");
  await page.getByLabel("Workspace name").fill("Taylor Studio");
  await page.getByRole("button", { name: "Create workspace" }).click();

  await expect(page).toHaveURL(/\/w\/[^/]+$/);
  await expect(
    page.getByRole("heading", { name: "Good morning, Taylor" }),
  ).toBeVisible();
  await expect(
    page.getByText("Taylor Studio", { exact: true }).first(),
  ).toBeVisible();

  await context.clearCookies();
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "reset link is on its way",
  );

  const resetLink = await getMailLink(email, /reset/i);
  await page.goto(resetLink);
  await expect(page).toHaveURL(/\/reset-password$/);

  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password").fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/\/w\/[^/]+$/);

  await context.clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/w\/[^/]+$/);

  await page.getByRole("button", { name: "Open account menu" }).last().click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/login");
});
