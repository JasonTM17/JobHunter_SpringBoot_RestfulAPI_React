import { expect, test } from "@playwright/test";
import { mockJobhunterE2eApi } from "./fixtures/jobhunter-e2e";

test.describe("Recruiter and admin management E2E", () => {
  test("recruiter can filter pipeline and update resume status with audit note", async ({ page }) => {
    await mockJobhunterE2eApi(page, { auth: "recruiter" });

    await page.goto("/recruiter");
    await page.goto("/?tab=manage&module=resumes");
    await expect(page.getByTestId("resume-status-select-501")).toBeVisible();
    await expect(page.getByText("Opened CV")).toBeVisible();

    await page.getByPlaceholder("Tìm theo ứng viên, job, email...").fill("Candidate One");
    await expect(page.getByText("Candidate One")).toBeVisible();

    await page.getByLabel("Lọc trạng thái hồ sơ").selectOption("PENDING");

    const statusRequest = page.waitForRequest(
      (request) => request.url().includes("/api/v1/resumes/501/status") && request.method() === "PATCH"
    );
    await page.getByTestId("resume-status-select-501").selectOption("REVIEWING");
    await page.getByPlaceholder("Ghi chú audit").fill("Move to technical review");
    await page.getByTestId("resume-status-save-501").click();

    const request = await statusRequest;
    expect(request.postDataJSON()).toMatchObject({
      status: "REVIEWING",
      note: "Move to technical review"
    });
  });

  test("admin can open users management from admin workspace", async ({ page }) => {
    await mockJobhunterE2eApi(page, { auth: "admin" });

    await page.goto("/admin");
    await expect(page.locator("h1")).toBeVisible();
    await page.goto("/?tab=manage&module=users");
    await expect(page.getByText("Candidate One")).toBeVisible();
    await expect(page.getByText("Recruiter One")).toBeVisible();
  });
});
