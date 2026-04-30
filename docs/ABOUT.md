# About Jobhunter

## Tầm nhìn

Jobhunter là production MVP cho một nền tảng tuyển dụng IT tại Việt Nam. Sản phẩm tập trung vào ba việc: giúp ứng viên tìm và so sánh việc làm nhanh hơn, giúp recruiter xử lý hồ sơ có kỷ luật hơn, và giúp admin vận hành dữ liệu tuyển dụng an toàn hơn.

## Người dùng chính

- Ứng viên IT: tìm việc theo kỹ năng, thành phố, cấp độ, mức lương; lưu việc; ứng tuyển bằng CV URL hoặc file upload; theo dõi trạng thái hồ sơ.
- Recruiter: quản lý job theo công ty, xem pipeline hồ sơ, lọc theo job/status, đổi trạng thái kèm ghi chú audit.
- Admin: quản lý users, companies, jobs, skills, roles, permissions và xử lý lỗi vận hành như 403/404/409 rõ ràng hơn.

## Giá trị sản phẩm

- Search-first: người dùng vào trang là có thể tìm việc ngay, không đi qua landing page marketing dài.
- Dữ liệu rõ: job card hiển thị lương, kỹ năng, công ty, cấp độ, địa điểm, deadline và CTA rõ.
- Quy trình ứng tuyển thật: candidate có saved jobs theo tài khoản, CV library, apply history và trạng thái hồ sơ.
- Vận hành có scope: recruiter chỉ thao tác trong phạm vi company, admin có quyền rộng hơn, candidate chỉ xem dữ liệu của mình.
- Chất lượng có kiểm chứng: unit test, Jest, E2E desktop/mobile, visual regression, smoke local và browser QA.

## Phạm vi MVP

Đã có:

- Public home/job board/job detail.
- Auth, forgot/reset password.
- Candidate saved jobs, apply CV, CV library, application history.
- Recruiter resume pipeline và status audit note.
- Admin workspace cho dữ liệu vận hành chính.
- Subscriber/newsletter, email preference và unsubscribe token.
- Security hardening MVP: production guard, unsafe method header, rate limit, upload validation, sanitizer allowlist.

Chưa coi là hoàn chỉnh enterprise:

- Rate limit hiện là in-memory single-node, chưa dùng Redis.
- Email recommendation phụ thuộc SMTP runtime.
- Management server-side pagination sâu hơn vẫn là hướng nâng cấp tiếp theo nếu dataset lớn.
- Audit destructive action có thể mở rộng thêm cho job/company/skill/user ở pha sau.

## Nguyên tắc thiết kế

- Giao diện ưu tiên scan nhanh, mật độ thông tin cao, ít trang trí thừa.
- Brand Jobhunter giữ màu đỏ-trắng nhưng cân bằng bằng slate/white/emerald, không để toàn trang bị đỏ quá nặng.
- Workflow chính phải dùng được ở mobile 390px, tablet 768px và desktop 1366px.
- Không sao chép logo, asset hoặc copy độc quyền từ website tham chiếu.

## Định vị release hiện tại

Release hiện tại phù hợp để demo production MVP, chạy local/Docker, trình bày đồ án/thực tập, và làm nền tảng phát triển tiếp thành sản phẩm tuyển dụng IT hoàn chỉnh hơn.
