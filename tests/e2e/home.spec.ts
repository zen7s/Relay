import { expect, test, type Page } from "@playwright/test";

import { signInSeededUser } from "./support/auth";

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}

test("renders the responsive dashboard shell", async ({ page }) => {
  await signInSeededUser(page);

  await expect(page).toHaveTitle("Relay");
  await expect(
    page.getByRole("heading", { name: "Good morning, Alex" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Mobile quick navigation" }),
  ).toBeHidden();
  await expect(page.getByText("Priority projects")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("changes and persists the selected theme", async ({ page }) => {
  await signInSeededUser(page);

  await page.getByRole("button", { name: "Choose theme" }).click();
  await page.getByRole("menuitem", { name: "Dark" }).click();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("uses compact desktop navigation at tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await signInSeededUser(page);

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Mobile quick navigation" }),
  ).toBeHidden();
  await expectNoHorizontalOverflow(page);
});

test("opens the navigation drawer on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await signInSeededUser(page);

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Mobile quick navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Mobile primary" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("redirects anonymous users to sign in", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login\?next=%2F$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to Relay" }),
  ).toBeVisible();
});
