# Jobhunter Frontend

The Jobhunter frontend uses Next.js pages router, React 19, TypeScript, and TailwindCSS. The main UI is optimized for a dense IT recruitment job board: search-first home, clear salary/skill/deadline information, quick detail, two-column job detail, and role-based workspaces for candidates, recruiters, and admins.

## Stack

- Next.js 16.2.4
- React 19.1.0
- TypeScript 5.8
- TailwindCSS 3.4
- Jest + Testing Library
- Playwright E2E and visual regression

## Env

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_STORAGE_BASE_URL=http://localhost:8080
INTERNAL_API_BASE_URL=http://backend:8080
```

## Run Local

```powershell
cd frontend
npm install
npm run dev
```

Default URLs:

- `http://localhost:3010`
- `http://localhost:3010/jobs/1`
- `http://localhost:3010/candidate`
- `http://localhost:3010/recruiter`
- `http://localhost:3010/admin`

Additional scripts:

- `npm run dev:webpack`: compare dev runtime behavior with webpack when needed.
- `npm run dev:3000`: run on port 3000 when no other local project is using it.

## Main Modules

- Public portal `/`: hero search, city select, trending skills, job board, top employers, content hub, subscriber, and About.
- Job detail `/jobs/[id]`: main job description, sticky apply panel, URL/upload CV, CV library, and duplicate-apply state.
- Candidate workspace `/candidate`: account-scoped saved jobs, application history, CV library, and status audit timeline.
- Recruiter/admin workspace `/?tab=manage`, `/recruiter`, `/admin`: jobs, companies, skills, users, resumes, filters, pagination UI, status notes, and destructive confirmation.
- Auth/system pages: `/login`, `/register`, `/forgot-password`, `/account`, `/support`, `/403`, `/404`, `/500`.

## API Conventions

- Frontend calls the backend through `services/api-client.ts`.
- `NEXT_PUBLIC_STORAGE_BASE_URL` is always used for rendered asset URLs so browser images never point at Docker-only hostnames such as `backend`.
- Unsafe methods automatically include `X-Jobhunter-Client: web`.
- Guest saved jobs fall back to `localStorage`.
- Authenticated saved jobs and candidate CV library are synchronized with the backend account.
- Backend rich text is sanitized with an allowlist before rendering.
- Frontend runtime errors are captured by `ClientErrorReporter`, posted to `/api/client-errors`, logged as structured JSON, and collected by Loki in the local production stack.

## Quality Gates

```powershell
npm run lint
npm test -- --runInBand
npm run build
npm run test:e2e
npm run test:visual
npm audit --omit=dev --audit-level=high
```

Smoke from the repository root after backend/frontend are running:

```powershell
npm run smoke:local -- --browser=true
```

## Visual And E2E

- E2E config: `playwright.e2e.config.ts`
- E2E specs: `e2e-tests/*.e2e.spec.ts`
- E2E mock API: `e2e-tests/fixtures/jobhunter-e2e.ts`
- Visual config: `playwright.config.ts`
- Visual specs: `visual-tests/*.visual.spec.ts`

Current coverage:

- Guest browse, sort, filter, and open job detail.
- Mobile job board overflow check.
- Register and forgot/reset password.
- Candidate login, apply CV URL, and application history.
- Candidate CV library: set default, delete, and default promotion.
- Recruiter pipeline: filter, status update, and audit note.
- Admin users management on desktop/mobile.

## UI Notes

- Keep main cards/buttons at `rounded-lg` or less.
- Do not nest cards inside cards for page sections.
- Text inside buttons/cards must avoid overflow at 390px, 768px, and 1366px.
- Jobhunter keeps its own brand and only uses external job-board references for interaction rhythm, not proprietary assets or copy.
