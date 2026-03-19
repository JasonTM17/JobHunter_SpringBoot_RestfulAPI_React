import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/auth-context";
import { resolveWorkspaceKind, workspacePath } from "../../utils/workspace";

type WorkspaceKind = "admin" | "recruiter" | "candidate";

interface NavItem {
  href: string;
  label: string;
  active: boolean;
}

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
    ? "rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm"
    : "rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900";
}

function workspaceLabel(kind: WorkspaceKind): string {
  if (kind === "admin") return "Quản trị hệ thống";
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

export default function AppHeader() {
  const router = useRouter();
  const { status, currentUser, roleName, canAccessManagement, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
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
      {/* ── Top brand strip ─────────────────────────────── */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white shadow-sm">
        <span className="hidden sm:inline">
          Nền tảng tuyển dụng IT hàng đầu — cập nhật việc làm mới mỗi ngày
        </span>
        <span className="inline sm:hidden">Jobhunter — Việc làm IT cho mọi cấp độ</span>
      </div>

      {/* ── Main header ───────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
          {/* Brand — favicon.svg (mark J + accent) + wordmark như bản gốc */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1 hover:bg-slate-100 sm:gap-2.5"
            aria-label="Jobhunter — Trang chủ"
          >
            <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100 sm:h-10 sm:w-10">
              <img src="/favicon.svg" alt="" className="h-full w-full object-cover" width={40} height={40} />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">Jobhunter</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1.5 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={navClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth area */}
          <div className="flex items-center gap-2.5">
            {status === "loading" ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-400">
                Đang tải...
              </span>
            ) : null}

            {status !== "authenticated" ? (
              <>
                <Link
                  href={authLinks.login}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  href={authLinks.register}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-rose-500/25 transition hover:from-rose-700 hover:to-pink-600 hover:shadow-md"
                >
                  Đăng ký
                </Link>
              </>
            ) : null}

            {status === "authenticated" ? (
              <div className="relative" data-user-menu>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-xs font-bold text-white shadow-inner">
                    {getInitials(currentUser?.name)}
                  </div>
                  <span className="hidden max-w-36 truncate md:block">{currentUser?.name ?? "Tài khoản"}</span>
                  <svg
                    className={`hidden h-3 w-3 text-slate-400 transition ${menuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                    {/* User info */}
                    <div className="border-b border-slate-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-sm font-bold text-white shadow-inner">
                          {getInitials(currentUser?.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{currentUser?.name ?? "Tài khoản"}</p>
                          <p className="truncate text-xs text-slate-500">{currentUser?.email ?? ""}</p>
                        </div>
                      </div>
                      {roleName ? (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {roleName.replace(/_/g, " ")}
                        </div>
                      ) : null}
                    </div>

                    {/* Quick links */}
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
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {item.label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-slate-100" />
                      <Link
                        href="/chatbot"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-1.1 3 3 0 00-4.133 1.345A8.963 8.963 0 0012 20c4.97 0 9-3.582 9-8 0-4.418-4.03-8-9-8" />
                        </svg>
                        Trợ lý AI
                      </Link>
                      <Link
                        href="/account"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Thông tin tài khoản
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="mx-auto w-full max-w-[1200px] px-4 pb-2 lg:hidden sm:px-5 sm:pb-2.5">
          <nav className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <Link key={`mobile-${item.href}`} href={item.href} className={`${navClass(item.active)} whitespace-nowrap`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
