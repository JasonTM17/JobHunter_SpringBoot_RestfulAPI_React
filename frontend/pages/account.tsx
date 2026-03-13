import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../contexts/auth-context";
import { fetchEmailPreferences, updateEmailPreferences } from "../services/auth-rbac-api";
import { toUserErrorMessage } from "../utils/error-message";
import { hasManagementPermission } from "../utils/permissions";
import { resolveWorkspaceKind, workspacePath } from "../utils/workspace";

function levelText(permissionCount: number): string {
  if (permissionCount >= 20) return "Quản trị cao";
  if (permissionCount >= 1) return "Có quyền thao tác";
  return "Quyền hạn cơ bản";
}

export default function AccountPage() {
  const router = useRouter();
  const { status, currentUser, roleName, permissionKeys, refreshAccount } = useAuth();

  const [weeklyEmailEnabled, setWeeklyEmailEnabled] = useState(false);
  const [emailSettingLoading, setEmailSettingLoading] = useState(false);
  const [emailSettingSaving, setEmailSettingSaving] = useState(false);
  const [emailSettingError, setEmailSettingError] = useState("");
  const [emailSettingMessage, setEmailSettingMessage] = useState("");

  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(router.asPath || "/account")}`, [router.asPath]);

  useEffect(() => {
    if (status !== "authenticated" || !currentUser) return;

    let alive = true;
    setEmailSettingLoading(true);
    setEmailSettingError("");
    setEmailSettingMessage("");

    void (async () => {
      try {
        const setting = await fetchEmailPreferences();
        if (!alive) return;
        setWeeklyEmailEnabled(Boolean(setting.weeklyJobRecommendationEnabled));
      } catch (error) {
        if (!alive) return;
        setWeeklyEmailEnabled(Boolean(currentUser.weeklyJobRecommendationEnabled));
        setEmailSettingError(
          toUserErrorMessage(error, "Không thể tải tùy chọn email gợi ý việc làm lúc này.")
        );
      } finally {
        if (alive) setEmailSettingLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [status, currentUser?.id, currentUser?.weeklyJobRecommendationEnabled]);

  async function handleToggleWeeklyEmail(nextValue: boolean) {
    const previous = weeklyEmailEnabled;
    setWeeklyEmailEnabled(nextValue);
    setEmailSettingSaving(true);
    setEmailSettingError("");
    setEmailSettingMessage("");

    try {
      const updated = await updateEmailPreferences(nextValue);
      setWeeklyEmailEnabled(Boolean(updated.weeklyJobRecommendationEnabled));
      await refreshAccount();
      setEmailSettingMessage(
        nextValue
          ? "Đã bật nhận email gợi ý việc làm mỗi tuần."
          : "Đã tắt nhận email gợi ý việc làm."
      );
    } catch (error) {
      setWeeklyEmailEnabled(previous);
      setEmailSettingError(toUserErrorMessage(error, "Không thể cập nhật tùy chọn email lúc này."));
    } finally {
      setEmailSettingSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-[1180px] px-3 py-6 sm:px-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-600">Đang tải thông tin tài khoản...</p>
        </section>
      </main>
    );
  }

  if (status !== "authenticated" || !currentUser) {
    return (
      <main className="mx-auto max-w-[1180px] px-3 py-6 sm:px-4">
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
    <main className="mx-auto max-w-[1180px] px-3 py-6 sm:px-4">
      <section className="grid gap-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Trang tài khoản</h1>
          <p className="mt-2 text-sm text-slate-600">
            Theo dõi nhanh thông tin hồ sơ và phạm vi quyền hiện tại của bạn.
          </p>

          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
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

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Cài đặt thông báo email</h2>
          <p className="mt-2 text-sm text-slate-600">
            Gửi cho tôi các công việc phù hợp dựa trên lịch sử ứng tuyển và kỹ năng quan tâm.
          </p>

          <label
            className={`mt-4 flex items-start justify-between gap-4 rounded-2xl border p-4 ${
              weeklyEmailEnabled ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Nhận email gợi ý việc làm phù hợp mỗi tuần</p>
              <p className="mt-1 text-xs text-slate-500">Bạn có thể tắt tính năng này bất kỳ lúc nào.</p>
            </div>

            <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={weeklyEmailEnabled}
                onChange={(event) => void handleToggleWeeklyEmail(event.target.checked)}
                disabled={emailSettingLoading || emailSettingSaving}
              />
              <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-disabled:opacity-60" />
              <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
          </label>

          {emailSettingLoading ? (
            <p className="mt-3 text-sm text-slate-500">Đang tải tùy chọn email...</p>
          ) : null}
          {emailSettingSaving ? (
            <p className="mt-3 text-sm text-slate-500">Đang lưu cài đặt...</p>
          ) : null}
          {emailSettingMessage ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {emailSettingMessage}
            </p>
          ) : null}
          {emailSettingError ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {emailSettingError}
            </p>
          ) : null}
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
