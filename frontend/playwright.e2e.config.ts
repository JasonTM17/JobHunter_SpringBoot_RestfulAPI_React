import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_E2E_BASE_URL ?? "http://127.0.0.1:3021";
const shouldStartServer = !process.env.PLAYWRIGHT_E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e-tests",
  timeout: 60_000,
  expect: {
    timeout: 12_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "e2e-desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 900 },
        deviceScaleFactor: 1
      }
    },
    {
      name: "e2e-mobile-chromium",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1
      }
    }
  ],
  webServer: shouldStartServer
    ? {
        command: "npm run build && npm run start -- -p 3021",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          NEXT_PUBLIC_API_BASE_URL: "http://localhost:8080",
          NEXT_PUBLIC_STORAGE_BASE_URL: "http://localhost:8080"
        }
      }
    : undefined
});
