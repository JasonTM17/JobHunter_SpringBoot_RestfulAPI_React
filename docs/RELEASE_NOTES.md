# Release Notes

## v1.0.5-github-packages-and-docs - 2026-05-01

### Summary

This release polishes the GitHub repository presentation. It adds GitHub Container Registry publication so the repository has real GitHub Packages, refreshes the README/About documentation for portfolio review, and verifies that the official GitHub contributors API only reports the primary author.

### Repository Presentation

- Renames the CD workflow to `CD - Container Publish`.
- Keeps Docker Hub publication with credential preflight.
- Adds GitHub Packages publication to GHCR for backend and frontend images.
- Documents Docker Hub and GHCR pull commands in the README and runbook.
- Rewrites the About document into a clearer product, engineering, operations, and portfolio positioning brief.

### GitHub Packages

Published package targets:

- `ghcr.io/jasontm17/jobhunter-backend:1.0.5`
- `ghcr.io/jasontm17/jobhunter-frontend:1.0.5`
- `ghcr.io/jasontm17/jobhunter-backend:latest`
- `ghcr.io/jasontm17/jobhunter-frontend:latest`

### Contributor Verification

- Local `git shortlog -sne --all` reports only `Nguyen Son <jasonbmt06@gmail.com>`.
- GitHub contributors API reports only `JasonTM17`.
- If the GitHub sidebar still shows an older contributor immediately after the rewrite, it is a GitHub UI/cache delay rather than a remaining local or API-level contributor source.

## v1.0.4-local-production-ops - 2026-05-01

### Summary

This release upgrades Jobhunter from a green production MVP into a portfolio-grade local production system. It adds staging, monitoring, alerts, log aggregation, OpenTelemetry collection, frontend client error reporting, and scheduled MySQL backup/restore without requiring a public domain.

### Operations

- Added `docker-compose.observability.yml` with Prometheus, Blackbox Exporter, Alertmanager, a local alert webhook, Loki, Promtail, OpenTelemetry Collector, and Grafana.
- Added backend health and frontend uptime alert rules, plus JVM memory and 5xx-rate alerts.
- Added a provisioned Grafana dashboard for health, JVM memory, HTTP request rate, and local alert log visibility.
- Added `docker-compose.backup.yml` with a scheduled MySQL backup sidecar and restore profile.
- Added one-command backup/restore scripts for Windows local operation.
- Added `docker-compose.staging.yml` and `.env.staging.example` for a separate staging environment before local production.

### Telemetry

- Added backend OpenTelemetry export support through Micrometer tracing and OTLP exporter.
- Added frontend `ClientErrorReporter` and `/api/client-errors` endpoint for structured client error logs.
- Wired Docker Compose environment variables for local production and staging trace/resource metadata.

### Documentation

- Added `docs/LOCAL_PRODUCTION_OPERATIONS.md`.
- Updated README, About, Production Runbook, Backend guide, Frontend guide, E2E QA guide, and environment examples.

### Docker Hub

Release images:

- `nguyenson1710/jobhunter-backend:1.0.4`
- `nguyenson1710/jobhunter-frontend:1.0.4`
- `nguyenson1710/jobhunter-backend:latest`
- `nguyenson1710/jobhunter-frontend:latest`

## v1.0.3-dockerhub-preflight - 2026-05-01

### Summary

This patch makes the CD workflow safer and verifies Docker Hub image publication for the production MVP. The workflow checks Docker Hub `pull,push` scope before attempting publication and has been rerun successfully after credentials were granted Read & Write permission.

### Fixes

- Adds Docker Hub push-scope preflight for `jobhunter-backend` and `jobhunter-frontend`.
- Skips Docker Hub publication with a clear warning when credentials are missing write scope.
- Keeps tag release Docker build verification green when publishing is intentionally skipped.
- Publishes backend and frontend release images after Docker Hub credentials are valid.

### Docker Hub Publish Status

Docker Hub secrets are configured and image publication has been verified on the rerun of the `v1.0.3` release workflow.

Published images:

- `nguyenson1710/jobhunter-backend:1.0.3`
- `nguyenson1710/jobhunter-frontend:1.0.3`
- `nguyenson1710/jobhunter-backend:latest`
- `nguyenson1710/jobhunter-frontend:latest`

If a future token is rotated, it must keep Docker Hub Read & Write permission for both image repositories.

## v1.0.2-cd-verification - 2026-05-01

### Summary

This patch hardens the release workflow after the production MVP became green in CI. The CD workflow now keeps a real Docker build verification path for release tags even when Docker Hub credentials are not configured.

### Fixes

- Keeps `CD - Docker Hub Publish` readable with clean ASCII workflow names and labels.
- Runs tag Docker build verification when Docker Hub publishing is intentionally skipped because secrets are missing.
- Updates Docker image metadata to match the current stack: Spring Boot backend and Next.js 16 frontend.
- Prevents a release tag from showing a fully green workflow while both publish and build verification jobs are skipped.

### Verification

- Backend `.\gradlew.bat test`
- Frontend `npm run lint`
- Frontend `npm test -- --runInBand`: 61/61
- Frontend `npm run build`
- Frontend `npm run test:e2e`: 16/16
- Frontend `npm run test:visual`: 4/4
- Frontend `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities
- GitHub Actions CI/CD checked on `master` and release tag.

## v1.0.1-ci-hardening - 2026-04-30

### Summary

This patch fixed the GitHub Actions issues discovered after publishing `v1.0.0`.

### Fixes

- Fixed Docker smoke on a fresh MySQL volume by ensuring Flyway migrations run before demo seed/bootstrap data.
- Stabilized mobile visual regression on Linux runners with a CI-specific tolerance.
- Made the salary-sort visual test deterministic by loading the sorted URL directly.

### Verification

- Backend `.\gradlew.bat test`
- Frontend `npm run lint`
- Frontend `npm test -- --runInBand`
- Frontend `npm run build`
- Frontend `npm run test:e2e`: 16/16
- Frontend `npm run test:visual`: 4/4
- Frontend `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities
- Root `npm run smoke:local -- --browser=true`: 11/11 in CI smoke.

## v1.0.0-production-mvp - 2026-04-30

### Summary

This release brings Jobhunter to a production MVP state: a complete public job board, candidate CV apply flows, recruiter pipeline with audit notes, admin workspace, production security hardening, and stable E2E/visual/smoke coverage.

### Highlights

- Refactored the UI into a professional IT recruitment job board: search-first home, dense job cards, quick detail, content hub, and About section.
- Added a two-column job detail layout with sticky apply panel, CV upload/URL support, duplicate-apply state, and candidate workspace link.
- Added account-scoped saved jobs, application history, CV library, default CV, and resume status audit timeline for candidates.
- Added recruiter pipeline filtering, status updates, notes, and resume status audit history.
- Improved admin and recruiter management with filter/pagination UI, mobile E2E coverage, and clearer destructive confirmation.
- Added subscriber unsubscribe tokens, reactivation flow, and email preference foundations.
- Added forgot/reset password tokens, with dev-only token display controlled by configuration.
- Updated Next.js to `16.2.4` and cleared high production audit findings.

### Backend

- Added production startup guard for `prod` profile.
- Added unsafe-method header guard: `X-Jobhunter-Client: web`.
- Added in-memory MVP rate limiting for login, forgot/reset password, and AI chat.
- Added CV/document upload validation for extension, content type, magic header, and max size.
- Added resume status audit storage and scoped audit timeline endpoint.
- Added candidate CV library APIs.
- Added subscriber unsubscribe token and endpoint.
- Expanded tests for security hardening, password reset, resume audit, saved jobs, subscriber flows, and candidate CV library.

### Frontend

- API client automatically sends the unsafe-method guard header.
- Rich text rendering uses an allowlist sanitizer.
- Home page was split into clearer sections and hooks, including a stronger About section.
- Job board supports real sorting: latest, salary descending, and deadline ascending.
- Candidate apply flow loads CV library and can save uploaded CVs to the backend.
- Candidate workspace displays CV library and resume audit status history.
- E2E covers public, candidate, recruiter, and admin journeys across desktop and mobile.

### Documentation

- Rewrote the root README for production MVP positioning.
- Added `docs/ABOUT.md`.
- Added `docs/RELEASE_NOTES.md`.
- Added `docs/PRODUCTION_RUNBOOK.md`.
- Added `docs/E2E_QA.md`.
- Updated `frontend/README.md` with modules, API conventions, and quality gates.

### Migrations

New migrations:

- `V3__resume_audits_and_password_reset.sql`
- `V4__subscriber_unsubscribe_and_candidate_cvs.sql`

For a real production database, do not edit migrations that have already run. Add a new migration or use a controlled Flyway repair process from the production runbook.
