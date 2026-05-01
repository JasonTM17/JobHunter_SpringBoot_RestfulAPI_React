# Production Runbook

## Purpose

This runbook prepares, deploys, and verifies Jobhunter as a production MVP. The default target is a single-node Docker deployment. Multi-instance deployments should add shared Redis/session/rate-limit storage. Local production observability is documented in [Local Production Operations](LOCAL_PRODUCTION_OPERATIONS.md).

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

Build locally from source:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose logs -f backend
docker compose logs -f frontend
```

Pull release images from Docker Hub:

```powershell
docker pull nguyenson1710/jobhunter-backend:1.0.5
docker pull nguyenson1710/jobhunter-frontend:1.0.5

docker pull ghcr.io/jasontm17/jobhunter-backend:1.0.5
docker pull ghcr.io/jasontm17/jobhunter-frontend:1.0.5
```

For a controlled deployment, pin versioned image tags such as `1.0.5`. Use `latest` only when the environment intentionally tracks the newest successful `master` build.

Verify:

- `GET http://localhost:8080/actuator/health`
- `GET http://localhost:3001`
- `GET http://localhost:3001/jobs/1`

## CD And Docker Hub

GitHub Actions publishes Docker Hub images when these repository secrets are configured:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_PASSWORD`

`DOCKERHUB_PASSWORD` should be a Docker Hub access token, not the account password. The token must have Read & Write permission for:

- `nguyenson1710/jobhunter-backend`
- `nguyenson1710/jobhunter-frontend`

The CD workflow includes a preflight check for Docker Hub `pull,push` scope. If the token is missing or under-scoped, release tags still run Docker build verification instead of silently pretending to publish.

The same CD workflow also publishes GitHub Packages to GitHub Container Registry with the repository `GITHUB_TOKEN`:

- `ghcr.io/jasontm17/jobhunter-backend`
- `ghcr.io/jasontm17/jobhunter-frontend`

These GHCR packages are linked to the repository so the GitHub sidebar can show production artifacts under Packages.

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

The local production Compose stack now provides uptime checks, alerts, Loki logs, Grafana dashboards, and OpenTelemetry collection:

```powershell
npm run prod:local
```

Check regularly:

- `http://localhost:8080/actuator/health`
- `http://localhost:9090` for Prometheus targets and rules
- `http://localhost:9093` for Alertmanager state
- `http://localhost:3002` for Grafana dashboard and Loki log search
- `logs/alerts/alerts.log` for local alert webhook output
- Rates of 401/403/429/500 responses, CV upload failures, email/reset failures, and upload storage usage

## Backup And Restore

Scheduled MySQL backup is available through the Compose backup sidecar and writes to `backups/mysql`.

Run on demand:

```powershell
npm run mysql:backup
```

Restore:

```powershell
npm run mysql:restore -- -BackupFile .\backups\mysql\<backup-file>.sql.gz
```

Always test restores in staging first.

## Staging

Create and run staging before local production changes:

```powershell
Copy-Item .env.staging.example .env.staging
npm run staging:up
```

Staging uses separate ports and volumes:

- Frontend: `http://localhost:3101`
- Backend: `http://localhost:8180`
- MySQL host port: `3317`

## Rollback

1. Record the current image tag or commit before deploy.
2. If deployment fails, roll back to the previous image tag.
3. If a non-backward-compatible migration has run, use the prepared backup or rollback script.
4. Run smoke checks again after rollback.

Recommended rollback image tags:

- `nguyenson1710/jobhunter-backend:<previous-version>`
- `nguyenson1710/jobhunter-frontend:<previous-version>`

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
- Move centralized logs, traces, and metrics from the local Compose stack to a managed production provider if the app is deployed publicly.
- Add migration dry-run checks in CI/CD.
- Expand destructive-action audit coverage across admin operations.
