import type { Page, Route } from "@playwright/test";

type AuthMode = "anonymous" | "candidate" | "recruiter" | "admin";

interface MockOptions {
  auth?: AuthMode;
}

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
      "<h3>Job description</h3><p>Own polished hiring-product UI with React, TypeScript and accessibility discipline.</p><h3>Requirements</h3><p>Strong React and TypeScript experience.</p><h3>Benefits</h3><p>Hybrid work and clear growth path.</p>",
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

const candidateUser = {
  id: 11,
  email: "candidate@jobhunter.local",
  name: "Candidate One",
  role: { name: "USER" },
  weeklyJobRecommendationEnabled: true
};

const recruiterUser = {
  id: 12,
  email: "recruiter@jobhunter.local",
  name: "Recruiter One",
  role: { name: "RECRUITER" },
  weeklyJobRecommendationEnabled: false
};

const adminUser = {
  id: 13,
  email: "admin@jobhunter.local",
  name: "Admin One",
  role: { name: "ADMIN" },
  weeklyJobRecommendationEnabled: false
};

const roles = [
  { id: 1, name: "USER", description: "Candidate", active: true },
  { id: 2, name: "RECRUITER", description: "Recruiter", active: true },
  { id: 3, name: "ADMIN", description: "Admin", active: true }
];

const permissions = [
  { id: 1, name: "Read resumes", apiPath: "/api/v1/resumes", method: "GET", module: "Resume" },
  { id: 2, name: "Update resume status", apiPath: "/api/v1/resumes/{id}/status", method: "PATCH", module: "Resume" },
  { id: 3, name: "Create resume", apiPath: "/api/v1/resumes", method: "POST", module: "Resume" },
  { id: 4, name: "Upload file", apiPath: "/api/v1/files", method: "POST", module: "File" },
  { id: 5, name: "Read users", apiPath: "/api/v1/users", method: "GET", module: "User" },
  { id: 6, name: "Create jobs", apiPath: "/api/v1/jobs", method: "POST", module: "Job" },
  { id: 7, name: "Update jobs", apiPath: "/api/v1/jobs", method: "PUT", module: "Job" }
];

const users = [
  {
    id: 11,
    name: "Candidate One",
    age: 24,
    email: "candidate@jobhunter.local",
    address: "Ha Noi",
    gender: "MALE",
    role: { id: 1, name: "USER" },
    company: null
  },
  {
    id: 12,
    name: "Recruiter One",
    age: 29,
    email: "recruiter@jobhunter.local",
    address: "Ho Chi Minh City",
    gender: "FEMALE",
    role: { id: 2, name: "RECRUITER" },
    company: { id: 1, name: "Jobhunter Labs" }
  }
];

const initialResumes = [
  {
    id: 501,
    email: "candidate@jobhunter.local",
    url: "https://example.com/cv.pdf",
    status: "PENDING",
    companyName: "Jobhunter Labs",
    createdDate: "2026-04-01T08:00:00.000Z",
    lastModifiedDate: "2026-04-02T10:30:00.000Z",
    lastModifiedBy: "recruiter@jobhunter.local",
    user: { id: 11, name: "Candidate One" },
    job: { id: 101, name: "Senior Frontend Engineer" }
  }
];

const resumeAudits = [
  {
    id: 9001,
    resumeId: 501,
    previousStatus: "PENDING",
    nextStatus: "REVIEWING",
    note: "Opened CV",
    actorUserId: 12,
    actorEmail: "recruiter@jobhunter.local",
    createdAt: "2026-04-02T10:30:00.000Z"
  }
];

const initialCandidateCvs = [
  {
    id: 301,
    fileUrl: "https://example.com/cv.pdf",
    fileName: "Candidate-One-CV.pdf",
    defaultCv: true,
    createdAt: "2026-04-01T08:00:00.000Z"
  },
  {
    id: 302,
    fileUrl: "https://example.com/cv-backend.pdf",
    fileName: "Candidate-Backend-CV.pdf",
    defaultCv: false,
    createdAt: "2026-04-03T08:00:00.000Z"
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

function paginated(result: unknown[], pageSize = 12) {
  return {
    meta: {
      page: 1,
      pageSize,
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
  const keyword = (parsedUrl.searchParams.get("q") ?? "").toLowerCase();
  let nextJobs = [...jobs];

  if (keyword) {
    nextJobs = nextJobs.filter((job) => {
      const haystack = [job.name, job.company.name, job.description, ...job.skills.map((skill) => skill.name)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }

  if (sort === "salary_desc") {
    return nextJobs.sort((a, b) => b.salary - a.salary);
  }
  if (sort === "deadline_asc") {
    return nextJobs.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  }
  return nextJobs.sort((a, b) => b.id - a.id);
}

function actionKeysFor(mode: AuthMode): string[] {
  if (mode === "candidate") {
    return ["POST /api/v1/resumes", "POST /api/v1/files", "GET /api/v1/saved-jobs"];
  }
  if (mode === "recruiter") {
    return [
      "GET /api/v1/resumes",
      "PATCH /api/v1/resumes/{id}/status",
      "DELETE /api/v1/resumes/{id}",
      "POST /api/v1/jobs",
      "PUT /api/v1/jobs"
    ];
  }
  if (mode === "admin") {
    return [
      "GET /api/v1/users",
      "POST /api/v1/users",
      "GET /api/v1/roles",
      "GET /api/v1/permissions",
      "GET /api/v1/resumes",
      "PATCH /api/v1/resumes/{id}/status",
      "DELETE /api/v1/resumes/{id}",
      "POST /api/v1/jobs",
      "PUT /api/v1/jobs",
      "DELETE /api/v1/jobs/{id}",
      "POST /api/v1/companies",
      "PUT /api/v1/companies",
      "DELETE /api/v1/companies/{id}",
      "POST /api/v1/skills",
      "PUT /api/v1/skills",
      "DELETE /api/v1/skills/{id}"
    ];
  }
  return [];
}

function userFor(mode: AuthMode) {
  if (mode === "candidate") return candidateUser;
  if (mode === "recruiter") return recruiterUser;
  if (mode === "admin") return adminUser;
  return null;
}

export async function mockJobhunterE2eApi(page: Page, options: MockOptions = {}) {
  let authMode: AuthMode = options.auth ?? "anonymous";
  let resumes = [...initialResumes];
  let savedJobs = [jobs[1]];
  let candidateCvs = [...initialCandidateCvs];

  await page.route("**/api/v1/auth/login", async (route) => {
    if (route.request().method() !== "POST") {
      await fulfillJson(route, envelope(null));
      return;
    }
    const body = route.request().postDataJSON() as { username?: string };
    if (body.username?.includes("admin")) authMode = "admin";
    else if (body.username?.includes("recruiter")) authMode = "recruiter";
    else authMode = "candidate";
    await fulfillJson(route, envelope({ user: userFor(authMode) }, "Logged in"));
  });

  await page.route("**/api/v1/auth/account", async (route) => {
    const user = userFor(authMode);
    if (!user) {
      await fulfillJson(route, envelope(null, "Anonymous"), 401);
      return;
    }
    await fulfillJson(route, envelope({ user }));
  });

  await page.route("**/api/v1/auth/capabilities**", async (route) => {
    const targetUserMatch = route.request().url().match(/\/api\/v1\/auth\/capabilities\/users\/(\d+)/);
    if (targetUserMatch) {
      await fulfillJson(
        route,
        envelope({
          targetUserId: Number(targetUserMatch[1]),
          canView: true,
          canUpdate: authMode === "admin",
          canDelete: authMode === "admin",
          canAssignRole: authMode === "admin",
          assignableRoles: roles.map((role) => ({ id: role.id, name: role.name }))
        })
      );
      return;
    }

    const user = userFor(authMode);
    if (!user) {
      await fulfillJson(route, envelope(null, "Anonymous"), 401);
      return;
    }
    await fulfillJson(
      route,
      envelope({
        actionKeys: actionKeysFor(authMode),
        canAccessManagement: authMode === "admin" || authMode === "recruiter",
        assignableRoles: roles.map((role) => ({ id: role.id, name: role.name }))
      })
    );
  });

  await page.route("**/api/v1/auth/register", async (route) => {
    await fulfillJson(route, envelope(null, "Registered"));
  });

  await page.route("**/api/v1/auth/forgot-password", async (route) => {
    await fulfillJson(route, envelope({ message: "Reset instructions sent", devResetToken: "dev-token-123" }));
  });

  await page.route("**/api/v1/auth/reset-password", async (route) => {
    await fulfillJson(route, envelope({ message: "Password updated" }));
  });

  await page.route("**/api/v1/ai/status", async (route) => {
    await fulfillJson(route, envelope({ available: false, message: "AI unavailable in e2e tests" }));
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
    await fulfillJson(route, envelope(paginated(skills, 50)));
  });

  await page.route("**/api/v1/saved-jobs**", async (route) => {
    const method = route.request().method();
    const match = route.request().url().match(/\/api\/v1\/saved-jobs\/(\d+)/);
    if (method === "POST" && match) {
      const job = jobs.find((item) => item.id === Number(match[1]));
      if (job && !savedJobs.some((item) => item.id === job.id)) savedJobs = [...savedJobs, job];
    }
    if (method === "DELETE" && match) {
      savedJobs = savedJobs.filter((item) => item.id !== Number(match[1]));
    }
    await fulfillJson(route, envelope(savedJobs));
  });

  await page.route("**/api/v1/candidate/cvs**", async (route) => {
    const method = route.request().method();
    const defaultMatch = route.request().url().match(/\/api\/v1\/candidate\/cvs\/(\d+)\/default/);
    const deleteMatch = route.request().url().match(/\/api\/v1\/candidate\/cvs\/(\d+)$/);

    if (method === "POST") {
      const body = route.request().postDataJSON() as { fileUrl?: string; fileName?: string; defaultCv?: boolean };
      const nextCv = {
        id: Date.now(),
        fileUrl: body.fileUrl ?? "https://example.com/uploaded-cv.pdf",
        fileName: body.fileName ?? "uploaded-cv.pdf",
        defaultCv: Boolean(body.defaultCv) || candidateCvs.length === 0,
        createdAt: "2026-04-30T08:00:00.000Z"
      };
      if (nextCv.defaultCv) {
        candidateCvs = candidateCvs.map((cv) => ({ ...cv, defaultCv: false }));
      }
      candidateCvs = [nextCv, ...candidateCvs];
      await fulfillJson(route, envelope(nextCv));
      return;
    }

    if (method === "PATCH" && defaultMatch) {
      const cvId = Number(defaultMatch[1]);
      candidateCvs = candidateCvs.map((cv) => ({ ...cv, defaultCv: cv.id === cvId }));
      await fulfillJson(route, envelope(candidateCvs.find((cv) => cv.id === cvId) ?? candidateCvs[0]));
      return;
    }

    if (method === "DELETE" && deleteMatch) {
      candidateCvs = candidateCvs.filter((cv) => cv.id !== Number(deleteMatch[1]));
      await fulfillJson(route, envelope(null));
      return;
    }

    await fulfillJson(route, envelope(candidateCvs));
  });

  await page.route("**/api/v1/resumes/by-user**", async (route) => {
    await fulfillJson(route, envelope(paginated(resumes)));
  });

  await page.route("**/api/v1/resumes/*/audits", async (route) => {
    await fulfillJson(route, envelope(resumeAudits));
  });

  await page.route("**/api/v1/resumes/*/status", async (route) => {
    const body = route.request().postDataJSON() as { status?: string; note?: string };
    resumes = resumes.map((resume) =>
      resume.id === 501
        ? { ...resume, status: (body.status as "PENDING") ?? resume.status, lastModifiedBy: userFor(authMode)?.email ?? "system" }
        : resume
    );
    await fulfillJson(route, envelope({ id: 501, status: body.status, note: body.note }));
  });

  await page.route(/.*\/api\/v1\/resumes(\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const body = route.request().postDataJSON() as { jobId?: number; url?: string };
      const job = jobs.find((item) => item.id === body.jobId) ?? jobs[0];
      resumes = [
        {
          id: 777,
          email: candidateUser.email,
          url: body.url ?? "https://example.com/new-cv.pdf",
          status: "PENDING",
          companyName: job.company.name,
          createdDate: "2026-04-30T08:00:00.000Z",
          lastModifiedDate: "2026-04-30T08:00:00.000Z",
          lastModifiedBy: candidateUser.email,
          user: { id: candidateUser.id, name: candidateUser.name },
          job: { id: job.id, name: job.name }
        },
        ...resumes
      ];
      await fulfillJson(route, envelope({ id: 777 }));
      return;
    }
    await fulfillJson(route, envelope(paginated(resumes)));
  });

  await page.route("**/api/v1/users**", async (route) => {
    await fulfillJson(route, envelope(paginated(users, 50)));
  });

  await page.route("**/api/v1/roles**", async (route) => {
    await fulfillJson(route, envelope(paginated(roles, 50)));
  });

  await page.route("**/api/v1/permissions**", async (route) => {
    await fulfillJson(route, envelope(paginated(permissions, 80)));
  });

  await page.route("**/api/v1/subscribers", async (route) => {
    await fulfillJson(route, envelope(null, "Subscribed"));
  });

  await page.route("**/api/v1/files", async (route) => {
    await fulfillJson(
      route,
      envelope({
        fileName: "cv.pdf",
        folder: "resume",
        fileUrl: "https://example.com/uploaded-cv.pdf",
        size: 1024,
        uploadedAt: "2026-04-30T08:00:00.000Z"
      })
    );
  });
}
