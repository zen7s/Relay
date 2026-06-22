import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { seededUser } from "./fixtures";
import { signInSeededUser } from "./support/auth";

async function createTask(page: Page, columnName: string, title: string) {
  const column = page.getByRole("article", { name: columnName });
  await column.getByRole("button", { name: "Add task" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page).toHaveURL(/created=/);
  await expect(
    page
      .getByRole("article", { name: columnName })
      .getByRole("article", { name: title }),
  ).toBeVisible();
}

async function dragTaskToColumn(
  page: Page,
  taskTitle: string,
  columnName: string,
) {
  const handle = page.getByRole("button", { name: `Drag ${taskTitle}` });
  const column = page.getByRole("article", { name: columnName });
  const [handleBox, columnBox] = await Promise.all([
    handle.boundingBox(),
    column.boundingBox(),
  ]);

  if (!handleBox || !columnBox) {
    throw new Error("Drag source or target is outside the viewport.");
  }

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + 12,
    handleBox.y + handleBox.height / 2,
    { steps: 2 },
  );

  const overlay = page.locator('[data-testid="task-drag-overlay"]:visible');
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toBeVisible();
  const overlayBox = await overlay.boundingBox();
  const viewport = page.viewportSize();
  if (!overlayBox || !viewport) {
    throw new Error("Drag overlay or viewport dimensions are unavailable.");
  }
  expect(overlayBox.x).toBeGreaterThanOrEqual(0);
  expect(overlayBox.y).toBeGreaterThanOrEqual(0);
  expect(overlayBox.x + overlayBox.width).toBeLessThanOrEqual(viewport.width);
  expect(overlayBox.y + overlayBox.height).toBeLessThanOrEqual(viewport.height);

  await page.mouse.move(
    columnBox.x + columnBox.width / 2,
    Math.min(columnBox.y + columnBox.height - 72, 820),
    { steps: 16 },
  );
  await page.mouse.up();
  await expect(overlay).toHaveCount(0, { timeout: 100 });
}

async function touchDragTaskToColumn(
  page: Page,
  context: BrowserContext,
  taskTitle: string,
  columnName: string,
) {
  const handle = page.getByRole("button", { name: `Drag ${taskTitle}` });
  const column = page.getByRole("article", { name: columnName });
  const [handleBox, columnBox] = await Promise.all([
    handle.boundingBox(),
    column.boundingBox(),
  ]);

  if (!handleBox || !columnBox) {
    throw new Error("Touch drag source or target is outside the viewport.");
  }

  const session = await context.newCDPSession(page);
  const start = {
    x: handleBox.x + handleBox.width / 2,
    y: handleBox.y + handleBox.height / 2,
  };
  const target = {
    x: columnBox.x + columnBox.width / 2,
    y: Math.min(columnBox.y + columnBox.height - 72, 820),
  };
  const touchPoint = (x: number, y: number) => ({
    x,
    y,
    id: 1,
    radiusX: 4,
    radiusY: 4,
    force: 1,
  });

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchPoint(start.x, start.y)],
  });
  await page.waitForTimeout(300);
  for (let step = 1; step <= 12; step += 1) {
    const progress = step / 12;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        touchPoint(
          start.x + (target.x - start.x) * progress,
          start.y + (target.y - start.y) * progress,
        ),
      ],
    });
    await page.waitForTimeout(16);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
}

async function openObserver(browser: Browser, boardPath: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInSeededUser(page);
  await page.goto(boardPath);
  await expect(
    page
      .getByRole("region", { name: "Kanban board" })
      .getByLabel("Realtime status"),
  ).toContainText("Live updates");
  return { context, page };
}

test("supports accessible DnD, rollback, and cross-client realtime", async ({
  page,
  browser,
}) => {
  test.slow();

  await signInSeededUser(page);
  await page.goto(`/w/${seededUser.workspaceSlug}/projects`);
  await page.getByRole("button", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill("Live Workflow");
  await page.getByLabel("Key").fill("LIVE");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/board$/);
  const boardPath = new URL(page.url()).pathname;

  await createTask(page, "Backlog", "First realtime task");
  await createTask(page, "Backlog", "Second realtime task");
  await createTask(page, "Backlog", "Third realtime task");
  await expect(page.getByLabel("Realtime status")).toContainText(
    "Live updates",
  );

  const firstHandle = page.getByRole("button", {
    name: "Drag First realtime task",
  });
  await firstHandle.focus();
  await page.keyboard.press("Space");
  await expect(firstHandle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("status").filter({ hasText: "is over In progress column" }),
  ).toBeVisible();
  await page.keyboard.press("Space");

  await expect(
    page
      .getByRole("article", { name: "In progress" })
      .getByRole("article", { name: "First realtime task" }),
  ).toBeVisible();

  await page.route("**/rest/v1/rpc/move_task", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.abort();
  });
  await dragTaskToColumn(page, "First realtime task", "Done");
  await expect(
    page
      .getByRole("article", { name: "Done" })
      .getByRole("article", { name: "First realtime task" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("article", { name: "In progress" })
      .getByRole("article", { name: "First realtime task" }),
  ).toBeVisible();
  await expect(page.getByText("Task move failed")).toBeVisible();
  await page.unroute("**/rest/v1/rpc/move_task");

  await dragTaskToColumn(page, "First realtime task", "Done");
  await expect(
    page
      .getByRole("article", { name: "Done" })
      .getByRole("article", { name: "First realtime task" }),
  ).toBeVisible();

  const observer = await openObserver(browser, boardPath);
  try {
    await expect(
      observer.page
        .getByRole("article", { name: "Done" })
        .getByRole("article", { name: "First realtime task" }),
    ).toBeVisible();

    const movedTask = page.getByRole("article", {
      name: "First realtime task",
    });
    await movedTask
      .getByLabel("Move First realtime task to")
      .selectOption({ label: "To do" });
    const moveResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        Boolean(response.request().headers()["next-action"]),
    );
    await movedTask
      .getByRole("button", { name: "Move First realtime task" })
      .click();
    await moveResponse;
    await expect(
      page
        .getByRole("article", { name: "To do" })
        .getByRole("article", { name: "First realtime task" }),
    ).toBeVisible();

    await expect(
      observer.page
        .getByRole("article", { name: "To do" })
        .getByRole("article", { name: "First realtime task" }),
    ).toBeVisible({ timeout: 20_000 });
  } finally {
    await observer.context.close();
  }

  await page.context().setOffline(true);
  await expect(page.getByLabel("Realtime status")).toContainText(
    "Reconnecting",
  );
  await page.context().setOffline(false);
  await expect(page.getByLabel("Realtime status")).toContainText(
    "Live updates",
    { timeout: 20_000 },
  );

  const touchContext = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1280, height: 900 },
  });
  const touchPage = await touchContext.newPage();
  try {
    await signInSeededUser(touchPage);
    await touchPage.goto(boardPath);
    await expect(touchPage.getByLabel("Realtime status")).toContainText(
      "Live updates",
    );
    await touchDragTaskToColumn(
      touchPage,
      touchContext,
      "First realtime task",
      "Done",
    );
    await expect(
      touchPage
        .getByRole("article", { name: "Done" })
        .getByRole("article", { name: "First realtime task" }),
    ).toBeVisible();
  } finally {
    await touchContext.close();
  }
});
