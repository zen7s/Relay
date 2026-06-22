import { defineConfig, devices } from "@playwright/test";

const productionUrl = process.env.PRODUCTION_URL;

if (!productionUrl) {
  throw new Error(
    "Set PRODUCTION_URL before running the production smoke suite.",
  );
}

export default defineConfig({
  testDir: "./tests/production",
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: productionUrl,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
