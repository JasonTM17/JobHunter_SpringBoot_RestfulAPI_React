# Local Production Operations

This guide runs Jobhunter like a small production system on a local machine. It does not require a public domain. The goal is repeatable portfolio-grade operations: staging first, monitored local production, scheduled MySQL backups, alerting, log aggregation, and error telemetry.

## Topology

```text
Browser
  -> Next.js frontend
  -> Spring Boot backend
  -> MySQL

Operations stack:
  Prometheus -> Alertmanager -> local alert webhook
  Blackbox Exporter -> uptime checks
  Promtail -> Loki -> Grafana logs
  OpenTelemetry Collector -> traces and metrics bridge
  MySQL backup sidecar -> ./backups/mysql
```

## URLs

- Frontend: `http://localhost:3001`
- Backend health: `http://localhost:8080/actuator/health`
- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
- Local alert webhook: `http://localhost:9094/health`
- Loki: `http://localhost:3100`
- Grafana: `http://localhost:3002`
- OpenTelemetry health: `http://localhost:13133`

Default Grafana credentials for local demo are:

```text
admin / jobhunter
```

Change `GRAFANA_ADMIN_PASSWORD` in `.env` before sharing the machine or demo environment.

## Staging Before Production

Create a staging env file:

```powershell
Copy-Item .env.staging.example .env.staging
```

Start staging:

```powershell
npm run staging:up
```

Staging uses separate ports, network, and volumes:

- Frontend: `http://localhost:3101`
- Backend: `http://localhost:8180`
- MySQL host port: `3317`

Stop staging:

```powershell
npm run staging:down
```

Use staging for migrations, UI smoke, and release candidate checks before touching the local production stack.

## Local Production Stack

Create `.env`:

```powershell
Copy-Item .env.example .env
```

Start application + observability + scheduled backups:

```powershell
npm run prod:local
```

Watch logs:

```powershell
npm run prod:logs
```

Stop:

```powershell
npm run prod:down
```

The default local profile keeps seed/demo-friendly values so the portfolio can be started quickly. For a stricter rehearsal, set production-like values in `.env`:

```env
SPRING_PROFILES_ACTIVE=prod,docker
JOBHUNTER_SEED_ENABLED=false
JOBHUNTER_BOOTSTRAP_ADMIN_ENABLED=false
PASSWORD_RESET_DEV_TOKEN_ENABLED=false
JWT_COOKIE_SECURE=false
JOBHUNTER_SWAGGER_ENABLED=false
```

Because this setup has no HTTPS domain yet, `JWT_COOKIE_SECURE=false` is acceptable only for local loopback demos.

## Monitoring And Alerts

Prometheus scrapes:

- Spring Actuator Prometheus metrics.
- Frontend and backend uptime through Blackbox Exporter.
- OpenTelemetry Collector metrics export.

Alert rules live in:

```text
ops/observability/prometheus/alerts.yml
```

Critical local alerts:

- `JobhunterBackendHealthDown`
- `JobhunterFrontendDown`
- `JobhunterBackendHigh5xxRate`
- `JobhunterBackendJvmMemoryHigh`

Alertmanager sends alerts to the local webhook. Alerts are written to:

```text
logs/alerts/alerts.log
```

To test the backend health alert, stop the backend container and wait for the Prometheus alert window:

```powershell
docker compose stop backend
Get-Content logs\alerts\alerts.log -Wait
docker compose start backend
```

## Log Aggregation

Promtail forwards:

- Docker container logs.
- Backend rolling file logs from the shared backend log volume.
- Local alert webhook logs from `logs/alerts`.

Grafana provisions Prometheus and Loki automatically. Open `http://localhost:3002`, then use:

- Dashboard: `Jobhunter Local Production Overview`
- Explore with datasource `Loki` for application and alert logs.

## Error Telemetry

Backend:

- Micrometer tracing can export OTLP traces to the local collector.
- Enable with `MANAGEMENT_TRACING_ENABLED=true`.
- Sampling is controlled by `MANAGEMENT_TRACING_SAMPLING_PROBABILITY`.

Frontend:

- `ClientErrorReporter` captures `window.error`, unhandled promise rejections, and React error boundary failures.
- Errors are posted to `POST /api/client-errors`.
- The Next.js server logs structured JSON events with `event=frontend.client_error`.
- Promtail forwards those logs to Loki.

This gives Sentry-like local visibility without requiring an external SaaS account. Sentry can still be added later by replacing the client reporter transport.

## MySQL Backup

Scheduled backups run through the `mysql-backup` Compose sidecar when `npm run prod:local` is active.

Defaults:

- Interval: `MYSQL_BACKUP_INTERVAL_SECONDS=86400`
- Retention: `MYSQL_BACKUP_RETENTION_DAYS=14`
- Output: `backups/mysql/jobhunter-YYYYmmddTHHMMSSZ.sql.gz`

Run a backup immediately:

```powershell
npm run mysql:backup
```

Restore from a backup:

```powershell
npm run mysql:restore -- -BackupFile .\backups\mysql\jobhunter-YYYYmmddTHHMMSSZ.sql.gz
```

Backup files are ignored by Git. Keep a copy outside the project folder before destructive database tests.

## Release Verification

Before tagging or publishing Docker images:

```powershell
cd backend
.\gradlew.bat test

cd ..\frontend
npm run lint
npm test -- --runInBand
npm run build
npm run test:e2e
npm run test:visual
npm audit --omit=dev --audit-level=high

cd ..
npm run smoke:local -- --browser=true
```

Then build and push images through Docker Desktop:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker-build-images.ps1 -DockerhubUsername nguyenson1710 -ImageTag 1.0.5 -AlsoTagLatest
powershell -ExecutionPolicy Bypass -File scripts/docker-push-images.ps1 -DockerhubUsername nguyenson1710 -ImageTags 1.0.5,latest
```

GitHub Packages are published by CI/CD to GitHub Container Registry:

```powershell
docker pull ghcr.io/jasontm17/jobhunter-backend:1.0.5
docker pull ghcr.io/jasontm17/jobhunter-frontend:1.0.5
```
