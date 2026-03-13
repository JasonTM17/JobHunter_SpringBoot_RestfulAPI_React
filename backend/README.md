# Jobhunter Backend

## Requirements
- Java 21
- MySQL 8+
- Windows: use `gradlew.bat`

## Local setup
1. Copy `backend/.env.example` -> `backend/.env`.
2. Configure DB + JWT + mail values.
3. Run:
```powershell
cd backend
.\gradlew.bat bootRun
```

Default local base URL: `http://localhost:8080`

## Port and local stability
- Backend port is configurable via:
  - `SERVER_PORT` (default `8080`)
- If port `8080` is occupied, either:
  - Stop old process:
```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```
  - Or run backend on another port:
```powershell
$env:SERVER_PORT=8081
.\gradlew.bat bootRun
```

If you change backend port, update frontend:
- `frontend/.env.local`:
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:<your_port>`
  - `NEXT_PUBLIC_STORAGE_BASE_URL=http://localhost:<your_port>`

## Mail config (source of truth)
- `spring.mail.username` <- `MAIL_USERNAME` (fallback `JOBHUNTER_MAIL_USERNAME`, then `GMAIL_USERNAME`)
- `spring.mail.password` <- `MAIL_PASSWORD` (fallback `JOBHUNTER_MAIL_PASSWORD`, then `GMAIL_APP_PASSWORD`)
- `jobhunter.mail.from` <- `MAIL_FROM` (fallback `spring.mail.username`)

Do not hardcode app password in source code.

### Mail endpoints
- `POST /api/v1/email/test`
- `POST /api/v1/email/test-template`
- `POST /api/v1/email/subscribers`
- `POST /api/v1/email/recommendations/weekly/trigger`
- `POST /api/v1/email/logs/cleanup/trigger`

### Quick mail verification (HTML template)
1. Login as admin/super admin and keep auth cookie.
2. Call:
- `POST /api/v1/email/test-template`
- Header: `Content-Type: application/json`
- Body:
```json
{
  "recipient": "your_email@example.com",
  "recipientName": "Nguoi nhan",
  "subject": "Jobhunter - Kiem tra gui email HTML",
  "title": "Thong bao kiem tra he thong email",
  "message": "Neu ban nhan duoc email nay, cau hinh SMTP + Thymeleaf dang hoat dong dung.",
  "actionText": "Mo Jobhunter",
  "actionUrl": "http://localhost:3000"
}
```

Success response returns `recipient`, `sender`, `subject`, `templateName`, `sentAt`.

## Scheduler / Cron
- Global switch:
  - `JOBHUNTER_SCHEDULER_ENABLED`
- Mail cron switch:
  - `JOBHUNTER_MAIL_CRON_ENABLED`
- Cron expression:
  - `JOBHUNTER_MAIL_CRON`
- Timezone:
  - `JOBHUNTER_MAIL_CRON_ZONE`
- Recipient:
  - `JOBHUNTER_MAIL_CRON_RECIPIENT`
- Template:
  - `JOBHUNTER_MAIL_CRON_TEMPLATE` (default `mail/scheduler-heartbeat`)

Manual trigger endpoint:
- `POST /api/v1/email/scheduler/trigger`

### Weekly recommendation scheduler
- Switch:
  - `JOBHUNTER_WEEKLY_RECOMMENDATION_ENABLED`
- Cron:
  - `JOBHUNTER_WEEKLY_RECOMMENDATION_CRON` (default `0 0 8 * * MON`)
- Timezone:
  - `JOBHUNTER_WEEKLY_RECOMMENDATION_ZONE` (default `Asia/Ho_Chi_Minh`)
- Recommendation limits:
  - `JOBHUNTER_WEEKLY_RECOMMENDATION_MAX_JOBS` (default `8`)
  - `JOBHUNTER_WEEKLY_RECOMMENDATION_RECENT_APPLY_DAYS` (default `180`)
  - `JOBHUNTER_WEEKLY_RECOMMENDATION_FALLBACK_ENABLED` (default `true`)

Data source used for recommendations:
- Candidate users (`role=USER`) with opt-in flag enabled
- Applied jobs history from `resumes`
- Subscriber skills by matching candidate email (`subscribers`)
- Open jobs (`active=true`, valid by start/end date)

User opt-in setting:
- Persisted field: `users.weekly_job_recommendation_enabled`
- Authenticated APIs:
  - `GET /api/v1/auth/preferences/email`
  - `PATCH /api/v1/auth/preferences/email`
  - Request body:
```json
{
  "weeklyJobRecommendationEnabled": true
}
```

Recommendation rules:
- Prefer jobs matching skills/title keywords from recent applications
- Mix in subscriber skills when available
- Exclude jobs already applied by user
- Skip inactive/expired jobs
- Fallback to recent open jobs when enabled
- Prevent duplicate send per week with `weekly_recommendation_dispatches`

Manual weekly trigger endpoint:
- `POST /api/v1/email/recommendations/weekly/trigger`
- Requires authenticated account with permission `Trigger weekly recommendation email`
- Requires role `ADMIN` or `SUPER_ADMIN`
- Runtime guard:
  - `JOBHUNTER_WEEKLY_RECOMMENDATION_MANUAL_TRIGGER_ENABLED=true` to always allow, or
  - active profile in `JOBHUNTER_WEEKLY_RECOMMENDATION_MANUAL_TRIGGER_PROFILES` (default: `dev,local,docker,test`)

Recommendation runtime tuning:
- `JOBHUNTER_WEEKLY_RECOMMENDATION_CANDIDATE_PAGE_SIZE` (default `200`)
- `JOBHUNTER_WEEKLY_RECOMMENDATION_MAX_CANDIDATES` (default `2000`)
- Dispatch duplicate check now preloads sent emails by `week_key` to avoid per-user `exists` queries.

### Log cleanup scheduler
- Switch:
  - `JOBHUNTER_LOG_CLEANUP_ENABLED`
- Cron:
  - `JOBHUNTER_LOG_CLEANUP_CRON` (default `0 0 3 * * *`)
- Timezone:
  - `JOBHUNTER_LOG_CLEANUP_ZONE` (default `Asia/Ho_Chi_Minh`)
- Retention:
  - `JOBHUNTER_LOG_RETENTION_DAYS` (default `7`)
- Safe cleanup scope:
  - `JOBHUNTER_LOG_CLEANUP_PATHS` (default `logs`)
  - `JOBHUNTER_LOG_CLEANUP_PATTERNS` (default `*.log,*.log.*`)
  - `JOBHUNTER_LOG_CLEANUP_MAX_SCAN_FILES` (default `10000`)
- Manual cleanup trigger:
  - `POST /api/v1/email/logs/cleanup/trigger`
  - Requires role `ADMIN` or `SUPER_ADMIN`
  - Runtime guard:
    - `JOBHUNTER_LOG_CLEANUP_MANUAL_TRIGGER_ENABLED=true`, or
    - active profile in `JOBHUNTER_LOG_CLEANUP_MANUAL_TRIGGER_PROFILES` (default `dev,local,docker,test`)

## Logging profiles
- `dev` profile (`application-dev.properties`):
  - Root/info-friendly logs for local debugging.
  - More detail for `EmailService`.
- `test` profile (`application-test.properties`):
  - Reduced noise (`root=ERROR`).
  - `gradlew test` forces `spring.profiles.active=test`.
- `prod` profile (`application-prod.properties`):
  - Safe default levels (`root=WARN`, app `INFO`).
  - Rolling file logs enabled via:
    - `JOBHUNTER_LOG_FILE`
    - `JOBHUNTER_LOG_ROLLING_PATTERN`
    - `JOBHUNTER_LOG_MAX_FILE_SIZE`
    - `JOBHUNTER_LOG_MAX_HISTORY`
    - `JOBHUNTER_LOG_TOTAL_SIZE_CAP`
    - `JOBHUNTER_LOG_CLEAN_HISTORY_ON_START`

Recommended prod start:
```powershell
$env:SPRING_PROFILES_ACTIVE="prod"
.\gradlew.bat bootRun
```

## Swagger / OpenAPI
- Enable/disable docs:
  - `JOBHUNTER_SWAGGER_ENABLED=true|false`
- Swagger UI path:
  - `http://localhost:${SERVER_PORT}/swagger-ui.html`
  - `http://localhost:${SERVER_PORT}/swagger-ui/index.html`
- OpenAPI docs path:
  - `http://localhost:${SERVER_PORT}/v3/api-docs`

Swagger UI is public in local/dev.
Protected business APIs still require JWT Bearer token.

## Postman auth flow
1. Login:
   - `POST /api/v1/auth/login`
2. This API issues HttpOnly cookies (`access_token`, `refresh_token`) on login.
3. For protected APIs in Postman:
   - Use the same Postman session/cookie jar after login, or
   - Manually set header `Authorization: Bearer <access_token>` if you explicitly extract token value.

Do not put username/password in unrelated GET request body.

## Build and test
```powershell
.\gradlew.bat test
.\gradlew.bat build -x test
```

Test task already disables runtime seed and scheduler:
- `jobhunter.seed.enabled=false`
- `jobhunter.scheduler.enabled=false`
- `jobhunter.scheduler.mail.enabled=false`

## Docker runtime notes
- Backend container reads env from runtime (`docker compose`), no secret is hardcoded in image.
- Docker profile is available in `application-docker.properties` and should be activated in compose (`SPRING_PROFILES_ACTIVE=dev,docker`).
- Docker datasource fallback uses compose service host `db` (not `localhost`).
- JWT secret for docker/runtime must be base64 of at least 64 bytes when using HS512 (`JWT_BASE64_SECRET`).
- CORS origins should include frontend browser origin (`CORS_ALLOWED_ORIGINS`), default includes `localhost:3000`, `localhost:3001`, `127.0.0.1:3000`, `127.0.0.1:3001`.
- Seed toggle for runtime:
  - `JOBHUNTER_SEED_ENABLED=true` (default in compose)
- Upload/storage path inside container should be:
  - `UPLOAD_BASE_URI=file:///app/storage/`
- Upload size limit:
  - `UPLOAD_MAX_SIZE_BYTES` (default `5242880`, ~5MB)
  - Spring multipart caps: `UPLOAD_MAX_FILE_SIZE`, `UPLOAD_MAX_REQUEST_SIZE`
- Healthcheck endpoint:
  - `GET /actuator/health`
- Swagger URLs in docker:
  - `http://localhost:8080/swagger-ui.html`
  - `http://localhost:8080/v3/api-docs`
