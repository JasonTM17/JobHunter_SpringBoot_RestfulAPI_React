import { expect, test } from "@playwright/test";
import { mockJobhunterE2eApi } from "./fixtures/jobhunter-e2e";

test.describe("Public job discovery E2E", () => {
  test.beforeEach(async ({ page }) => {
    await mockJobhunterE2eApi(page, { auth: "anonymous" });
  });

  test("guest can browse, sort, filter and open job detail", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("home-page")).toBeVisible();
    await expect(page.getByTestId("job-card")).toHaveCount(3);
    await expect(page.getByTestId("about-section")).toBeVisible();

    await page.getByTestId("jobs-sort-select").selectOption("salary_desc");
    await expect(page).toHaveURL(/sort=salary_desc/);
    await expect(page.getByTestId("job-card").first()).toContainText("Cloud DevOps Specialist");

    await page.getByTestId("job-filter-keyword").fill("React");
    await expect(page.getByTestId("job-card")).toHaveCount(1);
    await expect(page.getByTestId("job-card").first()).toContainText("Senior Frontend Engineer");

    await page.goto("/jobs/101");
    await expect(page.locator("h1")).toContainText("Senior Frontend Engineer");
    await expect(page.locator('a[href^="/chatbot?jobId="]')).toHaveCount(1);
    await expect(page.locator('a[href^="/login?next="]:visible').first()).toBeVisible();
  });

  test("mobile job board has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("job-card")).toHaveCount(3);

    const horizontalOverflow = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(2);
  });
});
