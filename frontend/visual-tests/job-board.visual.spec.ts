import { expect, test } from "@playwright/test";
import { mockJobhunterPublicApi } from "./fixtures/jobhunter-fixtures";

async function stabilizePage(page: import("@playwright/test").Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `
  });
}

test.describe("Jobhunter visual snapshots", () => {
  test.beforeEach(async ({ page }) => {
    await mockJobhunterPublicApi(page);
  });

  test("public job board stays visually stable", async ({ page }) => {
    await page.goto("/");
    await stabilizePage(page);

    await expect(page.locator("#jobs")).toBeVisible();
    await expect(page.locator("#jobs-sort-select")).toHaveValue("latest");
    await expect(page.locator("[data-job-id]")).toHaveCount(3);
    await expect(page.locator("#jobs")).toHaveScreenshot("job-board-default.png");
  });

  test("salary sort keeps the board stable", async ({ page }) => {
    await page.goto("/");
    await stabilizePage(page);

    await page.locator("#jobs-sort-select").selectOption("salary_desc");
    await expect(page).toHaveURL(/sort=salary_desc/);
    await expect(page.locator("#jobs-sort-select")).toHaveValue("salary_desc");
    await expect(page.locator("#jobs")).toHaveScreenshot("job-board-salary-sort.png");
  });
});
