import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/auth-context";
import { resolveWorkspaceKind, workspacePath } from "../../utils/workspace";

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
    ? "rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
    : "rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100";
}

function workspaceLabel(kind: "admin" | "recruiter" | "candidate"): string {
  if (kind === "admin") return "Quản trị hệ thống";
  if (kind === "recruiter") return "Không gian tuyển dụng";
  return "Không gian ứng viên";
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

  const isHome = router.pathname === "/";
  const isChatbot = router.pathname === "/chatbot";
  const isWorkspaceRoute = workspaceHref ? router.pathname === workspaceHref : false;

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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-2 py-1 hover:bg-slate-100">
            <img src="/favicon.svg" alt="Jobhunter" className="h-6 w-6" />
            <span className="text-sm font-extrabold text-slate-900 md:text-base">Jobhunter</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/" className={navClass(isHome)}>
              Việc làm
            </Link>
            {workspaceHref ? (
              <Link href={workspaceHref} className={navClass(isWorkspaceRoute)}>
                {workspaceText}
              </Link>
            ) : null}
            <Link href="/chatbot" className={navClass(isChatbot)}>
              Trợ lý AI
            </Link>
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
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đăng nhập
              </Link>
              <Link
                href={authLinks.register}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
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
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
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
                      <Link
                        href={workspaceHref}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {workspaceText}
                      </Link>
                    ) : null}
                    <Link
                      href="/account"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Trang tài khoản
                    </Link>
                    <Link
                      href="/"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Về cổng việc làm
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

      <div className="mx-auto max-w-7xl px-4 pb-2 md:hidden">
        <nav className="flex flex-wrap gap-1">
          <Link href="/" className={navClass(isHome)}>
            Việc làm
          </Link>
          {workspaceHref ? (
            <Link href={workspaceHref} className={navClass(isWorkspaceRoute)}>
              {workspaceText}
            </Link>
          ) : null}
          <Link href="/chatbot" className={navClass(isChatbot)}>
            Trợ lý AI
          </Link>
        </nav>
      </div>
    </header>
  );
}
