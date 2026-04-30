# Release Notes

## v1.0.0-production-mvp - 2026-04-30

### Tổng quan

Release này đưa Jobhunter lên trạng thái production MVP: public job board hoàn chỉnh, candidate apply thật hơn, recruiter pipeline có audit, admin workspace vận hành được, bảo mật production được siết lại và có bộ kiểm thử E2E/visual/smoke ổn định.

### Điểm nổi bật

- Refactor UI theo hướng job board chuyên nghiệp: đỏ-trắng cân bằng, search-first, job card dày thông tin, quick detail, content hub và About.
- Job detail có layout 2 cột, apply panel sticky, upload/URL CV, trạng thái apply trùng và link về candidate workspace.
- Candidate workspace có saved jobs theo account, application history, CV library, default CV và audit timeline.
- Recruiter pipeline có filter, status update, note và resume status audit.
- Admin/recruiter management có filter/pagination UI, mobile management E2E và destructive confirm rõ hơn.
- Subscriber có unsubscribe token, reactivation flow và email preference.
- Forgot/reset password dùng token một lần, dev token chỉ dùng khi cấu hình cho phép.
- Next.js đã lên `16.2.4`, production audit hết high vulnerabilities.

### Backend

- Thêm production startup guard cho profile `prod`.
- Thêm unsafe-method header guard: `X-Jobhunter-Client: web`.
- Thêm rate limit in-memory cho login, forgot/reset và AI chat.
- Thêm upload validation cho CV/document: extension, content type, magic header cơ bản và max size.
- Thêm resume status audit và endpoint đọc timeline theo scope quyền.
- Thêm candidate CV library APIs.
- Thêm subscriber unsubscribe token và endpoint unsubscribe.
- Mở rộng test cho security hardening, password reset, resume audit, saved jobs, subscriber và candidate CV.

### Frontend

- API client tự thêm unsafe-method header.
- Rich text sanitizer chuyển sang allowlist.
- Home tách thành các component/hook chính, có About section chuyên nghiệp hơn.
- Job board có sort thật: latest, salary desc, deadline asc.
- Candidate apply load CV library và lưu CV upload vào backend.
- Candidate workspace hiển thị CV library và audit trạng thái hồ sơ.
- E2E bao phủ desktop/mobile cho public, candidate, recruiter và admin.

### Tài liệu

- README root được viết lại sạch hơn.
- Thêm `docs/ABOUT.md`.
- Thêm `docs/RELEASE_NOTES.md`.
- Thêm `docs/PRODUCTION_RUNBOOK.md`.
- Thêm `docs/E2E_QA.md`.
- Frontend README được cập nhật theo module, API convention và quality gates.

### Migration

Các migration mới:

- `V3__resume_audits_and_password_reset.sql`
- `V4__subscriber_unsubscribe_and_candidate_cvs.sql`

Nếu đã có database production thật, không sửa migration cũ đã chạy. Tạo migration mới hoặc repair có kiểm soát theo runbook.

### Env mới hoặc đáng chú ý

- `JOBHUNTER_PROD_GUARD_ENABLED`
- `JOBHUNTER_UNSAFE_METHOD_HEADER_ENABLED`
- `JOBHUNTER_RATE_LIMIT_ENABLED`
- `JOBHUNTER_RATE_LIMIT_*`
- `JOBHUNTER_PUBLIC_API_URL`
- `PASSWORD_RESET_TTL_MINUTES`
- `PASSWORD_RESET_DEV_TOKEN_ENABLED`

### Verification

Đã pass ngày 2026-04-30:

- Backend `.\gradlew.bat test`
- Frontend `npm run lint`
- Frontend `npm test -- --runInBand`
- Frontend `npm run build`
- Frontend `npm run test:e2e`: 16/16
- Frontend `npm run test:visual`: 4/4
- Frontend `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities
- Root `npm run smoke:local -- --browser=true`: 11/11
- Browser Use QA localhost: home, About, job cards, job detail, console error 0

### Known limitations

- Rate limit in-memory phù hợp MVP single-node. Khi scale nhiều instance nên chuyển sang Redis.
- Email gửi thật cần SMTP hợp lệ.
- Management API server-side pagination sâu hơn nên tiếp tục mở rộng nếu dữ liệu lớn.
- Audit destructive action cho job/company/skill/user có thể làm thêm ở release sau.

## Release checklist

1. Cập nhật release notes.
2. Chạy đủ quality gates.
3. Chạy smoke local có browser DOM check.
4. Kiểm tra env production và guard.
5. Build Docker image.
6. Deploy.
7. Kiểm tra health, public home, job detail, login, candidate apply, recruiter pipeline, admin users.
8. Ghi nhận rollback point.
