# Jobhunter - Production MVP tuyển dụng IT

Jobhunter là nền tảng tuyển dụng công nghệ fullstack dành cho ứng viên, recruiter và admin. Dự án dùng Spring Boot, Next.js, MySQL, Flyway, Docker và bộ kiểm thử tự động để mô phỏng một sản phẩm tuyển dụng IT có thể vận hành thật ở quy mô MVP.

## Tài liệu chính

- [About sản phẩm](docs/ABOUT.md)
- [Release notes](docs/RELEASE_NOTES.md)
- [Production runbook](docs/PRODUCTION_RUNBOOK.md)
- [E2E và QA guide](docs/E2E_QA.md)
- [Frontend guide](frontend/README.md)
- [Backend guide](backend/README.md)

## Trạng thái hiện tại

- Public job board theo phong cách search-first: lọc, sort, quick detail, job detail, top employers, content hub, subscriber và About.
- Candidate workspace: saved jobs theo tài khoản, apply bằng URL hoặc upload CV, thư viện CV, lịch sử ứng tuyển và audit trạng thái hồ sơ.
- Recruiter workspace: pipeline hồ sơ theo công ty, filter theo trạng thái/job, đổi trạng thái kèm ghi chú audit.
- Admin workspace: quản lý users, companies, jobs, skills, roles/permissions theo capability hiện có.
- Auth: login/register, forgot/reset password, HttpOnly cookie, RBAC và preference nhận email.
- Hardening MVP: production startup guard, unsafe-method client header, rate limit in-memory, sanitizer allowlist, upload validation, smoke/E2E/visual regression.

## Kiến trúc

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

Docker Compose cung cấp stack local gồm frontend, backend, MySQL và Redis tùy chọn. Backend expose Actuator health/metrics và Swagger UI khi được bật.

## Chạy local nhanh

Yêu cầu:

- Java 21
- Node.js 22
- Docker Desktop nếu chạy bằng Compose

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

URL mặc định:

- Frontend dev: `http://localhost:3010`
- Frontend Docker: `http://localhost:3001`
- Backend: `http://localhost:8080`
- API prefix: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/swagger-ui.html`

Nếu đổi port backend, cập nhật `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_STORAGE_BASE_URL` và `CORS_ALLOWED_ORIGINS`.

## Chạy bằng Docker Compose

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Các biến quan trọng:

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

## Quality gates

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

Smoke local sau khi backend và frontend đang chạy:

```powershell
npm run smoke:local -- --browser=true
```

Gate gần nhất đã pass ngày 2026-04-30:

- Backend `.\gradlew.bat test`
- Frontend lint, Jest, build
- Playwright E2E 16/16
- Playwright visual 4/4
- Smoke local 11/11
- Production audit 0 high vulnerabilities
- Browser QA localhost không có console error

## Bảo mật production

Khi chạy profile `prod`, backend có startup guard để fail-fast nếu còn cấu hình nguy hiểm như JWT mặc định, cookie secure tắt, reset password dev token bật, seed/bootstrap admin/swagger bật không chủ đích.

Unsafe `POST/PUT/PATCH/DELETE` dưới `/api/**` yêu cầu header:

```http
X-Jobhunter-Client: web
```

Frontend API client tự thêm header này. Có thể tắt bằng env khi cần tích hợp API external, nhưng production MVP nên giữ bật.

## Database migrations

Flyway scripts nằm tại:

```text
backend/src/main/resources/db/migration/
```

Quy tắc:

- Tạo migration mới cho thay đổi schema.
- Không sửa migration đã phát hành nếu production đã chạy.
- Dùng `SON_JPA_DDL_AUTO=none` trong production.

## Quy trình release

1. Cập nhật [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md).
2. Chạy đủ quality gates.
3. Chạy smoke local với browser DOM check.
4. Kiểm tra env production theo [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md).
5. Tag Docker image hoặc Git tag theo convention của dự án.
6. Sau deploy, kiểm tra `/actuator/health`, public home, job detail, login, candidate apply, recruiter pipeline và admin workspace.

## License

MIT License.
