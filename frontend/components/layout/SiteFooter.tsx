import Link from "next/link";

const FOOTER_LINKS = {
  "Việc làm": [
    { label: "Tìm việc IT", href: "/#jobs" },
    { label: "Việc làm theo kỹ năng", href: "/#jobs-by-skill" },
    { label: "Việc làm theo thành phố", href: "/#jobs-by-city" },
    { label: "Việc làm theo công ty", href: "/#jobs-by-company" }
  ],
  "Công ty": [
    { label: "Top Employers", href: "/#top-employers" },
    { label: "Danh sách công ty", href: "/#companies" },
    { label: "Không gian tuyển dụng", href: "/recruiter" }
  ],
  "Career hub": [
    { label: "Bài viết nổi bật", href: "/#career-resources" },
    { label: "IT Expertise Summary", href: "/#it-expertise" },
    { label: "Trợ lý AI", href: "/chatbot" }
  ],
  "Hỗ trợ": [
    { label: "Trung tâm hỗ trợ", href: "/support" },
    { label: "Câu hỏi thường gặp", href: "/support#faq" },
    { label: "Chính sách bảo mật", href: "/support#privacy" }
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

function FooterLinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <details className="group/section sm:contents">
      <summary className="flex cursor-pointer items-center justify-between py-2 text-[12px] font-semibold uppercase tracking-wide text-slate-900 sm:hidden">
        {title}
        <svg
          className="h-4 w-4 shrink-0 transition-transform group-open/section:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <ul className="grid gap-2 pb-2 sm:hidden">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-[13px] text-slate-500 transition hover:text-[#b51d1a]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <h3 className="mb-3 hidden text-[12px] font-semibold uppercase tracking-wide text-slate-900 sm:block">{title}</h3>
      <ul className="hidden flex-col gap-2 sm:flex">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-[13px] text-slate-500 transition hover:text-[#b51d1a]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-5 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Jobhunter trang chủ">
              <img src="/logo-full.svg" alt="Jobhunter" className="h-11 w-auto" width={236} height={56} />
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
              Nền tảng tuyển dụng IT tập trung vào dữ liệu rõ ràng, ứng tuyển nhanh và workspace vận hành cho candidate, recruiter, admin.
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-[#b51d1a]"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <FooterLinkColumn key={title} title={title} links={links} />
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-4 py-4 text-center sm:flex-row sm:px-5 sm:text-left lg:px-6">
          <p className="text-[12px] text-slate-400">
            © {new Date().getFullYear()} Jobhunter. Tất cả quyền được bảo lưu.
          </p>
          <p className="text-[12px] text-slate-400">
            Search-first IT job board for Vietnam technology teams.
          </p>
        </div>
      </div>
    </footer>
  );
}
