import Head from "next/head";
import Link from "next/link";

const SECTIONS = [
  {
    id: "faq",
    title: "Câu hỏi thường gặp",
    content: [
      { q: "Làm sao để tìm việc phù hợp?", a: "Dùng bộ lọc trên trang chủ theo kỹ năng, khu vực, mức lương và cấp độ. Bạn cũng có thể nhập từ khóa để tìm nhanh." },
      { q: "Tôi có cần tài khoản để ứng tuyển?", a: "Có. Bạn cần đăng ký tài khoản ứng viên để nộp hồ sơ và theo dõi trạng thái ứng tuyển." },
      { q: "Trợ lý AI hỗ trợ những gì?", a: "Trợ lý AI giúp gợi ý việc làm, chuẩn bị CV, thư xin việc và câu trả lời phỏng vấn theo tin tuyển dụng." }
    ]
  },
  {
    id: "privacy",
    title: "Chính sách bảo mật",
    content: [
      "Jobhunter thu thập thông tin bạn cung cấp khi đăng ký và sử dụng dịch vụ (email, họ tên, hồ sơ ứng tuyển) để cung cấp nền tảng tuyển dụng và cải thiện trải nghiệm.",
      "Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba. Dữ liệu có thể được chia sẻ với nhà tuyển dụng khi bạn ứng tuyển vào vị trí của họ.",
      "Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân qua trang Cài đặt tài khoản hoặc liên hệ hỗ trợ."
    ]
  },
  {
    id: "terms",
    title: "Điều khoản sử dụng",
    content: [
      "Bạn cam kết cung cấp thông tin chính xác khi đăng ký và không sử dụng dịch vụ cho mục đích vi phạm pháp luật hoặc lừa đảo.",
      "Nội dung đăng tải (tin tuyển dụng, hồ sơ) phải phù hợp với quy định pháp luật và chuẩn mực đạo đức. Jobhunter có quyền gỡ bỏ nội dung vi phạm.",
      "Chúng tôi có quyền cập nhật điều khoản. Việc tiếp tục sử dụng dịch vụ sau khi cập nhật được hiểu là bạn chấp nhận điều khoản mới."
    ]
  },
  {
    id: "contact",
    title: "Liên hệ hỗ trợ",
    content: [
      "Email: support@jobhunter.vn (giả định — thay bằng email thật khi triển khai)",
      "Giờ hỗ trợ: Thứ 2 – Thứ 6, 8:00 – 17:00 (GMT+7)",
      "Bạn cũng có thể đăng nhập và sử dụng Trợ lý AI trên trang chủ để được hướng dẫn nhanh."
    ]
  }
] as const;

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Hỗ trợ — Jobhunter</title>
      </Head>
      <main className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
        <div className="mb-8">
          <Link href="/" className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline">
            ← Về trang chủ
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Hỗ trợ</h1>
          <p className="mt-2 text-slate-600">
            Câu hỏi thường gặp, chính sách bảo mật, điều khoản sử dụng và thông tin liên hệ.
          </p>
        </div>

        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.content.map((item, i) =>
                  typeof item === "string" ? (
                    <p key={i} className="text-sm leading-relaxed text-slate-600">
                      {item}
                    </p>
                  ) : (
                    <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      <p className="font-semibold text-slate-800">{item.q}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.a}</p>
                    </div>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
