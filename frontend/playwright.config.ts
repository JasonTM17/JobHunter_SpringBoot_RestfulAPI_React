import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3020";
const shouldStartServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./visual-tests",
  snapshotPathTemplate: "{testDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: process.env.CI ? 0.08 : 0.02
    }
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
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 900 },
        deviceScaleFactor: 1
      }
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1
      }
    }
  ],
  webServer: shouldStartServer
    ? {
        command: "npm run build && npm run start -- -p 3020",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000
      }
    : undefined
});
