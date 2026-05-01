# About Jobhunter

## Vision

Jobhunter is a production MVP for an IT recruitment platform in Vietnam. It focuses on three practical outcomes: helping candidates find and compare jobs faster, helping recruiters handle applications with more structure, and helping administrators operate recruitment data safely.

## Primary Users

- IT candidates: search by skill, city, level, salary, and keyword; save jobs; apply using a CV URL or uploaded CV; track application status.
- Recruiters: manage company jobs, review the resume pipeline, filter by job/status, update application status, and leave audit notes.
- Administrators: manage users, companies, jobs, skills, roles, permissions, and common operational error states.

## Product Value

- Search-first experience: users can start job discovery immediately without a long marketing landing page.
- Dense but scannable job data: salary, skills, company, level, location, deadline, and CTAs are visible where users need them.
- Real application workflow: account-scoped saved jobs, CV library, application history, and status tracking.
- Scoped operations: recruiters operate inside their company scope, candidates only see their own data, and admins have broader oversight.
- Verified quality: backend tests, frontend type checks, Jest, desktop/mobile E2E, visual regression, smoke checks, and production audit.

## MVP Scope

Included:

- Public home, job board, and job detail.
- Login, registration, forgot password, and reset password.
- Candidate saved jobs, CV apply, CV library, and application history.
- Recruiter resume pipeline and status audit notes.
- Admin workspace for core operational data.
- Subscriber/newsletter flow, email preferences, and unsubscribe token foundation.
- MVP security hardening: production guard, unsafe-method header, rate limit, upload validation, and rich-text sanitizer.

Not enterprise-complete yet:

- Rate limiting is in-memory and single-node; Redis should be used for multi-instance deployments.
- Email recommendations depend on runtime SMTP configuration.
- Management server-side pagination can be expanded further for very large datasets.
- Destructive-action audit can be extended to every admin operation in a later phase.

## Design Principles

- Prioritize fast scanning, dense information, and low-friction workflows.
- Keep Jobhunter's red-white brand balanced with slate, white, and emerald so the UI does not feel overly red.
- Main workflows must remain usable at 390px mobile, 768px tablet, and 1366px desktop.
- Do not copy proprietary logos, assets, or copy from reference sites.

## Current Release Positioning

The current `v1.0.3` release is suitable for a production MVP demo, local or Docker execution, portfolio presentation, internship/project review, and further development into a more complete IT recruitment platform.

## Operational Maturity

- CI validates backend tests, frontend type checks, Jest, build, E2E, visual regression, and smoke checks.
- CD publishes versioned Docker images for backend and frontend when Docker Hub credentials are valid.
- Release tags are documented and traceable through GitHub Releases.
- Docker Hub images are available for controlled demos and repeatable deployments.
