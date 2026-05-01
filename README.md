# Jobhunter - Production MVP for IT Recruitment

Jobhunter is a full-stack IT recruitment platform for candidates, recruiters, and administrators. It is built with Spring Boot, Next.js, MySQL, Flyway, Docker, RBAC, E2E tests, visual regression, and production-oriented hardening.

## Core Documentation

- [Product About](docs/ABOUT.md)
- [Release Notes](docs/RELEASE_NOTES.md)
- [Production Runbook](docs/PRODUCTION_RUNBOOK.md)
- [E2E and QA Guide](docs/E2E_QA.md)
- [Frontend Guide](frontend/README.md)
- [Backend Guide](backend/README.md)

## Current Product State

- Public job board with search, filters, sorting, quick detail, job detail, top employers, content hub, subscriber flow, and About section.
- Candidate workspace with account-scoped saved jobs, CV URL/upload apply flow, CV library, application history, and resume status audit timeline.
- Recruiter workspace with company-scoped resume pipeline, status filters, status update notes, and audit history.
- Admin workspace for users, companies, jobs, skills, roles, and permissions.
- Auth flows for login, registration, forgot/reset password, HttpOnly cookie auth, RBAC, and email preferences.
- MVP hardening: production startup guard, unsafe-method client header, in-memory rate limits, allowlist rich-text sanitizer, upload validation, smoke tests, E2E, and visual regression.

## Architecture

```text
Browser
  |
  | HTTP/REST
  v
Next.js 16 + React 19 + TypeScript + TailwindCSS
  |
  | /api/v1
  v
Spring Boot 4 + Java 21 + Spring Security + JPA
  |
  | Flyway migrations
  v
MySQL 8.4
```

Docker Compose provides a local stack with frontend, backend, MySQL, and optional Redis. The backend exposes Actuator health/metrics and Swagger UI when explicitly enabled.

## Quick Local Run

Requirements:

- Java 21
- Node.js 22
- Docker Desktop for Compose-based runs

Backend:

```powershell
cd backend
.\gradlew.bat bootRun
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Default URLs:

- Frontend dev: `http://localhost:3010`
- Frontend Docker: `http://localhost:3001`
- Backend: `http://localhost:8080`
- API prefix: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/swagger-ui.html`

If the backend port changes, update `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_STORAGE_BASE_URL`, and `CORS_ALLOWED_ORIGINS`.

## Docker Compose

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Important environment variables:

- `FRONTEND_PORT`
- `BACKEND_PORT`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_STORAGE_BASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_BASE64_SECRET`
- `JOBHUNTER_SEED_ENABLED`
- `JOBHUNTER_BOOTSTRAP_ADMIN_ENABLED`
- `JOBHUNTER_PROD_GUARD_ENABLED`
- `JOBHUNTER_UNSAFE_METHOD_HEADER_ENABLED`
- `JOBHUNTER_RATE_LIMIT_ENABLED`

## Quality Gates

Backend:

```powershell
cd backend
.\gradlew.bat test
```

Frontend:

```powershell
cd frontend
npm run lint
npm test -- --runInBand
npm run build
npm run test:e2e
npm run test:visual
npm audit --omit=dev --audit-level=high
```

Smoke from the repository root after backend and frontend are running:

```powershell
npm run smoke:local -- --browser=true
```

Latest verified gates on 2026-05-01:

- Backend `.\gradlew.bat test`
- Frontend `npm run lint`
- Frontend Jest 61/61
- Frontend production build
- Playwright E2E 16/16
- Playwright visual regression 4/4
- Production audit 0 high vulnerabilities
- GitHub Actions CI green on `master`
- GitHub Actions CD green on `master` and `v1.0.1`

## Production Security

When `SPRING_PROFILES_ACTIVE=prod`, the backend fails fast if unsafe production settings remain enabled: default JWT secret, insecure cookies, password reset dev tokens, seed/bootstrap admin, or Swagger without intent.

Unsafe `POST/PUT/PATCH/DELETE` calls under `/api/**` require:

```http
X-Jobhunter-Client: web
```

The frontend API client adds this header automatically. It can be disabled by environment variable for external API integrations, but the production MVP should keep it enabled.

## Database Migrations

Flyway scripts live in:

```text
backend/src/main/resources/db/migration/
```

Rules:

- Add a new migration for schema changes.
- Do not edit released migrations after a production database has run them.
- Use `SON_JPA_DDL_AUTO=none` in production.

## Release Process

1. Update [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md).
2. Run all quality gates.
3. Run local smoke with browser DOM checks.
4. Review production environment settings using [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md).
5. Create the Git tag following the project version convention.
6. After deploy, verify `/actuator/health`, public home, job detail, login, candidate apply, recruiter pipeline, and admin workspace.

## License

MIT License.
