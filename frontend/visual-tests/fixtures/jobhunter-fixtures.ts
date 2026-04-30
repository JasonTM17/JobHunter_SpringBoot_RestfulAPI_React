import type { Page, Route } from "@playwright/test";

const companies = [
  {
    id: 1,
    name: "Jobhunter Labs",
    address: "Ha Noi",
    description: "Product engineering studio for developer-first hiring tools.",
    logo: null
  },
  {
    id: 2,
    name: "Cloudway Digital",
    address: "Ho Chi Minh City",
    description: "Cloud-native delivery partner for high-growth software teams.",
    logo: null
  },
  {
    id: 3,
    name: "Nexora Systems",
    address: "Da Nang",
    description: "Enterprise platform team focused on data, automation and reliability.",
    logo: null
  }
];

const skills = [
  { id: 1, name: "ReactJS" },
  { id: 2, name: "TypeScript" },
  { id: 3, name: "Java" },
  { id: 4, name: "Spring" },
  { id: 5, name: "AWS" },
  { id: 6, name: "DevOps" },
  { id: 7, name: "Docker" },
  { id: 8, name: "Kubernetes" }
];

const jobs = [
  {
    id: 101,
    name: "Senior Frontend Engineer",
    location: "HANOI",
    salary: 42000000,
    quantity: 2,
    level: "SENIOR",
    active: true,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2099-12-31T00:00:00.000Z",
    description:
      "<p>Own polished hiring-product UI with React, TypeScript and strong accessibility discipline.</p>",
    company: companies[0],
    skills: [skills[0], skills[1], skills[4]]
  },
  {
    id: 102,
    name: "Backend Java Engineer",
    location: "HOCHIMINH",
    salary: 38000000,
    quantity: 3,
    level: "MIDDLE",
    active: true,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2099-10-20T00:00:00.000Z",
    description: "<p>Build resilient APIs and data workflows for a high-volume recruitment platform.</p>",
    company: companies[1],
    skills: [skills[2], skills[3], skills[6]]
  },
  {
    id: 103,
    name: "Cloud DevOps Specialist",
    location: "REMOTE",
    salary: 50000000,
    quantity: 1,
    level: "SENIOR",
    active: true,
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2099-08-15T00:00:00.000Z",
    description: "<p>Lead CI/CD, observability and Kubernetes platform improvements across product squads.</p>",
    company: companies[2],
    skills: [skills[4], skills[5], skills[7]]
  }
];

function envelope(data: unknown, message = "OK") {
  return {
    statusCode: 200,
    error: null,
    message,
    data
  };
}

function paginated(result: unknown[]) {
  return {
    meta: {
      page: 1,
      pageSize: 12,
      pages: 1,
      total: result.length
    },
    result
  };
}

async function fulfillJson(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data)
  });
}

function sortJobs(url: string) {
  const parsedUrl = new URL(url);
  const sort = parsedUrl.searchParams.get("sort") ?? "latest";
  const nextJobs = [...jobs];
  if (sort === "salary_desc") {
    return nextJobs.sort((a, b) => b.salary - a.salary);
  }
  if (sort === "deadline_asc") {
    return nextJobs.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  }
  return nextJobs.sort((a, b) => b.id - a.id);
}

export async function mockJobhunterPublicApi(page: Page) {
  await page.route("**/api/v1/auth/**", async (route) => {
    await fulfillJson(route, envelope(null, "Anonymous"), 401);
  });

  await page.route("**/api/v1/ai/status", async (route) => {
    await fulfillJson(route, envelope({ available: false, message: "AI unavailable in visual tests" }));
  });

  await page.route("**/api/v1/jobs**", async (route) => {
    const url = route.request().url();
    const detailMatch = url.match(/\/api\/v1\/jobs\/(\d+)/);
    if (detailMatch) {
      const job = jobs.find((item) => item.id === Number(detailMatch[1])) ?? jobs[0];
      await fulfillJson(route, envelope(job));
      return;
    }

    await fulfillJson(route, envelope(paginated(sortJobs(url))));
  });

  await page.route("**/api/v1/companies**", async (route) => {
    await fulfillJson(route, envelope(paginated(companies)));
  });

  await page.route("**/api/v1/skills**", async (route) => {
    await fulfillJson(route, envelope(paginated(skills)));
  });
}
