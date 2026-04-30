# Production Runbook

## Mục tiêu

Runbook này dùng để chuẩn bị, deploy và kiểm tra Jobhunter ở mức production MVP. Mặc định hệ thống chạy single-node Docker trước; nếu scale nhiều instance cần bổ sung Redis/session/rate-limit shared store.

## Pre-flight checklist

- Java 21, Node 22 và Docker đang sẵn sàng.
- `.env` được tạo từ `.env.example`, không commit secret thật.
- `JWT_BASE64_SECRET` là secret mạnh, base64 đủ dài cho HS512.
- `DB_PASSWORD` và `JOBHUNTER_BOOTSTRAP_ADMIN_PASSWORD` đã đổi khỏi mặc định.
- `JOBHUNTER_SEED_ENABLED=false` sau khi seed/demo data không còn cần thiết.
- `JOBHUNTER_BOOTSTRAP_ADMIN_ENABLED=false` sau khi đã tạo admin thật.
- `PASSWORD_RESET_DEV_TOKEN_ENABLED=false` trong production.
- `JOBHUNTER_PROD_GUARD_ENABLED=true`.
- `JOBHUNTER_UNSAFE_METHOD_HEADER_ENABLED=true`.
- `JOBHUNTER_RATE_LIMIT_ENABLED=true`.
- `CORS_ALLOWED_ORIGINS` chỉ chứa frontend origin hợp lệ.
- Swagger chỉ bật khi có chủ đích.

## Build và test trước deploy

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

## Docker deploy local/server

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose logs -f backend
docker compose logs -f frontend
```

Kiểm tra:

- `GET http://localhost:8080/actuator/health`
- `GET http://localhost:3001`
- `GET http://localhost:3001/jobs/1`

## Production guard

Khi `SPRING_PROFILES_ACTIVE=prod`, backend sẽ fail-fast nếu còn cấu hình nguy hiểm. Nếu backend không start, đọc message trong log và sửa env thay vì tắt guard.

Các nhóm thường bị guard chặn:

- JWT default hoặc quá yếu.
- Cookie secure tắt.
- Password reset dev token bật.
- Seed/bootstrap admin bật.
- Swagger bật ngoài chủ đích.

## Unsafe method header

Các request unsafe dưới `/api/**` cần:

```http
X-Jobhunter-Client: web
```

Frontend đã tự thêm. Nếu dùng Postman hoặc client khác, thêm header này khi gọi `POST/PUT/PATCH/DELETE`.

## Database và migration

- Flyway chạy khi backend start.
- Backup database trước khi chạy migration production.
- Không sửa migration đã phát hành nếu DB production đã chạy.
- Nếu cần sửa dữ liệu, tạo migration mới có rollback plan.

## Monitoring tối thiểu

Kiểm tra định kỳ:

- `/actuator/health`
- Backend logs
- Frontend server logs
- Tỷ lệ 401/403/429/500
- Lỗi upload CV
- Lỗi gửi email/reset password
- Dung lượng storage upload

## Rollback

1. Ghi nhận image tag hoặc commit đang chạy trước deploy.
2. Nếu deploy lỗi, quay lại image tag trước đó.
3. Nếu migration đã chạy và không backward-compatible, dùng backup/rollback script đã chuẩn bị.
4. Chạy lại smoke sau rollback.

## Smoke sau deploy

Luồng cần kiểm tra thủ công hoặc bằng Browser Use:

- Home render job cards, sort và About.
- Job detail load đúng.
- Candidate login và apply CV.
- Candidate workspace thấy history và CV library.
- Recruiter đổi trạng thái resume kèm note.
- Admin mở users management.
- Mobile 390px không horizontal overflow.

## Khi scale sau MVP

- Chuyển rate limit sang Redis.
- Tách storage upload sang object storage.
- Thêm observability tập trung: logs, traces, metrics.
- Thêm migration dry-run trong CI/CD.
- Thêm audit destructive action cho toàn bộ admin operations.
