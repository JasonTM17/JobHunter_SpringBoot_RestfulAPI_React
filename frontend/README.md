# Jobhunter Frontend

## Stack
- Next.js 16
- React 19
- TypeScript
- TailwindCSS

## Env
Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_STORAGE_BASE_URL=http://localhost:8080
INTERNAL_API_BASE_URL=http://backend:8080
INTERNAL_STORAGE_BASE_URL=http://backend:8080
```

## Run local
```bash
cd frontend
npm install
npm run dev
```

Open:
- `http://localhost:3000`
- `http://localhost:3000/chatbot`

## Build
- `npm run lint`
- `npm run build`
- `npm run start`

## Main modules
- Public portal (`/`): jobs list, filters, quick detail, company highlights.
- Management portal (`/?tab=manage`): jobs/companies/skills/resumes/users/roles/permissions by capability.
- Auth pages: `/login`, `/register`, `/account`.

## UX notes
- Register flow now prioritizes account fields first:
  - Họ tên
  - Email
  - Mật khẩu
  - Xác nhận mật khẩu
- Extra personal fields (tuổi, giới tính, địa chỉ) are grouped in optional section.
- Company logo upload in management uses real backend upload endpoint and updates UI immediately.
- Account page (`/account`) includes toggle:
  - "Nhận email gợi ý việc làm phù hợp mỗi tuần"
  - Calls backend APIs:
    - `GET /api/v1/auth/preferences/email`
    - `PATCH /api/v1/auth/preferences/email`

## Docker
- Browser-facing API URL: `NEXT_PUBLIC_API_BASE_URL`
- Next.js server/runtime API URL: `INTERNAL_API_BASE_URL`
- Storage URL pair:
  - `NEXT_PUBLIC_STORAGE_BASE_URL`
  - `INTERNAL_STORAGE_BASE_URL`
