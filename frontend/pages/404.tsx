import Head from "next/head";
import SystemPageShell from "../components/common/SystemPageShell";

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Trang không tồn tại — Jobhunter</title>
        <meta name="description" content="Trang bạn đang tìm không còn tồn tại trên Jobhunter. Quay về trang chủ để tiếp tục tìm việc IT." />
      </Head>
      <SystemPageShell
      label="Trang không tồn tại"
      code="404"
      title="Bạn vừa đi lạc khỏi Jobhunter"
      description="Trang bạn đang tìm không còn tồn tại, đã được chuyển hướng, hoặc URL không còn hợp lệ. Điểm tốt là bạn vẫn có thể quay về đúng luồng tìm việc chỉ với một bước."
      primaryAction={{ href: "/", label: "Về trang chủ", variant: "primary" }}
      secondaryAction={{ href: "/", label: "Khám phá việc làm", variant: "secondary" }}
      tertiaryAction={{ href: "/login", label: "Đăng nhập", variant: "accent" }}
      panelTitle="Gợi ý để tiếp tục nhanh"
      panelDescription="Nếu bạn đang quay lại từ email, bookmark cũ, hoặc liên kết ngoài, các lối đi dưới đây sẽ giúp bạn quay đúng ngữ cảnh."
      panelItems={[
        "Tìm việc theo kỹ năng, mức lương và địa điểm ngay từ trang chủ.",
        "Xem tin tuyển dụng thật từ doanh nghiệp đang mở vị trí phù hợp với hồ sơ của bạn.",
        "Dùng trợ lý AI để chuẩn bị CV, thư ứng tuyển và các câu trả lời phỏng vấn."
      ]}
      tone="slate"
    />
    </>
  );
}
