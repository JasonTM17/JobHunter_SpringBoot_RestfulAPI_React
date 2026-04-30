import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/auth-context";
import { resolveWorkspaceKind, workspacePath } from "../../utils/workspace";

type WorkspaceKind = "admin" | "recruiter" | "candidate";
type MegaKey = "jobs" | "companies" | "content";

interface NavItem {
  href: string;
  label: string;
  active: boolean;
}

interface MegaColumn {
  title: string;
  links: { label: string; href: string; badge?: string }[];
}

const JOB_MEGA: MegaColumn[] = [
  {
    title: "Theo kỹ năng",
    links: [
      { label: "Java", href: "/?skill=Java" },
      { label: "ReactJS", href: "/?skill=ReactJS" },
      { label: "NodeJS", href: "/?skill=NodeJS" },
      { label: "DevOps", href: "/?skill=DevOps" }
    ]
  },
  {
    title: "Theo thành phố",
    links: [
      { label: "Hồ Chí Minh", href: "/?location=HOCHIMINH" },
      { label: "Hà Nội", href: "/?location=HANOI" },
      { label: "Đà Nẵng", href: "/?location=DANANG" },
      { label: "Remote", href: "/?location=REMOTE" }
    ]
  },
  {
    title: "Theo cấp độ",
    links: [
      { label: "Fresher", href: "/?level=FRESHER" },
      { label: "Junior", href: "/?level=JUNIOR" },
      { label: "Middle", href: "/?level=MIDDLE" },
      { label: "Senior", href: "/?level=SENIOR" }
    ]
  }
];

const COMPANY_MEGA: MegaColumn[] = [
  {
    title: "Khám phá công ty",
    links: [
      { label: "Top employers", href: "/#top-employers", badge: "Hot" },
      { label: "Tất cả công ty IT", href: "/#companies" },
      { label: "Việc làm theo công ty", href: "/#jobs-by-company" }
    ]
  },
  {
    title: "Ngành nổi bật",
    links: [
      { label: "Fintech", href: "/?q=Fintech" },
      { label: "E-commerce", href: "/?q=E-commerce" },
      { label: "Cloud", href: "/?q=Cloud" }
    ]
  },
  {
    title: "Cho nhà tuyển dụng",
    links: [
      { label: "Không gian tuyển dụng", href: "/recruiter" },
      { label: "Quản lý hồ sơ", href: "/?tab=manage&module=resumes" },
      { label: "Vận hành tin tuyển dụng", href: "/?tab=manage&module=jobs" }
    ]
  }
];

const CONTENT_MEGA: MegaColumn[] = [
  {
    title: "Career hub",
    links: [
      { label: "Featured articles", href: "/#career-resources" },
      { label: "IT expertise summary", href: "/#it-expertise" },
      { label: "About Jobhunter", href: "/#about" }
    ]
  },
  {
    title: "Báo cáo & dữ liệu",
    links: [
      { label: "Salary snapshot", href: "/#career-resources" },
      { label: "Thị trường tuyển dụng", href: "/#career-resources" },
      { label: "CV checklist", href: "/#career-resources" }
    ]
  },
  {
    title: "Công cụ",
    links: [
      { label: "Trợ lý AI nghề nghiệp", href: "/chatbot" },
      { label: "Tài khoản ứng viên", href: "/account" },
      { label: "Trung tâm hỗ trợ", href: "/support" }
    ]
  }
];

const MEGA_CONFIG: Record<MegaKey, { label: string; description: string; columns: MegaColumn[] }> = {
  jobs: {
    label: "All Jobs",
    description: "Search-first job board with salary, skills, city and level filters.",
    columns: JOB_MEGA
  },
  companies: {
    label: "IT Companies",
    description: "Khám phá công ty, đội ngũ tuyển dụng và các job đang mở.",
    columns: COMPANY_MEGA
  },
  content: {
    label: "Blog/Reports",
    description: "Bài viết nghề nghiệp, báo cáo thị trường và công cụ cho nhân sự IT.",
    columns: CONTENT_MEGA
  }
};

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "U";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function navClass(active: boolean): string {
  return active
    ? "border-b-2 border-[#b51d1a] px-1 py-4 text-sm font-bold text-[#b51d1a]"
    : "border-b-2 border-transparent px-1 py-4 text-sm font-semibold text-slate-700 hover:border-rose-200 hover:text-[#b51d1a]";
}

function megaButtonClass(active: boolean): string {
  return active
    ? "border-b-2 border-[#b51d1a] px-1 py-4 text-sm font-bold text-[#b51d1a]"
    : "border-b-2 border-transparent px-1 py-4 text-sm font-semibold text-slate-700 hover:border-rose-200 hover:text-[#b51d1a]";
}

function workspaceLabel(kind: WorkspaceKind): string {
  if (kind === "admin") return "Bảng điều hành quản trị";
  if (kind === "recruiter") return "Không gian tuyển dụng";
  return "Không gian ứng viên";
}

function buildGuestNav(isHome: boolean, isChatbot: boolean): NavItem[] {
  return [
    { href: "/", label: "Việc làm", active: isHome },
    { href: "/chatbot", label: "Trợ lý AI", active: isChatbot }
  ];
}

function buildAuthNav(kind: WorkspaceKind, isHome: boolean, isChatbot: boolean, isManage: boolean, isWorkspace: boolean): NavItem[] {
  if (kind === "admin") {
    return [
      { href: "/admin", label: "Bảng điều hành", active: isWorkspace },
      { href: "/?tab=manage&module=users", label: "Quản lý dữ liệu", active: isManage },
      { href: "/", label: "Cổng việc làm", active: isHome }
    ];
  }
  if (kind === "recruiter") {
    return [
      { href: "/recruiter", label: "Bảng tuyển dụng", active: isWorkspace },
      { href: "/?tab=manage&module=resumes", label: "Quản lý hồ sơ", active: isManage },
      { href: "/", label: "Cổng việc làm", active: isHome }
    ];
  }
  return [
    { href: "/candidate", label: "Không gian ứng viên", active: isWorkspace },
    { href: "/", label: "Khám phá việc làm", active: isHome },
    { href: "/chatbot", label: "Trợ lý AI", active: isChatbot }
  ];
}

function MegaPanel({ megaKey, onNavigate }: { megaKey: MegaKey; onNavigate?: () => void }) {
  const item = MEGA_CONFIG[megaKey];

  return (
    <div className="absolute left-1/2 top-full z-50 hidden w-[min(980px,calc(100vw-32px))] -translate-x-1/2 border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-900/15 lg:block">
      <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="border-r border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">Điều hướng Jobhunter</p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-950">{item.label}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          <Link
            href="/"
            onClick={onNavigate}
            className="mt-5 inline-flex rounded-md bg-[#b51d1a] px-4 py-2 text-sm font-bold text-white hover:bg-[#951513]"
          >
            Tìm việc ngay
          </Link>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {item.columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{column.title}</p>
              <div className="mt-3 grid gap-1.5">
                {column.links.map((link) => (
                  <Link
                    key={`${column.title}-${link.label}`}
                    href={link.href}
                    onClick={onNavigate}
                    className="group flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-[#b51d1a]"
                  >
                    <span>{link.label}</span>
                    {link.badge ? (
                      <span className="rounded-md bg-[#b51d1a] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        {link.badge}
                      </span>
                    ) : (
                      <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#b51d1a]">-&gt;</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppHeader() {
  const router = useRouter();
  const { status, currentUser, roleName, canAccessManagement, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState<MegaKey | null>(null);

  const workspace = useMemo(() => {
    if (status !== "authenticated") return null;
    return resolveWorkspaceKind(roleName, canAccessManagement);
  }, [status, roleName, canAccessManagement]);

  const workspaceHref = workspace ? workspacePath(workspace) : null;
  const workspaceText = workspace ? workspaceLabel(workspace) : "";

  const isHome = router.pathname === "/" && router.query.tab !== "manage";
  const isManage = router.pathname === "/" && router.query.tab === "manage";
  const isChatbot = router.pathname === "/chatbot";
  const isWorkspaceRoute = workspaceHref ? router.pathname === workspaceHref : false;

  const navItems = useMemo(() => {
    if (status !== "authenticated" || !workspace) {
      return buildGuestNav(isHome, isChatbot);
    }
    return buildAuthNav(workspace, isHome, isChatbot, isManage, isWorkspaceRoute);
  }, [status, workspace, isHome, isChatbot, isManage, isWorkspaceRoute]);

  const nextPath = encodeURIComponent(router.asPath || "/");
  const authLinks = useMemo(
    () => ({
      login: `/login?next=${nextPath}`,
      register: `/register?next=${nextPath}`
    }),
    [nextPath]
  );

  useEffect(() => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    setMegaOpen(null);
  }, [router.asPath]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        setAccountMenuOpen(false);
      }
    }
    if (accountMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [accountMenuOpen]);

  async function handleLogout() {
    await logout();
    setAccountMenuOpen(false);
    if (router.pathname !== "/") {
      await router.push("/");
    }
  }

  const quickWorkspaceLinks =
    workspace === "admin"
      ? [
          { href: "/admin", label: "Bảng điều hành quản trị" },
          { href: "/?tab=manage&module=users", label: "Quản lý dữ liệu hệ thống" }
        ]
      : workspace === "recruiter"
        ? [
            { href: "/recruiter", label: "Bảng tuyển dụng" },
            { href: "/?tab=manage&module=resumes", label: "Quản lý tin tuyển và hồ sơ" }
          ]
        : [
            { href: "/candidate", label: "Không gian ứng viên" },
            { href: "/account", label: "Thông tin tài khoản" }
          ];

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-slate-200 bg-white text-slate-900 shadow-sm" onMouseLeave={() => setMegaOpen(null)}>
        <div className="relative mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 py-3 sm:gap-2.5"
            aria-label="Jobhunter trang chủ"
          >
            <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-md border border-rose-100 bg-white shadow-sm sm:h-10 sm:w-10">
              <img src="/favicon.svg" alt="" className="h-full w-full object-cover" width={40} height={40} />
            </span>
            <span className="text-sm font-extrabold text-slate-950 sm:text-base">Jobhunter</span>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {(Object.keys(MEGA_CONFIG) as MegaKey[]).map((key) => (
              <div key={key} className="relative" onMouseEnter={() => setMegaOpen(key)}>
                <button
                  type="button"
                  className={megaButtonClass(megaOpen === key)}
                  aria-expanded={megaOpen === key}
                  onFocus={() => setMegaOpen(key)}
                  onClick={() => setMegaOpen((prev) => (prev === key ? null : key))}
                >
                  {MEGA_CONFIG[key].label}
                </button>
              </div>
            ))}
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={navClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {status === "loading" ? (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                Đang tải...
              </span>
            ) : null}

            {status !== "authenticated" ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href={authLinks.login}
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  href={authLinks.register}
                  className="rounded-md bg-[#b51d1a] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#951513]"
                >
                  Đăng ký
                </Link>
              </div>
            ) : null}

            {status === "authenticated" ? (
              <div className="relative" data-user-menu>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#b51d1a] text-xs font-bold text-white shadow-inner">
                    {getInitials(currentUser?.name)}
                  </div>
                  <span className="hidden max-w-36 truncate md:block">{currentUser?.name ?? "Tài khoản"}</span>
                  <svg
                    className={`hidden h-3 w-3 text-slate-400 transition md:block ${accountMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {accountMenuOpen ? (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-200/60">
                    <div className="border-b border-slate-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#b51d1a] text-sm font-bold text-white shadow-inner">
                          {getInitials(currentUser?.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{currentUser?.name ?? "Tài khoản"}</p>
                          <p className="truncate text-xs text-slate-500">{currentUser?.email ?? ""}</p>
                        </div>
                      </div>
                      {roleName ? (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {roleName.replace(/_/g, " ")}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-1 p-2">
                      {workspaceHref ? (
                        <div className="mb-1 px-2.5 py-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {workspaceText}
                          </p>
                        </div>
                      ) : null}
                      {quickWorkspaceLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <span className="text-slate-400">-</span>
                          {item.label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-slate-100" />
                      <Link href="/chatbot" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <span className="text-slate-400">-</span>
                        Trợ lý AI
                      </Link>
                      <Link href="/account" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <span className="text-slate-400">-</span>
                        Thông tin tài khoản
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
              aria-label="Mở menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>

          {megaOpen ? <MegaPanel megaKey={megaOpen} onNavigate={() => setMegaOpen(null)} /> : null}
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="mx-auto grid max-w-[1180px] gap-2">
              {(Object.keys(MEGA_CONFIG) as MegaKey[]).map((key) => (
                <details key={key} className="rounded-md border border-slate-200 bg-slate-50">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-bold text-slate-900">{MEGA_CONFIG[key].label}</summary>
                  <div className="grid gap-2 border-t border-slate-200 p-3">
                    {MEGA_CONFIG[key].columns.flatMap((column) => column.links).map((link) => (
                      <Link
                        key={`mobile-${key}-${link.label}`}
                        href={link.href}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
              <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-2">
                {navItems.map((item) => (
                  <Link key={`mobile-${item.href}`} href={item.href} className="rounded-md px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
                    {item.label}
                  </Link>
                ))}
                {status !== "authenticated" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={authLinks.login} className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-bold text-slate-700">
                      Đăng nhập
                    </Link>
                    <Link href={authLinks.register} className="rounded-md bg-[#b51d1a] px-3 py-2 text-center text-sm font-bold text-white">
                      Đăng ký
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
