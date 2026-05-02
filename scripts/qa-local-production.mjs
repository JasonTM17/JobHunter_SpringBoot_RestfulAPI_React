#!/usr/bin/env node

import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");

const DEFAULT_FRONTEND_URL = "http://localhost:3001";
const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const DEFAULT_SCREENSHOT_DIR = path.join(ROOT_DIR, "docs", "assets", "screenshots");
const TIMEOUT_MS = Number(process.env.QA_TIMEOUT_MS || 15000);
const UNSAFE_HEADER = "X-Jobhunter-Client";
const DEMO_PASSWORD = "123456";
const MOJIBAKE_MARKERS = [
  "\u00c3\u00a1", "\u00c3\u00a0", "\u00c3\u00a3", "\u00c3\u00a2", "\u00c3\u00aa", "\u00c3\u00b4",
  "\u00c3\u00ad", "\u00c3\u00ac", "\u00c3\u00b2", "\u00c3\u00b3", "\u00c3\u00b9", "\u00c3\u00ba",
  "\u00c3\u00bd", "\u00c4\u0090", "\u00c4\u0091", "\u00c6\u00b0", "\u00c6\u00a1", "\u00e1\u00ba",
  "\u00e1\u00bb", "\u00c2\u00b7", "\u00e2\u20ac\u201d", "\u00e2\u20ac\u201c", "\u00e2\u20ac\u0153",
  "\u00e2\u20ac\u009d", "\u00e2\u20ac\u02dc", "\u00e2\u20ac\u2122", "\u00c3\u0192"
];

const options = parseArgs(process.argv.slice(2));
const frontendUrl = stripTrailingSlash(options["frontend-url"] || process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL);
const apiBaseUrl = stripTrailingSlash(options["api-base-url"] || process.env.API_BASE_URL || DEFAULT_API_BASE_URL);
const screenshotDir = path.resolve(options.out || process.env.QA_SCREENSHOT_DIR || DEFAULT_SCREENSHOT_DIR);
const captureScreenshots = Boolean(options.screenshots);

const demoAccounts = {
  candidate: "candidate01@jobhunter.local",
  recruiter: "recruiter01@jobhunter.local",
  admin: "admin.operations@jobhunter.local"
};

const checks = [];
let firstJobId = null;

function parseArgs(args) {
  const result = {};
  for (const arg of args) {
    if (!arg.startsWith("--")) continue;
    const [key, ...valueParts] = arg.slice(2).split("=");
    result[key] = valueParts.length > 0 ? valueParts.join("=") : true;
  }
  return result;
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function requireFromFrontend(packageName) {
  const require = createRequire(import.meta.url);
  const resolved = require.resolve(packageName, { paths: [FRONTEND_DIR, ROOT_DIR] });
  return require(resolved);
}

function unwrapList(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function hasMojibake(value) {
  const text = String(value || "");
  return MOJIBAKE_MARKERS.some((marker) => text.includes(marker));
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, init = {}) {
  const response = await fetchWithTimeout(url, init);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${url} did not return JSON: ${text.slice(0, 120)}`);
  }
  return { response, json, text };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function check(name, task) {
  const started = Date.now();
  try {
    const details = await task();
    checks.push({ name, ok: true, ms: Date.now() - started, details });
  } catch (error) {
    checks.push({ name, ok: false, ms: Date.now() - started, error: error instanceof Error ? error.message : String(error) });
  }
}

async function assertFrontendHeaders() {
  const response = await fetchWithTimeout(`${frontendUrl}/`);
  expect(response.ok, `frontend returned ${response.status}`);
  const headers = response.headers;
  const csp = headers.get("content-security-policy");
  expect(csp?.includes("frame-ancestors 'none'"), "frontend CSP is missing frame-ancestors");
  expect(headers.get("x-frame-options") === "DENY", "frontend X-Frame-Options must be DENY");
  expect(headers.get("x-content-type-options") === "nosniff", "frontend X-Content-Type-Options must be nosniff");
  expect(Boolean(headers.get("referrer-policy")), "frontend Referrer-Policy is missing");
  expect(Boolean(headers.get("permissions-policy")), "frontend Permissions-Policy is missing");
  return {
    csp: Boolean(csp),
    xFrameOptions: headers.get("x-frame-options"),
    referrerPolicy: headers.get("referrer-policy")
  };
}

async function assertBackendAndApi() {
  const health = await fetchJson(`${apiBaseUrl.replace(/\/api\/v1$/, "")}/actuator/health`);
  expect(health.response.ok, `backend health returned ${health.response.status}`);
  expect(health.json?.data?.status === "UP" || health.json?.status === "UP", "backend health is not UP");

  const jobs = await fetchJson(`${apiBaseUrl}/jobs?page=0&size=5`);
  expect(jobs.response.ok, `jobs API returned ${jobs.response.status}`);
  const jobItems = unwrapList(jobs.json);
  expect(jobItems.length > 0, "jobs API returned no jobs");
  firstJobId = jobItems[0]?.id;
  expect(firstJobId, "first job id is missing");

  const aiStatus = await fetchJson(`${apiBaseUrl}/ai/status`);
  expect(aiStatus.response.ok, `AI status returned ${aiStatus.response.status}`);
  expect(typeof aiStatus.json?.data?.available === "boolean", "AI status missing availability flag");
  expect(!hasMojibake(aiStatus.text), "AI status response contains mojibake text");

  const unsafe = await fetchJson(`${apiBaseUrl}/subscribers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "qa-missing-header@jobhunter.local" })
  });
  expect(unsafe.response.status === 403, `unsafe method guard expected 403, got ${unsafe.response.status}`);

  return {
    firstJobId,
    aiAvailable: aiStatus.json.data.available,
    unsafeHeaderGuard: unsafe.response.status
  };
}

async function loginContext(browser, request, username) {
  const api = await request.newContext({
    baseURL: apiBaseUrl.replace(/\/api\/v1$/, ""),
    extraHTTPHeaders: {
      [UNSAFE_HEADER]: "web"
    }
  });
  const response = await api.post("/api/v1/auth/login", {
    data: { username, password: DEMO_PASSWORD }
  });
  expect(response.ok(), `login failed for ${username}: ${response.status()}`);
  const storageState = await api.storageState();
  await api.dispose();
  return browser.newContext({
    baseURL: frontendUrl,
    storageState,
    viewport: { width: 1366, height: 900 },
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh"
  });
}

async function scanPage(page, route, label, screenshotName) {
  const errors = [];
  const httpErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !isExpectedBrowserNoise(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && !isExpectedResponseNoise(response)) {
      httpErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(route, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS }).catch(() => null);
  await page.locator("body").waitFor({ state: "visible", timeout: TIMEOUT_MS });

  const bodyText = await page.locator("body").innerText({ timeout: TIMEOUT_MS });
  expect(bodyText.trim().length > 0, `${label} rendered empty body`);
  expect(!hasMojibake(bodyText), `${label} contains mojibake text`);

  const horizontalOverflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  );
  expect(horizontalOverflow <= 2, `${label} has horizontal overflow: ${horizontalOverflow}px`);
  expect(httpErrors.length === 0, `${label} HTTP errors: ${httpErrors.join(" | ")}`);
  expect(errors.length === 0, `${label} console errors: ${errors.join(" | ")}`);

  if (captureScreenshots && screenshotName) {
    await page.screenshot({
      path: path.join(screenshotDir, screenshotName),
      type: "jpeg",
      quality: 86,
      fullPage: false
    });
  }

  return {
    route,
    title: await page.title(),
    horizontalOverflow,
    consoleErrors: errors.length,
    httpErrors: httpErrors.length
  };
}

function isExpectedBrowserNoise(message) {
  return message.includes("Failed to load resource: the server responded with a status of 401");
}

function isExpectedResponseNoise(response) {
  if (response.status() !== 401) return false;
  return [
    "/api/v1/auth/account",
    "/api/v1/auth/capabilities",
    "/api/v1/auth/refresh"
  ].some((pathPart) => response.url().includes(pathPart));
}

async function runBrowserScan() {
  const { chromium, request } = requireFromFrontend("@playwright/test");
  if (captureScreenshots) await mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const publicContext = await browser.newContext({
    baseURL: frontendUrl,
    viewport: { width: 1366, height: 900 },
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh"
  });

  try {
    const publicPage = await publicContext.newPage();
    const publicResults = [];
    publicResults.push(await scanPage(publicPage, "/", "home", "jobhunter-home.jpg"));
    publicResults.push(await scanPage(publicPage, `/jobs/${firstJobId}`, "job detail", "jobhunter-job-detail.jpg"));
    publicResults.push(await scanPage(publicPage, `/chatbot?jobId=${firstJobId}`, "chatbot", "jobhunter-gemini-ai-assistant.jpg"));
    publicResults.push(await scanPage(publicPage, "/login", "login", null));
    publicResults.push(await scanPage(publicPage, "/register", "register", null));
    publicResults.push(await scanPage(publicPage, "/forgot-password", "forgot password", null));
    publicResults.push(await scanPage(publicPage, "/support", "support", null));

    await publicPage.goto("/", { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
    const chatButton = publicPage.getByTestId("floating-chat-button");
    expect(await chatButton.count() === 1, "floating chatbot button is missing or ambiguous");
    await chatButton.click();
    await expectLocator(publicPage.getByTestId("floating-chat-input"), "floating chatbot textarea");

    const mobileContext = await browser.newContext({
      baseURL: frontendUrl,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      locale: "vi-VN",
      timezoneId: "Asia/Ho_Chi_Minh"
    });
    const mobilePage = await mobileContext.newPage();
    const mobileHome = await scanPage(mobilePage, "/", "mobile home", "jobhunter-mobile-home.jpg");
    await mobileContext.close();

    const candidateContext = await loginContext(browser, request, demoAccounts.candidate);
    const candidatePage = await candidateContext.newPage();
    const candidate = await scanPage(candidatePage, "/candidate", "candidate workspace", "jobhunter-candidate-workspace.jpg");
    await candidateContext.close();

    const recruiterContext = await loginContext(browser, request, demoAccounts.recruiter);
    const recruiterPage = await recruiterContext.newPage();
    const recruiter = await scanPage(recruiterPage, "/?tab=manage&module=resumes", "recruiter pipeline", "jobhunter-recruiter-pipeline.jpg");
    await recruiterContext.close();

    const adminContext = await loginContext(browser, request, demoAccounts.admin);
    const adminPage = await adminContext.newPage();
    const admin = await scanPage(adminPage, "/?tab=manage&module=users", "admin users", "jobhunter-admin-users.jpg");
    await adminContext.close();

    return { publicResults, mobileHome, candidate, recruiter, admin };
  } finally {
    await publicContext.close();
    await browser.close();
  }
}

async function expectLocator(locator, label) {
  await locator.waitFor({ state: "visible", timeout: TIMEOUT_MS });
  expect(await locator.count() === 1, `${label} is missing or ambiguous`);
}

await check("frontend security headers", assertFrontendHeaders);
await check("backend health, APIs, AI, unsafe-method guard", assertBackendAndApi);
await check("browser route scan and chatbot", runBrowserScan);

for (const item of checks) {
  const suffix = item.ok ? JSON.stringify(item.details) : item.error;
  console.log(`${item.ok ? "OK" : "FAIL"} ${item.name} (${item.ms}ms) ${suffix}`);
}

const failed = checks.filter((item) => !item.ok);
if (failed.length > 0) {
  console.error(`QA failed: ${failed.length}/${checks.length} checks failed.`);
  process.exit(1);
}

console.log(`QA passed: ${checks.length}/${checks.length} checks passed.`);
if (captureScreenshots) {
  console.log(`Screenshots saved to: ${screenshotDir}`);
}
