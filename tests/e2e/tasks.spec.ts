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

test.describe("task lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  test("creates, filters, moves, archives, and restores tasks", async ({
    page,
  }) => {
    test.slow();

    await signInSeededUser(page);
    await page.goto(`/w/${seededUser.workspaceSlug}/projects`);
    await page.getByRole("button", { name: "New project" }).first().click();
    await page.getByLabel("Project name").fill("Task Workflow");
    await page.getByLabel("Key").fill("TASKS");
    await page
      .getByLabel("Description")
      .fill("Exercise the complete task workflow.");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page).toHaveURL(/\/board$/);
    const boardPath = new URL(page.url()).pathname;

    await page.getByRole("button", { name: "Labels" }).click();
    await page.getByLabel("New label").fill("Feature");
    await page.getByRole("button", { name: "Create label" }).click();
    await expect(page.getByRole("status")).toContainText("Label created");
    await expect(
      page.getByRole("dialog").getByText("Feature", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "New task" }).click();
    const createTaskDialog = page.getByRole("dialog");
    await createTaskDialog.getByLabel("Title").fill("Prepare launch brief");
    await createTaskDialog
      .getByLabel("Description")
      .fill("Define the release story and acceptance notes.");
    await createTaskDialog.getByLabel("Priority").selectOption("high");
    await createTaskDialog
      .getByLabel("Assignee")
      .selectOption({ label: "Alex Morgan" });
    await createTaskDialog.getByLabel("Due date").fill("2026-07-01");
    await createTaskDialog.getByLabel("Feature").check();
    await createTaskDialog.getByRole("button", { name: "Create task" }).click();

    await expect(page).toHaveURL(/created=/);
    const backlog = page.getByRole("article", { name: "Backlog" });
    const task = backlog.getByRole("article", {
      name: "Prepare launch brief",
    });
    await expect(task).toBeVisible();
    await expect(task.getByText("High", { exact: true })).toBeVisible();
    await expect(task.getByText("Feature", { exact: true })).toBeVisible();

    await task
      .getByRole("button", { name: "Edit Prepare launch brief" })
      .click();
    const editTaskDialog = page.getByRole("dialog");
    await editTaskDialog.getByLabel("Title").fill("Publish launch brief");
    await editTaskDialog.getByLabel("Priority").selectOption("urgent");
    await editTaskDialog.getByRole("button", { name: "Save task" }).click();
    await expect(page).toHaveURL(/saved=/);
    await expect(page.getByRole("status")).toContainText("Task details saved");

    await page.getByLabel("Search tasks").fill("Publish");
    await page.getByLabel("Filter by priority").selectOption("urgent");
    await page.getByLabel("Filter by label").selectOption({ label: "Feature" });
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/q=Publish/);
    await expect(page.getByRole("status")).toContainText("Showing 1 of 1");

    await page.getByRole("link", { name: "Clear filters" }).click();
    const updatedTask = page.getByRole("article", {
      name: "Publish launch brief",
    });
    await updatedTask
      .getByLabel("Move Publish launch brief to")
      .selectOption({ label: "In progress" });
    await updatedTask
      .getByRole("button", { name: "Move Publish launch brief" })
      .click();
    await expect(
      page
        .getByRole("article", { name: "In progress" })
        .getByRole("article", { name: "Publish launch brief" }),
    ).toBeVisible();

    await page
      .getByRole("article", { name: "Publish launch brief" })
      .getByRole("button", { name: "Archive Publish launch brief" })
      .click();
    await expect(page).toHaveURL(/archived=1&changed=archived/);
    await expect(page.getByRole("status")).toContainText("Task archived");
    await expect(
      page.getByRole("article", { name: "Publish launch brief" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Restore task" }).click();
    await expect(page).toHaveURL(/changed=restored/);
    await expect(page.getByRole("status")).toContainText("Task restored");
    await expect(
      page
        .getByRole("article", { name: "In progress" })
        .getByRole("article", { name: "Publish launch brief" }),
    ).toBeVisible();

    await page.context().clearCookies();
    await signInUser(page, seededMember);
    await expect(page).toHaveURL(`/w/${seededUser.workspaceSlug}`);
    await page.goto(boardPath);
    await expect(page.getByRole("button", { name: "Labels" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "New task" })).toBeVisible();

    const todo = page.getByRole("article", { name: "To do" });
    await todo.getByRole("button", { name: "Add task" }).click();
    const memberTaskDialog = page.getByRole("dialog");
    await memberTaskDialog.getByLabel("Title").fill("Member follow-up");
    await memberTaskDialog.getByRole("button", { name: "Create task" }).click();
    await expect(page).toHaveURL(/created=/);
    await expect(
      page
        .getByRole("article", { name: "To do" })
        .getByRole("article", { name: "Member follow-up" }),
    ).toBeVisible();

    await page.setViewportSize({ width: 320, height: 780 });
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("article", { name: "Backlog" })).toBeVisible();
  });
});
