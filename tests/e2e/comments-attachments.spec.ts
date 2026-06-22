import {
  expect,
  test,
  type Browser,
  type Page,
  type Route,
} from "@playwright/test";

import { seededMember, seededUser } from "./fixtures";
import { signInSeededUser, signInUser } from "./support/auth";

async function createCollaborationTask(page: Page) {
  await page.goto(`/w/${seededUser.workspaceSlug}/projects`);
  await page.getByRole("button", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Collaboration Hub");
  await page.getByLabel("Key").fill("COLLAB");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/board$/);

  const backlog = page.getByRole("article", { name: "Backlog" });
  await backlog.getByRole("button", { name: "Add task" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill("Discussion draft");
  await dialog
    .getByLabel("Description")
    .fill("Collect review notes and final handoff files.");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page).toHaveURL(/created=/);

  return new URL(page.url()).pathname;
}

async function openTaskPanel(page: Page, boardPath: string) {
  await page.goto(`${boardPath}?q=discussion`);
  const task = page.getByRole("article", { name: "Discussion draft" });
  await task.getByRole("link", { name: "Discussion draft" }).click();
  await expect(page).toHaveURL(/q=discussion&task=[0-9a-f-]+/);
  const panel = page.getByRole("dialog", { name: "Discussion draft" });
  await expect(panel).toBeVisible();
  await expect(
    panel.getByText("Collect review notes and final handoff files."),
  ).toBeVisible();
  await expect(panel.getByLabel("Comments realtime status")).toContainText(
    "Live",
  );
  return panel;
}

async function openMemberObserver(browser: Browser, taskUrl: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInUser(page, seededMember);
  await expect(page).toHaveURL(`/w/${seededUser.workspaceSlug}`);
  await page.goto(taskUrl);
  const panel = page.getByRole("dialog", { name: "Discussion draft" });
  await expect(panel.getByLabel("Comments realtime status")).toContainText(
    "Live",
  );
  return { context, page, panel };
}

test("supports realtime comments and private task attachments", async ({
  page,
  browser,
}) => {
  test.slow();

  await signInSeededUser(page);
  const boardPath = await createCollaborationTask(page);
  const panel = await openTaskPanel(page, boardPath);
  const taskLocation = new URL(page.url());
  const taskUrl = `${taskLocation.pathname}${taskLocation.search}`;

  await panel.getByLabel("Write a comment").fill("Ready for team review.");
  await panel.getByRole("button", { name: "Post comment" }).click();
  await expect(panel.getByText("Ready for team review.")).toBeVisible();

  const observer = await openMemberObserver(browser, taskUrl);
  try {
    await expect(
      observer.panel.getByText("Ready for team review."),
    ).toBeVisible();

    await panel
      .getByRole("button", { name: "Edit comment by Alex Morgan" })
      .click();
    await panel
      .getByLabel("Edit comment by Alex Morgan")
      .fill("Ready for final team review.");
    await panel.getByRole("button", { name: "Save" }).click();
    await expect(
      observer.panel.getByText("Ready for final team review."),
    ).toBeVisible();

    await observer.panel
      .getByLabel("Write a comment")
      .fill("Member feedback received.");
    await observer.panel.getByRole("button", { name: "Post comment" }).click();
    const memberComment = panel.getByRole("article", {
      name: "Comment by Morgan Lee",
    });
    await expect(
      memberComment.getByText("Member feedback received."),
    ).toBeVisible();
    await expect(
      memberComment.getByRole("button", {
        name: "Edit comment by Morgan Lee",
      }),
    ).toHaveCount(0);

    await observer.panel
      .getByRole("button", { name: "Delete comment by Morgan Lee" })
      .click();
    await expect(memberComment).toHaveCount(0);
  } finally {
    await observer.context.close();
  }

  const uploadInput = panel.getByLabel("Upload attachment");
  const delayedUploadPattern = "**/storage/v1/upload/resumable**";
  const delayUpload = async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue().catch(() => undefined);
  };
  await page.route(delayedUploadPattern, delayUpload);
  await uploadInput.setInputFiles({
    name: "cancelled.txt",
    mimeType: "text/plain",
    buffer: Buffer.alloc(512 * 1024, "c"),
  });
  await expect(panel.getByLabel("Attachment upload progress")).toBeVisible();
  await panel.getByRole("button", { name: "Cancel attachment upload" }).click();
  await expect(page.getByText("Upload cancelled.")).toBeVisible();
  await expect(panel.getByLabel("Attachment upload progress")).toHaveCount(0);
  await expect(
    panel.getByRole("article", { name: "cancelled.txt" }),
  ).toHaveCount(0);
  await page.unroute(delayedUploadPattern, delayUpload);

  await uploadInput.setInputFiles({
    name: "handoff.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Relay private handoff"),
  });
  const attachment = panel.getByRole("article", { name: "handoff.txt" });
  await expect(attachment).toBeVisible();
  await expect(attachment).toContainText("uploaded by Alex Morgan");

  const downloadPromise = page.waitForEvent("download");
  await attachment
    .getByRole("button", { name: "Download handoff.txt" })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("handoff.txt");

  await uploadInput.setInputFiles({
    name: "unsafe.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("not allowed"),
  });
  await expect(
    page.getByText(
      "Use an image, PDF, TXT, CSV, Word, Excel, or PowerPoint file.",
    ),
  ).toBeVisible();

  await uploadInput.setInputFiles({
    name: "too-large.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(page.getByText("Files must be 10 MB or smaller.")).toBeVisible();

  await attachment.getByRole("button", { name: "Delete handoff.txt" }).click();
  await expect(attachment).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 780 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await expect(panel).toBeVisible();

  await panel.getByRole("button", { name: "Close task details" }).click();
  await expect(page).toHaveURL(`${boardPath}?q=discussion`);
  await expect(panel).toHaveCount(0);
});
