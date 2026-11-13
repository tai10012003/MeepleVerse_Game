import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  expect: { timeout: 10000 },
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3000",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    { command: "pnpm --filter meepleverse-api dev", cwd: "../..", url: "http://localhost:5000/health", reuseExistingServer: true, timeout: 60000 },
    { command: "pnpm --filter meepleverse-user-web dev", cwd: "../..", url: "http://localhost:3000", reuseExistingServer: true, timeout: 90000 },
  ],
});
