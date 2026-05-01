# Production Runbook

## Purpose

This runbook prepares, deploys, and verifies Jobhunter as a production MVP. The default target is a single-node Docker deployment. Multi-instance deployments should add shared Redis/session/rate-limit storage and stronger observability.

## Pre-flight Checklist

- Java 21, Node 22, and Docker are available.
- `.env` is created from `.env.example` and real secrets are not committed.
- `JWT_BASE64_SECRET` is strong and long enough for HS512.
- `DB_PASSWORD` and `JOBHUNTER_BOOTSTRAP_ADMIN_PASSWORD` are changed from defaults.
- `JOBHUNTER_SEED_ENABLED=false` when demo seed data is no longer needed.
- `JOBHUNTER_BOOTSTRAP_ADMIN_ENABLED=false` after a real admin account exists.
- `PASSWORD_RESET_DEV_TOKEN_ENABLED=false` in production.
- `JOBHUNTER_PROD_GUARD_ENABLED=true`.
- `JOBHUNTER_UNSAFE_METHOD_HEADER_ENABLED=true`.
- `JOBHUNTER_RATE_LIMIT_ENABLED=true`.
- `CORS_ALLOWED_ORIGINS` contains only trusted frontend origins.
- Swagger is enabled only with explicit intent.

## Build And Test Before Deploy

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

Smoke:

```powershell
npm run smoke:local -- --browser=true
```

## Docker Deploy

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose logs -f backend
docker compose logs -f frontend
```

Verify:

- `GET http://localhost:8080/actuator/health`
- `GET http://localhost:3001`
- `GET http://localhost:3001/jobs/1`

## Production Guard

With `SPRING_PROFILES_ACTIVE=prod`, the backend fails fast when risky settings remain enabled. If the backend does not start, read the log message and fix the environment instead of disabling the guard.

Common blocked settings:

- Default or weak JWT secret.
- Insecure cookie settings.
- Password reset dev token enabled.
- Seed or bootstrap admin enabled.
- Swagger enabled without intent.

## Unsafe Method Header

Unsafe requests under `/api/**` require:

```http
X-Jobhunter-Client: web
```

The frontend adds this automatically. When using Postman or another client, add this header for `POST/PUT/PATCH/DELETE`.

## Database And Migrations

- Flyway runs when the backend starts.
- Back up the database before production migrations.
- Do not edit released migrations after they have run in production.
- Use a new migration for data fixes and keep a rollback plan.

## Minimum Monitoring

Check regularly:

- `/actuator/health`
- Backend logs
- Frontend server logs
- Rates of 401/403/429/500 responses
- CV upload failures
- Email/reset password failures
- Upload storage usage

## Rollback

1. Record the current image tag or commit before deploy.
2. If deployment fails, roll back to the previous image tag.
3. If a non-backward-compatible migration has run, use the prepared backup or rollback script.
4. Run smoke checks again after rollback.

## Post-deploy Smoke

Verify manually or with browser automation:

- Home renders job cards, sorting, and About.
- Job detail loads correctly.
- Candidate can log in and apply with a CV.
- Candidate workspace shows history and CV library.
- Recruiter can update resume status with a note.
- Admin can open users management.
- Mobile 390px has no horizontal overflow.

## Scaling After MVP

- Move rate limiting to Redis.
- Move uploads to object storage.
- Add centralized logs, traces, and metrics.
- Add migration dry-run checks in CI/CD.
- Expand destructive-action audit coverage across admin operations.
