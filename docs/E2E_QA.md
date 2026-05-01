# E2E And QA Guide

## Goal

Jobhunter E2E and QA coverage checks the most important user journeys before release: guest job discovery, candidate application, recruiter pipeline management, admin operations, and responsive mobile behavior.

## Commands

Frontend unit/integration:

```powershell
cd frontend
npm run lint
npm test -- --runInBand
npm run build
```

Playwright E2E:

```powershell
cd frontend
npm run test:e2e
```

Playwright visual regression:

```powershell
cd frontend
npm run test:visual
```

Smoke from the repository root:

```powershell
npm run smoke:local -- --browser=true
```

## Current E2E Coverage

Public job discovery:

- Guest opens home.
- Guest sorts and filters the job board.
- Guest opens job detail.
- Mobile job board has no horizontal overflow.

Auth and candidate:

- Visitor registers and lands on login.
- Visitor requests and submits password reset in dev mode.
- Candidate logs in.
- Candidate applies with CV URL.
- Candidate sees application history.
- Candidate sees CV library.
- Candidate sets a default CV.
- Candidate deletes CVs and the UI promotes the remaining default.

Recruiter/admin:

- Recruiter opens the resume pipeline.
- Recruiter filters resumes.
- Recruiter updates status with an audit note.
- Admin opens users management.
- Desktop and mobile are both covered; mobile management is no longer skipped.

Visual:

- Job board default desktop/mobile.
- Job board salary sort desktop/mobile.

Smoke browser:

- Frontend home HTTP.
- Jobs API.
- Jobs salary sort API.
- Companies API.
- Skills API.
- Job detail API.
- Frontend job detail route.
- DOM job board has cards, sort, and About.
- DOM job detail has heading.
- Mobile DOM has no horizontal overflow.
- Auth/support routes load.

## Mock Data

E2E mock API data lives at:

```text
frontend/e2e-tests/fixtures/jobhunter-e2e.ts
```

Visual tests use their own fixture data to keep snapshots stable and independent from a local database.

## Manual Browser QA

After the app is running at `http://localhost:3010`, verify:

1. Home has job cards, sort control, and About.
2. Salary-desc sort updates the URL to `?sort=salary_desc`.
3. Job detail `/jobs/1` loads the heading and apply panel.
4. `/candidate` shows CV library for a logged-in candidate.
5. `/?tab=manage&module=resumes` shows the pipeline for recruiter/admin users.
6. Browser console has no unexpected errors.

## When E2E Fails

- If selectors fail, check accessible names or stable `data-testid` attributes.
- If route/API mock data fails, update fixtures before touching the real backend.
- If mobile overflow fails, check fixed widths, grid min-width, and text wrapping.
- If visual changes are intentional, review screenshots and then run `npm run test:visual:update`.
- If smoke fails because of frontend port, pass an explicit `--frontend-url`.

## Minimum Release Gate

Before release, pass:

- `.\gradlew.bat test`
- `npm run lint`
- `npm test -- --runInBand`
- `npm run build`
- `npm run test:e2e`
- `npm run test:visual`
- `npm audit --omit=dev --audit-level=high`
- `npm run smoke:local -- --browser=true`
