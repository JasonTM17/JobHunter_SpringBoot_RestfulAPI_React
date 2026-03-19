import Link from "next/link";

const FOOTER_LINKS = {
  việcLàm: [
    { label: "Tìm việc làm IT", href: "/" },
    { label: "Việc làm theo khu vực", href: "/" },
    { label: "Việc làm theo kỹ năng", href: "/" },
    { label: "Việc làm theo mức lương", href: "/" }
  ],
  côngTy: [
    { label: "Danh sách công ty", href: "/" },
    { label: "Nhà tuyển dụng nổi bật", href: "/" },
    { label: "Công ty IT hàng đầu", href: "/" }
  ],
  ứngViên: [
    { label: "Tạo tài khoản", href: "/register" },
    { label: "Đăng nhập", href: "/login" },
    { label: "Hồ sơ ứng viên", href: "/account" },
    { label: "Trợ lý AI", href: "/chatbot" }
  ],
  hỗTrợ: [
    { label: "Câu hỏi thường gặp", href: "/support#faq" },
    { label: "Chính sách bảo mật", href: "/support#privacy" },
    { label: "Điều khoản sử dụng", href: "/support#terms" },
    { label: "Liên hệ hỗ trợ", href: "/support#contact" }
  ]
};

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    )
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      {/* Main footer content */}
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-5 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Jobhunter — Trang chủ">
              <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100">
                <img src="/favicon.svg" alt="" className="h-full w-full object-cover" width={40} height={40} />
              </span>
              <span className="text-base font-extrabold tracking-tight text-slate-900">Jobhunter</span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
              Nền tảng tuyển dụng công nghệ hàng đầu dành cho ứng viên và nhà tuyển dụng tại Việt Nam.
            </p>
            {/* Social icons */}
            <div className="mt-4 flex items-center gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-widest text-slate-900">
                {section === "việcLàm"
                  ? "Việc làm"
                  : section === "côngTy"
                    ? "Công ty"
                    : section === "ứngViên"
                      ? "Ứng viên"
                      : "Hỗ trợ"}
              </h3>
              <ul className="grid gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-slate-500 transition hover:text-rose-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100">
        <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-5 lg:px-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-[12px] text-slate-400">
              © {new Date().getFullYear()} Jobhunter. Tất cả quyền được bảo lưu.
            </p>
            <p className="text-[12px] text-slate-400">
              Nền tảng tuyển dụng công nghệ hàng đầu Việt Nam
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
