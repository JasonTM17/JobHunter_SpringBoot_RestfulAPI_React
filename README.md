# Jobhunter Monorepo

## Cấu trúc
- `backend/`: Spring Boot API, auth/RBAC, seed dữ liệu tuyển dụng.
- `frontend/`: Next.js + TailwindCSS cho public portal, management portal, chat AI.
- `scripts/clean-workspace.mjs`: script dọn log/tệp tạm/build artifact an toàn.

## Chạy nhanh local
1. Backend
- `cd backend`
- Tạo `backend/.env` từ `backend/.env.example`
- `.\gradlew.bat bootRun`

2. Frontend
- `cd frontend`
- Tạo `frontend/.env.local` từ `frontend/.env.example`
- `npm install`
- `npm run dev`

3. Truy cập
- Public portal: `http://localhost:3000`
- Management portal: `http://localhost:3000/?tab=manage` (chỉ hiện khi đủ quyền)
- Chat AI: `http://localhost:3000/chatbot`

## Seed dữ liệu demo
- Seed chạy khi backend khởi động qua `DatabaseInitializer` + `RecruitmentDemoDataSeeder`.
- Seed mặc định bật ở runtime/dev.
- Seed không chạy trong test (`gradlew test` đã set `jobhunter.seed.enabled=false`).
- Dữ liệu seed gồm: role/permission, users theo vai trò, companies, skills, jobs, resumes, subscribers.

## Tài khoản demo
- Mật khẩu mặc định: `123456`
- `superadmin@jobhunter.local` -> `SUPER_ADMIN`
- `admin.operations@jobhunter.local` -> `ADMIN`
- `recruiter01@jobhunter.local` -> `RECRUITER`
- `candidate01@jobhunter.local` -> `USER`

## Dọn workspace
Chạy ở thư mục gốc repo:
- `npm run clean`: dọn log + file tạm
- `npm run clean:all`: dọn log + file tạm + build artifacts
- `npm run clean:dry` / `npm run clean:dry:all`: chỉ liệt kê trước khi xóa

Script đã chặn xóa các vùng nhạy cảm:
- `backend/storage`
- `.env`, `.env.local`
- mã nguồn trong `src/`

## Tài liệu chi tiết
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
