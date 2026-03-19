import Head from "next/head";
import SystemPageShell from "../components/common/SystemPageShell";

export default function ServerErrorPage() {
  return (
    <>
      <Head>
        <title>Lỗi hệ thống — Jobhunter</title>
        <meta name="description" content="Máy chủ Jobhunter tạm thời gặp sự cố. Vui lòng thử lại sau hoặc quay về trang chủ." />
      </Head>
      <SystemPageShell
        label="Lỗi hệ thống"
        code="500"
        title="Đã xảy ra lỗi không mong muốn"
        description="Máy chủ tạm thời gặp sự cố. Bạn vui lòng thử lại sau vài phút hoặc quay về trang chủ để tiếp tục tìm việc."
        primaryAction={{ href: "/", label: "Về trang chủ", variant: "primary" }}
        secondaryAction={{ href: "/", label: "Khám phá việc làm", variant: "secondary" }}
        tertiaryAction={{ href: "/login", label: "Đăng nhập", variant: "accent" }}
        panelTitle="Bạn có thể thử"
        panelDescription="Trong lúc chúng tôi xử lý sự cố, hãy thử các bước sau."
        panelItems={[
          "Làm mới trang (F5) và thử lại thao tác vừa thực hiện.",
          "Quay lại trang chủ và tiếp tục tìm kiếm việc làm.",
          "Nếu lỗi lặp lại, vui lòng liên hệ bộ phận hỗ trợ của Jobhunter."
        ]}
        tone="amber"
      />
    </>
  );
}
