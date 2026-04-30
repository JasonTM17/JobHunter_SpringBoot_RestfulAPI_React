# Jobhunter Frontend

Frontend Jobhunter dùng Next.js pages router, React 19, TypeScript và TailwindCSS. Giao diện chính được tối ưu theo mô hình job board dày thông tin: search-first, danh sách việc làm rõ lương/kỹ năng/hạn tuyển, quick detail, job detail 2 cột và workspace riêng cho candidate, recruiter, admin.

## Stack

- Next.js 16.2.4
- React 19.1.0
- TypeScript 5.8
- TailwindCSS 3.4
- Jest + Testing Library
- Playwright E2E và visual regression

## Env

Tạo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_STORAGE_BASE_URL=http://localhost:8080
INTERNAL_API_BASE_URL=http://backend:8080
INTERNAL_STORAGE_BASE_URL=http://backend:8080
```

## Run local

```powershell
cd frontend
npm install
npm run dev
```

URL mặc định:

- `http://localhost:3010`
- `http://localhost:3010/jobs/1`
- `http://localhost:3010/candidate`
- `http://localhost:3010/recruiter`
- `http://localhost:3010/admin`

Script phụ:

- `npm run dev:webpack`: dùng khi cần so sánh lỗi dev runtime với webpack.
- `npm run dev:3000`: chạy trên port 3000 nếu máy không có dự án khác chiếm port.

## Module chính

- Public portal `/`: hero search, city select, trending skills, job board, top employers, content hub, subscriber, About.
- Job detail `/jobs/[id]`: JD chính, apply panel sticky, URL/upload CV, CV library, duplicate apply state.
- Candidate workspace `/candidate`: saved jobs theo tài khoản, application history, CV library, status audit timeline.
- Recruiter/admin workspace `/?tab=manage`, `/recruiter`, `/admin`: jobs, companies, skills, users, resumes theo capability, filter, pagination, status note và destructive confirm.
- Auth/system pages: `/login`, `/register`, `/forgot-password`, `/account`, `/support`, `/403`, `/404`, `/500`.

## API conventions

- Frontend gọi backend qua `services/api-client.ts`.
- Unsafe methods tự thêm `X-Jobhunter-Client: web`.
- Guest saved jobs vẫn fallback localStorage.
- Authenticated saved jobs và candidate CV library đồng bộ backend theo account.
- Rich text từ backend được sanitize bằng allowlist trước khi render.

## Quality gates

```powershell
npm run lint
npm test -- --runInBand
npm run build
npm run test:e2e
npm run test:visual
npm audit --omit=dev --audit-level=high
```

Smoke từ root repo sau khi backend/frontend đang chạy:

```powershell
npm run smoke:local -- --browser=true
```

## Visual và E2E

- E2E config: `playwright.e2e.config.ts`
- E2E specs: `e2e-tests/*.e2e.spec.ts`
- E2E mock API: `e2e-tests/fixtures/jobhunter-e2e.ts`
- Visual config: `playwright.config.ts`
- Visual specs: `visual-tests/*.visual.spec.ts`

Coverage hiện có:

- Guest browse, sort, filter, open job detail.
- Mobile job board overflow check.
- Register, forgot/reset password.
- Candidate login, apply CV URL, application history.
- Candidate CV library: set default, delete, default promotion.
- Recruiter pipeline: filter, status update, audit note.
- Admin users management desktop/mobile.

## UI notes

- Radius tối đa của card/button chính giữ ở `rounded-lg` hoặc thấp hơn.
- Không đặt card lồng card cho page section.
- Text trong button/card cần tránh overflow ở 390px, 768px, 1366px.
- Giao diện Jobhunter giữ brand riêng, chỉ tham chiếu nhịp UI job board đỏ-trắng, không sao chép asset/copy độc quyền từ website khác.
