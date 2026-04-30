# E2E và QA Guide

## Mục tiêu

Bộ E2E/QA của Jobhunter kiểm tra các hành trình người dùng quan trọng nhất trước mỗi release: guest tìm việc, candidate ứng tuyển, recruiter xử lý pipeline, admin vận hành dữ liệu và responsive mobile.

## Lệnh chạy

Frontend unit/integration:

```powershell
cd frontend
npm run lint
npm test -- --runInBand
npm run build
```

Playwright E2E:

```powershell
cd frontend
npm run test:e2e
```

Playwright visual regression:

```powershell
cd frontend
npm run test:visual
```

Smoke local từ root repo:

```powershell
npm run smoke:local -- --browser=true
```

## E2E coverage hiện tại

Public job discovery:

- Guest mở home.
- Sort/filter job board.
- Mở job detail.
- Kiểm tra mobile không horizontal overflow.

Auth và candidate:

- Visitor register và được chuyển về login.
- Visitor request và submit password reset ở dev mode.
- Candidate login.
- Candidate apply bằng CV URL.
- Candidate thấy application history.
- Candidate thấy CV library.
- Candidate đặt CV mặc định.
- Candidate xóa CV và UI promote CV mặc định còn lại.

Recruiter/admin:

- Recruiter mở resume pipeline.
- Recruiter filter hồ sơ.
- Recruiter đổi status kèm audit note.
- Admin mở users management.
- Desktop và mobile đều được chạy, không còn skip mobile management.

Visual:

- Job board default desktop/mobile.
- Job board salary sort desktop/mobile.

Smoke browser:

- Frontend home HTTP.
- Jobs API.
- Jobs salary sort API.
- Companies API.
- Skills API.
- Job detail API.
- Frontend job detail route.
- DOM job board có cards, sort và About.
- DOM job detail có heading.
- Mobile DOM không overflow ngang.
- Auth/support routes load được.

## Dữ liệu mock

E2E dùng mock API tại:

```text
frontend/e2e-tests/fixtures/jobhunter-e2e.ts
```

Visual dùng fixture riêng để snapshot ổn định, không phụ thuộc DB local.

## Browser QA thủ công

Sau khi app đang chạy ở `http://localhost:3010`, kiểm tra nhanh:

1. Home có job cards, sort control và About.
2. Sort lương cao cập nhật URL `?sort=salary_desc`.
3. Job detail `/jobs/1` load heading và apply panel.
4. `/candidate` hiển thị CV library khi login candidate.
5. `/?tab=manage&module=resumes` hiển thị pipeline khi login recruiter/admin.
6. Console không có error.

## Khi E2E fail

- Nếu fail do selector, kiểm tra lại accessible name hoặc `data-testid`.
- Nếu fail do route/API mock, cập nhật fixture thay vì chạm backend thật.
- Nếu fail mobile overflow, kiểm tra width cố định, grid min-width và text wrap.
- Nếu visual fail có chủ đích, chạy `npm run test:visual:update` sau khi review screenshot.
- Nếu smoke fail frontend port, truyền rõ `--frontend-url`.

## Gate release tối thiểu

Trước khi phát hành, yêu cầu pass:

- `.\gradlew.bat test`
- `npm run lint`
- `npm test -- --runInBand`
- `npm run build`
- `npm run test:e2e`
- `npm run test:visual`
- `npm audit --omit=dev --audit-level=high`
- `npm run smoke:local -- --browser=true`
