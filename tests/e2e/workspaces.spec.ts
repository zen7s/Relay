import { expect, test } from "@playwright/test";

import { seededUser } from "./fixtures";
import { getMailLink, signInSeededUser } from "./support/auth";

test.describe("workspace lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  test("creates, switches, invites, transfers ownership, and leaves", async ({
    context,
    page,
  }) => {
    test.slow();

    const workspaceName = "Relay Client Workspace";
    const workspaceSlug = "relay-e2e-sandbox";
    const invitedEmail = `relay-workspace-${Date.now()}@example.com`;
    const invitedPassword = "Relay-Invite-2026!";

    await signInSeededUser(page);
    await page
      .locator("aside")
      .getByRole("button", { name: "Switch workspace" })
      .last()
      .click();
    await page.getByRole("menuitem", { name: "Create workspace" }).click();
    await page.getByLabel("Workspace name").fill("Relay E2E Sandbox");
    await page.getByRole("button", { name: "Create workspace" }).click();
    await expect(page).toHaveURL("/w/relay-e2e-sandbox");

    await page.goto("/w/relay-e2e-sandbox/settings");
    await page.getByLabel("Workspace name").fill(workspaceName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/saved=workspace/);
    await expect(page.getByRole("status")).toContainText("settings saved");

    await page
      .locator("aside")
      .getByRole("button", { name: "Switch workspace" })
      .last()
      .click();
    await page
      .getByRole("menuitem", { name: seededUser.workspaceName })
      .click();
    await expect(page).toHaveURL(`/w/${seededUser.workspaceSlug}`);

    await page
      .locator("aside")
      .getByRole("button", { name: "Switch workspace" })
      .last()
      .click();
    await page.getByRole("menuitem", { name: workspaceName }).click();
    await expect(page).toHaveURL(`/w/${workspaceSlug}`);

    await page.goto(`/w/${workspaceSlug}/members`);
    await page.getByLabel("Email address").fill(invitedEmail);
    await page.getByLabel("Role").selectOption("member");
    await page.getByRole("button", { name: "Send invite" }).click();
    await expect(page.getByRole("status")).toContainText("Invitation sent");

    const inviteLink = await getMailLink(
      invitedEmail,
      /join relay client workspace/i,
    );
    await context.clearCookies();
    await page.goto(inviteLink);
    await expect(
      page.getByRole("heading", { name: `Join ${workspaceName}` }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Create account" }).click();
    await page.getByLabel("Full name").fill("Jamie Quinn");
    await page.getByLabel("Work email").fill(invitedEmail);
    await page.getByLabel("Password", { exact: true }).fill(invitedPassword);
    await page.getByLabel("Confirm password").fill(invitedPassword);
    await page.getByRole("button", { name: "Create account" }).click();

    const confirmationLink = await getMailLink(invitedEmail, /confirm/i);
    await page.goto(confirmationLink);
    await expect(
      page.getByRole("heading", { name: `Join ${workspaceName}` }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Accept invitation" }).click();
    await expect(page).toHaveURL(`/w/${workspaceSlug}`);

    await context.clearCookies();
    await signInSeededUser(page);
    await page.goto(`/w/${workspaceSlug}/members`);
    const member = page.getByRole("article", {
      name: new RegExp(invitedEmail),
    });
    await expect(member).toBeVisible();
    await member.getByLabel("Role for Jamie Quinn").selectOption("admin");
    await member.getByRole("button", { name: "Update" }).click();
    await expect(member.getByLabel("Role for Jamie Quinn")).toHaveValue(
      "admin",
    );

    await page
      .getByLabel("New Owner")
      .selectOption({ label: `Jamie Quinn (${invitedEmail})` });
    await page.getByRole("button", { name: "Transfer ownership" }).click();
    await expect(page).toHaveURL(/transferred=1/);
    await expect(page.getByRole("status")).toContainText(
      "Ownership transferred",
    );

    await page.goto(`/w/${workspaceSlug}/settings`);
    await page.getByRole("button", { name: "Leave workspace" }).click();
    await expect(page).toHaveURL(`/w/${seededUser.workspaceSlug}`);

    await context.clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(invitedEmail);
    await page.getByLabel("Password", { exact: true }).fill(invitedPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(`/w/${workspaceSlug}`);
    await page.goto(`/w/${workspaceSlug}/members`);
    await expect(
      page
        .getByRole("article", { name: new RegExp(invitedEmail) })
        .getByText("Owner"),
    ).toBeVisible();

    await page.goto(`/w/${workspaceSlug}/settings`);
    await page
      .getByLabel(`Type ${workspaceName} to confirm`)
      .fill(workspaceName);
    await page.getByRole("button", { name: "Delete workspace" }).click();
    await expect(page).toHaveURL("/onboarding");
  });
});
