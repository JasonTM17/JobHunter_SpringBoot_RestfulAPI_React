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
    ? "rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white sm:text-xs"
    : "rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:text-xs";
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-2 px-4 py-2.5 sm:px-5 xl:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-2 py-1 hover:bg-slate-100">
            <img src="/favicon.svg" alt="Jobhunter" className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm font-extrabold text-slate-900 md:text-base">Jobhunter</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={navClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Đang tải phiên...
            </span>
          ) : null}

          {status !== "authenticated" ? (
            <>
              <Link
                href={authLinks.login}
                className="rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-xs"
              >
                Đăng nhập
              </Link>
              <Link
                href={authLinks.register}
                className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 sm:px-3 sm:text-xs"
              >
                Đăng ký
              </Link>
            </>
          ) : null}

          {status === "authenticated" ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:text-xs"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {getInitials(currentUser?.name)}
                </span>
                <span className="hidden max-w-40 truncate md:inline">{currentUser?.name ?? "Tài khoản"}</span>
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <p className="text-sm font-bold text-slate-900">{currentUser?.name ?? "Tài khoản"}</p>
                  <p className="mt-1 text-xs text-slate-500">{currentUser?.email ?? "Không có email"}</p>
                  <p className="mt-1 text-xs text-slate-500">Vai trò: {roleName ?? "Chưa gán vai trò"}</p>

                  <div className="mt-3 grid gap-1.5">
                    {workspaceHref ? (
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                        {workspaceText}
                      </p>
                    ) : null}
                    {quickWorkspaceLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Link
                      href="/chatbot"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Trợ lý AI
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-4 pb-2 sm:px-5 xl:px-6 lg:hidden">
        <nav className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <Link key={`mobile-${item.href}`} href={item.href} className={`${navClass(item.active)} whitespace-nowrap`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
