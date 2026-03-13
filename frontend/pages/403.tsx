import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useAuth } from "../contexts/auth-context";
import { resolveWorkspaceKind, workspacePath } from "../utils/workspace";

export default function ForbiddenPage() {
  const router = useRouter();
  const { status, roleName, canAccessManagement } = useAuth();

  const preferredPath = useMemo(() => {
    if (status !== "authenticated") return "/";
    const workspace = resolveWorkspaceKind(roleName, canAccessManagement);
    return workspacePath(workspace);
  }, [status, roleName, canAccessManagement]);

  const nextPath = useMemo(() => {
    const raw = router.query.next;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query.next]);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-5xl place-items-center px-4 py-10">
      <section className="w-full max-w-2xl rounded-3xl border border-amber-200 bg-white p-8 shadow-soft">
        <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Mã lỗi 403
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Bạn không có quyền truy cập khu vực này</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Trang bạn đang mở yêu cầu quyền cao hơn quyền hiện tại của tài khoản. Bạn có thể quay về khu phù hợp để tiếp tục sử dụng Jobhunter.
        </p>
        {nextPath ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Đường dẫn vừa bị chặn: {nextPath}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={preferredPath}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Về khu vực phù hợp
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Về cổng việc làm
          </Link>
          {status !== "authenticated" ? (
            <Link
              href={`/login?next=${encodeURIComponent(nextPath || "/")}`}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              Đăng nhập
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
