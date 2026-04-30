import { expect, Page, test } from "@playwright/test";
import { mockJobhunterE2eApi } from "./fixtures/jobhunter-e2e";

async function gotoAfterAuthHydration(page: Page, path: string) {
  const hydration = Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/v1/auth/account")).catch(() => null),
    page.waitForResponse((response) => response.url().includes("/api/v1/auth/capabilities")).catch(() => null)
  ]);
  await page.goto(path);
  await hydration;
}

test.describe("Auth and candidate E2E", () => {
  test("visitor can register and land on login", async ({ page }) => {
    await mockJobhunterE2eApi(page, { auth: "anonymous" });

    await gotoAfterAuthHydration(page, "/register");
    const form = page.locator("main form").first();
    await form.locator('input[autocomplete="name"]').fill("New Candidate");
    await form.locator('input[autocomplete="email"]').fill("new.candidate@example.com");
    await form.locator('input[autocomplete="new-password"]').nth(0).fill("secret123");
    await form.locator('input[autocomplete="new-password"]').nth(1).fill("secret123");

    const registerResponse = page.waitForResponse((response) => response.url().includes("/api/v1/auth/register"));
    await form.locator('button[type="submit"]').click();
    await registerResponse;

    await expect(page).toHaveURL(/\/login\?registered=1/);
    await expect(page.locator('input[autocomplete="email"]')).toHaveValue("new.candidate@example.com");
  });

  test("visitor can request and submit password reset in dev mode", async ({ page }) => {
    await mockJobhunterE2eApi(page, { auth: "anonymous" });

    await gotoAfterAuthHydration(page, "/forgot-password");
    const requestForm = page.locator("main form").nth(0);
    await requestForm.locator('input[type="email"]').fill("candidate@example.com");

    const forgotResponse = page.waitForResponse((response) => response.url().includes("/api/v1/auth/forgot-password"));
    await requestForm.locator('button[type="submit"]').click();
    await forgotResponse;

    const resetForm = page.locator("main form").nth(1);
    await expect(resetForm.locator("input").first()).toHaveValue("dev-token-123");
    await resetForm.locator('input[type="password"]').nth(0).fill("new-secret-123");
    await resetForm.locator('input[type="password"]').nth(1).fill("new-secret-123");

    const resetResponse = page.waitForResponse((response) => response.url().includes("/api/v1/auth/reset-password"));
    await resetForm.locator('button[type="submit"]').click();
    await resetResponse;

    await expect(page.getByText("Password updated")).toBeVisible();
  });

  test("candidate can login, apply with CV URL, and see application history", async ({ page }) => {
    await mockJobhunterE2eApi(page, { auth: "anonymous" });

    await gotoAfterAuthHydration(page, "/login");
    const loginForm = page.locator("main form").first();
    await loginForm.locator('input[autocomplete="email"]').fill("candidate@example.com");
    await loginForm.locator('input[autocomplete="current-password"]').fill("secret123");

    const loginResponses = Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/v1/auth/login")),
      page.waitForResponse((response) => response.url().includes("/api/v1/auth/account")),
      page.waitForResponse((response) => response.url().includes("/api/v1/auth/capabilities"))
    ]);
    await loginForm.locator('button[type="submit"]').click();
    await loginResponses;

    await expect(page).toHaveURL(/\/candidate/);
    await expect(page.locator("h1")).toContainText("Candidate One");

    await page.goto("/jobs/103");
    await expect(page.locator("h1")).toContainText("Cloud DevOps Specialist");
    await expect(page.getByLabel("URL CV", { exact: false })).toBeVisible();

    const createResumeRequest = page.waitForRequest(
      (request) => request.url().includes("/api/v1/resumes") && request.method() === "POST"
    );
    await page.getByLabel("URL CV", { exact: false }).fill("https://example.com/new-cv.pdf");
    await page.locator('button[type="submit"]').click();

    const request = await createResumeRequest;
    expect(request.postDataJSON()).toMatchObject({
      jobId: 103,
      url: "https://example.com/new-cv.pdf"
    });
    await expect(page.locator('a[href="/candidate"]:visible').first()).toBeVisible();

    await page.goto("/candidate");
    await expect(page.getByText("Cloud DevOps Specialist").first()).toBeVisible();
    await expect(page.getByText("Opened CV").first()).toBeVisible();
    await expect(page.getByTestId("candidate-cv-card-301")).toContainText("Candidate-One-CV.pdf");
    await expect(page.getByTestId("candidate-cv-default-301")).toBeVisible();
  });

  test("candidate can set a default CV and delete CVs from workspace library", async ({ page }) => {
    await mockJobhunterE2eApi(page, { auth: "candidate" });

    await gotoAfterAuthHydration(page, "/candidate");
    await expect(page.getByRole("heading", { name: "Thư viện CV" })).toBeVisible();
    await expect(page.getByTestId("candidate-cv-default-301")).toBeVisible();
    await expect(page.getByTestId("candidate-cv-card-302")).toContainText("Candidate-Backend-CV.pdf");

    const setDefaultRequest = page.waitForRequest(
      (request) => request.url().includes("/api/v1/candidate/cvs/302/default") && request.method() === "PATCH"
    );
    await page.getByTestId("candidate-cv-set-default-302").click();
    await setDefaultRequest;

    await expect(page.getByTestId("candidate-cv-default-302")).toBeVisible();
    await expect(page.getByTestId("candidate-cv-default-301")).toHaveCount(0);

    const deleteRequest = page.waitForRequest(
      (request) => request.url().includes("/api/v1/candidate/cvs/302") && request.method() === "DELETE"
    );
    await page.getByTestId("candidate-cv-delete-302").click();
    await deleteRequest;

    await expect(page.getByTestId("candidate-cv-card-302")).toHaveCount(0);
    await expect(page.getByTestId("candidate-cv-default-301")).toBeVisible();
  });
});
