import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("serves a healthy, hardened, accessible public application", async ({
  page,
  request,
}) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toMatchObject({
    status: "ok",
    checks: { supabase: "ok" },
  });

  const loginResponse = await page.goto("/login");
  expect(loginResponse).not.toBeNull();
  expect(loginResponse?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(loginResponse?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(loginResponse?.headers()["x-frame-options"]).toBe("DENY");
  if (process.env.PRODUCTION_URL?.startsWith("https://")) {
    expect(loginResponse?.headers()["strict-transport-security"]).toContain(
      "max-age=63072000",
    );
  }
  await expect(
    page.getByRole("heading", { name: "Sign in to Relay" }),
  ).toBeVisible();

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);

  await page.setViewportSize({ width: 320, height: 780 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
});

test("production smoke account can sign in", async ({ page }) => {
  const email = process.env.PRODUCTION_SMOKE_EMAIL;
  const password = process.env.PRODUCTION_SMOKE_PASSWORD;
  test.skip(!email || !password, "Production smoke credentials are not set.");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("main")).toBeVisible();
});
