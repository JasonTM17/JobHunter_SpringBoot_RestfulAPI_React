#!/usr/bin/env node

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEFAULT_FRONTEND_URL = "http://localhost:3010";
const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
const FRONTEND_FALLBACK_URLS = [DEFAULT_FRONTEND_URL, "http://localhost:3001", "http://localhost:3000"];
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 10000);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(SCRIPT_DIR, "..");

function readOption(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : process.env[name.toUpperCase().replaceAll("-", "_")];
}

function readFlag(name) {
  const envValue = process.env[name.toUpperCase().replaceAll("-", "_")];
  const cliValue = readOption(name);
  const rawValue = cliValue ?? envValue;
  return process.argv.includes(`--${name}`)
    || ["1", "true", "yes", "on"].includes(String(rawValue || "").toLowerCase());
}

let frontendUrl = (readOption("frontend-url") || process.env.FRONTEND_URL || "").replace(/\/$/, "");
const apiBaseUrl = (readOption("api-base-url") || process.env.API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
const browserSmokeEnabled = readFlag("browser");

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      text,
      json: parseJson(text)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function unwrapList(payload) {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function unwrapMetaTotal(payload) {
  return payload?.data?.meta?.total ?? payload?.meta?.total ?? unwrapList(payload).length;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const checks = [];

async function check(name, task) {
  const started = Date.now();
  try {
    const details = await task();
    checks.push({ name, ok: true, ms: Date.now() - started, details });
  } catch (error) {
    checks.push({ name, ok: false, ms: Date.now() - started, error: error instanceof Error ? error.message : String(error) });
  }
}

async function resolveFrontendHome() {
  const candidates = frontendUrl ? [frontendUrl] : FRONTEND_FALLBACK_URLS;
  const failures = [];

  for (const candidate of candidates) {
    const normalized = candidate.replace(/\/$/, "");
    try {
      const response = await fetchWithTimeout(`${normalized}/`);
      if (response.ok && response.text.includes("Jobhunter")) {
        frontendUrl = normalized;
        return response;
      }
      failures.push(`${normalized} returned ${response.status}`);
    } catch (error) {
      failures.push(`${normalized} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Could not find a running Jobhunter frontend. Tried: ${failures.join("; ")}`);
}

async function loadPlaywrightChromium() {
  const require = createRequire(import.meta.url);
  const resolved = require.resolve("@playwright/test", {
    paths: [path.join(WORKSPACE_ROOT, "frontend"), WORKSPACE_ROOT]
  });
  return require(resolved).chromium;
}

await check("frontend home", async () => {
  const response = await resolveFrontendHome();
  assert(response.ok, `Expected frontend home 2xx, got ${response.status}`);
  assert(response.text.includes("Jobhunter"), "Home HTML does not contain Jobhunter");
  return { status: response.status, frontendUrl, bytes: response.text.length };
});

let firstJobId = null;

await check("jobs api", async () => {
  const response = await fetchWithTimeout(`${apiBaseUrl}/jobs?page=0&size=5`);
  assert(response.ok, `Expected jobs API 2xx, got ${response.status}`);
  assert(response.json, "Jobs API did not return JSON");
  const jobs = unwrapList(response.json);
  assert(jobs.length > 0, "Jobs API returned no jobs");
  firstJobId = jobs[0]?.id;
  assert(firstJobId, "First job has no id");
  return { status: response.status, returned: jobs.length, total: unwrapMetaTotal(response.json), firstJobId };
});

await check("jobs api salary sort", async () => {
  const response = await fetchWithTimeout(`${apiBaseUrl}/jobs?page=0&size=5&sort=salary_desc`);
  assert(response.ok, `Expected salary sorted jobs API 2xx, got ${response.status}`);
  assert(response.json, "Salary sorted jobs API did not return JSON");
  const jobs = unwrapList(response.json);
  assert(jobs.length > 0, "Salary sorted jobs API returned no jobs");
  const salaries = jobs.map((job) => Number(job?.salary ?? 0));
  for (let index = 1; index < salaries.length; index += 1) {
    assert(salaries[index - 1] >= salaries[index], `Salary sort is not descending at index ${index}`);
  }
  return { status: response.status, returned: jobs.length, salaries };
});

await check("companies api", async () => {
  const response = await fetchWithTimeout(`${apiBaseUrl}/companies?page=0&size=5`);
  assert(response.ok, `Expected companies API 2xx, got ${response.status}`);
  const companies = unwrapList(response.json);
  assert(companies.length > 0, "Companies API returned no companies");
  return { status: response.status, returned: companies.length, total: unwrapMetaTotal(response.json) };
});

await check("skills api", async () => {
  const response = await fetchWithTimeout(`${apiBaseUrl}/skills?page=0&size=5`);
  assert(response.ok, `Expected skills API 2xx, got ${response.status}`);
  const skills = unwrapList(response.json);
  assert(skills.length > 0, "Skills API returned no skills");
  return { status: response.status, returned: skills.length, total: unwrapMetaTotal(response.json) };
});

await check("job detail api", async () => {
  assert(firstJobId, "Skipped because jobs API did not provide a job id");
  const response = await fetchWithTimeout(`${apiBaseUrl}/jobs/${firstJobId}`);
  assert(response.ok, `Expected job detail API 2xx, got ${response.status}`);
  assert(response.json?.data?.id || response.json?.id, "Job detail did not include an id");
  return { status: response.status, jobId: firstJobId };
});

await check("frontend job detail route", async () => {
  assert(firstJobId, "Skipped because jobs API did not provide a job id");
  const response = await fetchWithTimeout(`${frontendUrl}/jobs/${firstJobId}`);
  assert(response.ok, `Expected job detail route 2xx, got ${response.status}`);
  assert(response.text.includes("Jobhunter"), "Job detail HTML does not contain Jobhunter");
  return { status: response.status, jobId: firstJobId, bytes: response.text.length };
});

if (browserSmokeEnabled) {
  await check("frontend rendered job board DOM", async () => {
    const chromium = await loadPlaywrightChromium();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

    try {
      await page.goto(`${frontendUrl}/`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      await page.waitForSelector('[data-testid="home-page"]', { timeout: TIMEOUT_MS });
      await page.waitForFunction(
        () => !document.body.innerText.includes("Đang tải dữ liệu tuyển dụng..."),
        null,
        { timeout: TIMEOUT_MS }
      );
      await page.waitForSelector('[data-testid="job-card"]', { timeout: TIMEOUT_MS });

      const jobCardCount = await page.locator('[data-testid="job-card"]').count();
      assert(jobCardCount > 0, "Home rendered no job cards");
      assert(await page.locator('[data-testid="jobs-sort-select"]').count() === 1, "Sort select is missing");
      assert(await page.locator('[data-testid="about-section"]').count() === 1, "About section is missing");

      await page.locator('[data-testid="jobs-sort-select"]').selectOption("salary_desc");
      await page.waitForURL((url) => url.searchParams.get("sort") === "salary_desc", { timeout: TIMEOUT_MS });

      const horizontalOverflow = await page.locator("body").evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      );
      assert(horizontalOverflow <= 2, `Desktop has horizontal overflow: ${horizontalOverflow}px`);

      return {
        status: "rendered",
        jobCardCount,
        sort: "salary_desc",
        url: page.url()
      };
    } finally {
      await browser.close();
    }
  });

  await check("frontend rendered job detail DOM", async () => {
    assert(firstJobId, "Skipped because jobs API did not provide a job id");
    const chromium = await loadPlaywrightChromium();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

    try {
      await page.goto(`${frontendUrl}/jobs/${firstJobId}`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      await page.waitForSelector("h1", { timeout: TIMEOUT_MS });
      await page.waitForSelector('a[href^="/chatbot?jobId="]', { timeout: TIMEOUT_MS });

      const heading = await page.locator("h1").first().innerText();
      assert(heading.trim().length > 0, "Job detail heading is empty");

      const horizontalOverflow = await page.locator("body").evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      );
      assert(horizontalOverflow <= 2, `Job detail desktop has horizontal overflow: ${horizontalOverflow}px`);

      return {
        status: "rendered",
        jobId: firstJobId,
        heading
      };
    } finally {
      await browser.close();
    }
  });

  await check("frontend mobile layout DOM", async () => {
    const chromium = await loadPlaywrightChromium();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });

    try {
      await page.goto(`${frontendUrl}/`, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      await page.waitForSelector('[data-testid="home-page"]', { timeout: TIMEOUT_MS });
      await page.waitForSelector('[data-testid="job-card"]', { timeout: TIMEOUT_MS });

      const jobCardCount = await page.locator('[data-testid="job-card"]').count();
      assert(jobCardCount > 0, "Mobile home rendered no job cards");

      const horizontalOverflow = await page.locator("body").evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      );
      assert(horizontalOverflow <= 2, `Mobile has horizontal overflow: ${horizontalOverflow}px`);

      return {
        status: "rendered",
        jobCardCount,
        width: 390,
        horizontalOverflow
      };
    } finally {
      await browser.close();
    }
  });
}

await check("frontend auth/support routes", async () => {
  const routes = ["/login", "/register", "/forgot-password", "/support"];
  const statuses = [];
  for (const route of routes) {
    const response = await fetchWithTimeout(`${frontendUrl}${route}`);
    assert(response.ok, `Expected ${route} 2xx, got ${response.status}`);
    statuses.push({ route, status: response.status });
  }
  return statuses;
});

const failed = checks.filter((item) => !item.ok);
const icon = (ok) => (ok ? "OK" : "FAIL");

for (const item of checks) {
  const suffix = item.ok ? JSON.stringify(item.details) : item.error;
  console.log(`${icon(item.ok)} ${item.name} (${item.ms}ms) ${suffix}`);
}

if (failed.length > 0) {
  console.error(`Smoke failed: ${failed.length}/${checks.length} checks failed.`);
  process.exit(1);
}

console.log(`Smoke passed: ${checks.length}/${checks.length} checks passed.`);
