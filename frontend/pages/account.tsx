import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../contexts/auth-context";
import { hasManagementPermission } from "../utils/permissions";
import { resolveWorkspaceKind, workspacePath } from "../utils/workspace";

function levelText(permissionCount: number): string {
  if (permissionCount >= 20) return "Quản trị cao";
  if (permissionCount >= 1) return "Có quyền thao tác";
  return "Quyền hạn cơ bản";
}

export default function AccountPage() {
  const router = useRouter();
  const { status, currentUser, roleName, permissionKeys } = useAuth();

  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(router.asPath || "/account")}`, [router.asPath]);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-600">Đang tải thông tin tài khoản...</p>
        </section>
      </main>
    );
  }

  if (status !== "authenticated" || !currentUser) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <EmptyState
          title="Bạn chưa đăng nhập"
          description="Vui lòng đăng nhập để xem thông tin tài khoản và quyền truy cập."
          actionLabel="Đăng nhập"
          onAction={() => void router.push(loginHref)}
        />
      </main>
    );
  }

  const permissionCount = permissionKeys.length;
  const canAccessManagement = hasManagementPermission(permissionKeys);
  const workspace = resolveWorkspaceKind(roleName, canAccessManagement);
  const workspaceHref = workspacePath(workspace);
  const workspaceLabel =
    workspace === "admin"
      ? "Vào khu quản trị hệ thống"
      : workspace === "recruiter"
        ? "Vào khu tuyển dụng"
        : "Vào không gian ứng viên";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="grid gap-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-extrabold text-slate-900">Trang tài khoản</h1>
          <p className="mt-2 text-sm text-slate-600">
            Theo dõi nhanh thông tin hồ sơ và phạm vi quyền hiện tại của bạn.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Họ tên</p>
              <p className="mt-1 text-base font-bold text-slate-900">{currentUser.name}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 text-base font-bold text-slate-900">{currentUser.email}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò</p>
              <p className="mt-1 text-base font-bold text-slate-900">{roleName ?? "Chưa gán vai trò"}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mức quyền hiện tại</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {levelText(permissionCount)} ({permissionCount} khóa quyền)
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Về cổng việc làm
            </Link>
            <Link
              href={workspaceHref}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {workspaceLabel}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
