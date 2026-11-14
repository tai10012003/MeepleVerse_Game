import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e", timeout: 45000, expect: { timeout: 10000 }, workers: 1,
  use: {
    ...devices["Desktop Chrome"], baseURL: "http://localhost:3100",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined, headless: true, reducedMotion: "no-preference",
    trace: "retain-on-failure", screenshot: "only-on-failure",
  },
  webServer: [
    { command: "pnpm --filter meepleverse-api test:browser-server",
      cwd: "../..", url: "http://127.0.0.1:5100/health", reuseExistingServer: false, timeout: 60000,
      env: { CORS_ORIGINS: "http://localhost:3100" } },
    { command: "pnpm --filter meepleverse-user-web exec next dev --port 3100",
      cwd: "../..", url: "http://localhost:3100", reuseExistingServer: false, timeout: 90000,
      env: { NEXT_PUBLIC_API_URL: "http://localhost:5100", NEXT_DIST_DIR: ".next-e2e" } },
  ],
});
