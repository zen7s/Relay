import { expect, test, type Page } from "@playwright/test";

import { seededMember, seededUser } from "./fixtures";
import { signInSeededUser, signInUser } from "./support/auth";

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}

test.describe("project lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  test("creates, edits, archives, and restores a project board", async ({
    page,
  }) => {
    await signInSeededUser(page);
    await page.goto(`/w/${seededUser.workspaceSlug}/projects`);

    await expect(
      page.getByRole("heading", { name: "Create your first project" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "New project" }).first().click();
    await page.getByLabel("Project name").fill("Relay Website");
    await page.getByLabel("Key").fill("web");
    await page.getByRole("button", { name: "Rose" }).click();
    await page
      .getByLabel("Description")
      .fill("Build and launch the Relay marketing site.");
    await page.getByRole("button", { name: "Create project" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/w/${seededUser.workspaceSlug}/p/[0-9a-f-]+/board`),
    );
    await expect(
      page.getByRole("heading", { name: "Relay Website" }),
    ).toBeVisible();
    for (const column of [
      "Backlog",
      "To do",
      "In progress",
      "Review",
      "Done",
    ]) {
      await expect(page.getByRole("article", { name: column })).toBeVisible();
    }
    await expect(
      page.getByRole("link", { name: "Projects", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    await page.setViewportSize({ width: 320, height: 780 });
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("article", { name: "Backlog" })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/w/${seededUser.workspaceSlug}/projects`);
    const project = page.getByRole("article", { name: "Relay Website" });
    await project.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Project name").fill("Relay Web Platform");
    await page.getByLabel("Key").fill("platform");
    await page.getByRole("button", { name: "Save project" }).click();

    await expect(page).toHaveURL(/\/projects\?saved=/);
    await expect(page.getByRole("status")).toContainText(
      "Project details saved",
    );
    const updatedProject = page.getByRole("article", {
      name: "Relay Web Platform",
    });
    await expect(
      updatedProject.getByText("PLATFORM", { exact: true }),
    ).toBeVisible();

    await updatedProject.getByRole("button", { name: "Archive" }).click();
    await page.getByRole("button", { name: "Archive project" }).click();
    await expect(page).toHaveURL(/archived=1&changed=archived/);
    await expect(page.getByRole("status")).toContainText("Project archived");

    const archivedProject = page.getByRole("article", {
      name: "Relay Web Platform",
    });
    await expect(
      archivedProject.getByRole("button", { name: "Edit" }),
    ).toHaveCount(0);
    await archivedProject.getByRole("link", { name: "Open board" }).click();
    await expect(page.getByRole("status")).toContainText(
      "This project is archived",
    );
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);

    await page.goto(`/w/${seededUser.workspaceSlug}/projects?archived=1`);
    await page
      .getByRole("article", { name: "Relay Web Platform" })
      .getByRole("button", { name: "Restore" })
      .click();
    await page.getByRole("button", { name: "Restore project" }).click();
    await expect(page).toHaveURL(/projects\?changed=restored/);
    await expect(page.getByRole("status")).toContainText("Project restored");
    await expect(
      page.getByRole("article", { name: "Relay Web Platform" }),
    ).toBeVisible();

    await page.context().clearCookies();
    await signInUser(page, seededMember);
    await expect(page).toHaveURL(`/w/${seededUser.workspaceSlug}`);
    await page.goto(`/w/${seededUser.workspaceSlug}/projects`);
    const memberProject = page.getByRole("article", {
      name: "Relay Web Platform",
    });
    await expect(memberProject).toBeVisible();
    await expect(page.getByRole("button", { name: "New project" })).toHaveCount(
      0,
    );
    await expect(
      memberProject.getByRole("button", { name: "Edit" }),
    ).toHaveCount(0);
    await expect(
      memberProject.getByRole("button", { name: "Archive" }),
    ).toHaveCount(0);
  });
});
