# Jobhunter Frontend

## Công nghệ
- Next.js 16
- React 19
- TypeScript
- TailwindCSS

## Cấu hình
Tạo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_STORAGE_BASE_URL=http://localhost:8080
```

## Chạy local
- `cd frontend`
- `npm install`
- `npm run dev`

Truy cập:
- `http://localhost:3000`
- `http://localhost:3000/chatbot`

## Build và kiểm tra
- Type check/lint: `npm run lint`
- Build production: `npm run build`
- Chạy bản build: `npm run start`
- Dọn cache frontend: `npm run clean`

## Module chính
- Public portal (`/`)
  - danh sách việc làm
  - tìm kiếm/lọc
  - quick detail + detail page (`/jobs/[id]`)
  - chat widget hỗ trợ tư vấn
- Management portal (`/?tab=manage`)
  - quản lý users/roles/permissions theo capability
  - quản lý jobs/companies/skills
  - quản lý resumes theo quyền
- Auth pages
  - đăng nhập (`/login`)
  - đăng ký (`/register`)
  - tài khoản (`/account`)

## Auth và RBAC
- Frontend không lưu access token trong `localStorage`.
- Backend cấp cookie `HttpOnly` cho phiên đăng nhập.
- Frontend gọi API với `credentials: include`.
- Khi gặp `401`, client tự thử refresh token một lần qua `/api/v1/auth/refresh`.
- Nút/tab/action trong management sẽ tự ẩn hoặc disable theo permission thực tế.

## Chat AI
- Gọi API backend: `POST /api/v1/ai/chat`.
- Khi backend chưa có `OPENAI_API_KEY`, UI hiển thị thông báo thân thiện.
- Không hiển thị raw error kỹ thuật cho người dùng cuối.

## Demo account
Mật khẩu mặc định: `123456`
- `superadmin@jobhunter.local` (`SUPER_ADMIN`)
- `admin.operations@jobhunter.local` (`ADMIN`)
- `recruiter01@jobhunter.local` (`RECRUITER`)
- `candidate01@jobhunter.local` (`USER`)
