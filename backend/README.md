# Jobhunter Backend

## Yêu cầu
- Java 21
- MySQL 8+
- Windows: dùng `gradlew.bat` (Linux/macOS: `./gradlew`)

## Cấu hình môi trường
1. Tạo file `backend/.env` từ `backend/.env.example`.
2. Cập nhật tối thiểu:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_BASE64_SECRET`

Tùy chọn:
- `OPENAI_API_KEY` để bật Chat AI.
- `UPLOAD_BASE_URI` để đổi thư mục lưu file.

## Chạy backend
- `cd backend`
- `.\gradlew.bat bootRun`

API mặc định chạy tại `http://localhost:8080` với prefix `apiPrefix=/api/v1`.

## Seed dữ liệu
- Cơ chế seed: `DatabaseInitializer` gọi `RecruitmentDemoDataSeeder`.
- Mặc định seed bật khi chạy runtime/dev.
- Tắt seed bằng property:
  - `jobhunter.seed.enabled=false`

Ví dụ chạy backend không seed:
- `.\gradlew.bat bootRun -Djobhunter.seed.enabled=false`

## Test và build
- Chạy test: `.\gradlew.bat test`
- Build không test: `.\gradlew.bat build -x test`

`test` đã cấu hình sẵn `jobhunter.seed.enabled=false` để không nhiễm dữ liệu runtime.

## Logging
- Root log level: `WARN`
- App log level: `INFO` (`com.vn.son.jobhunter`)
- Có thể dọn artifact/log từ thư mục repo gốc bằng:
  - `npm run clean`
  - `npm run clean:all`
