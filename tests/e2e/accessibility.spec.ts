import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { seededUser } from "./fixtures";
import { signInSeededUser } from "./support/auth";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function expectNoAccessibilityViolations(page: Page, context: string) {
  await page.waitForTimeout(250);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    results.violations,
    `${context}: ${results.violations
      .map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.nodes
            .map((node) => node.target.join(" "))
            .join(", ")}`,
      )
      .join("; ")}`,
  ).toEqual([]);
}

test("has no critical WCAG A or AA violations on key flows", async ({
  page,
}, testInfo) => {
  test.slow();
  const projectKey = `A${testInfo.workerIndex}${testInfo.retry}Y`;

  await page.goto("/login");
  await expectNoAccessibilityViolations(page, "Sign in");

  await signInSeededUser(page);
  await expectNoAccessibilityViolations(page, "Dashboard");

  await page.goto(`/w/${seededUser.workspaceSlug}/projects`);
  await expectNoAccessibilityViolations(page, "Projects");

  await page.getByRole("button", { name: "New project" }).first().click();
  await expectNoAccessibilityViolations(page, "Project dialog");
  await page.getByLabel("Project name").fill("Accessibility Audit");
  await page.getByLabel("Key").fill(projectKey);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/board$/);
  await expectNoAccessibilityViolations(page, "Project board");

  await page.getByRole("button", { name: "New task" }).click();
  await expectNoAccessibilityViolations(page, "Task dialog");
});
