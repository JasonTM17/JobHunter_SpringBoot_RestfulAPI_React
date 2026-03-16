import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
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
  const registerHref = useMemo(() => `/register?next=${encodeURIComponent(router.asPath || "/account")}`, [router.asPath]);

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
      <main className="mx-auto max-w-[1180px] px-3 py-6 sm:px-4 sm:py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <p className="text-sm text-slate-600">Đang tải thông tin tài khoản...</p>
        </section>
      </main>
    );
  }

  if (status !== "authenticated" || !currentUser) {
    return (
      <main className="mx-auto max-w-[1180px] px-3 py-6 sm:px-4 sm:py-8">
        <section className="grid gap-4 rounded-[30px] border border-slate-200 bg-white p-5 shadow-soft sm:p-6 lg:grid-cols-[1.08fr,0.92fr] lg:p-8">
          <article className="rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white sm:p-7">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
              Tài khoản Jobhunter
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">Đăng nhập để mở toàn bộ không gian cá nhân của bạn</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
              Theo dõi hồ sơ ứng tuyển, cập nhật cài đặt email gợi ý việc làm và đi nhanh tới workspace phù hợp với quyền hiện tại.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-300">Ứng tuyển</p>
                <p className="mt-1 text-sm font-semibold text-white">Theo dõi trạng thái minh bạch</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-300">Thông báo</p>
                <p className="mt-1 text-sm font-semibold text-white">Bật hoặc tắt email gợi ý</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-300">Workspace</p>
                <p className="mt-1 text-sm font-semibold text-white">Đi tới đúng không gian làm việc</p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Trạng thái hiện tại</p>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Bạn chưa đăng nhập</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Đăng nhập để xem thông tin tài khoản, quản lý email gợi ý việc làm và mở nhanh khu vực phù hợp với vai trò của bạn.
            </p>

            <div className="mt-5 grid gap-3">
              <Link
                href={loginHref}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Đăng nhập
              </Link>
              <Link
                href={registerHref}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                Tạo tài khoản mới
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Về cổng việc làm
              </Link>
            </div>
          </article>
        </section>
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
    <main className="mx-auto max-w-[1180px] px-3 py-6 sm:px-4 sm:py-8">
      <section className="rounded-[30px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-5 text-white shadow-soft sm:p-6 lg:p-7">
        <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
          Hồ sơ tài khoản
        </p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{currentUser.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200">
              Theo dõi nhanh thông tin hồ sơ, phạm vi quyền hiện tại và các cài đặt ảnh hưởng trực tiếp tới trải nghiệm nhận việc làm phù hợp.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="max-w-full break-all rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                {currentUser.email}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                {roleName ?? "Chưa gán vai trò"}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                {permissionCount} khóa quyền
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Vai trò</p>
                <p className="mt-1 text-base font-bold text-white">{roleName ?? "Chưa gán"}</p>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Mức truy cập</p>
                <p className="mt-1 text-base font-bold text-white">{levelText(permissionCount)}</p>
              </article>
              <article className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Email gợi ý</p>
                <p className="mt-1 text-base font-bold text-white">{weeklyEmailEnabled ? "Đã bật" : "Đang tắt"}</p>
              </article>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Workspace</p>
            <p className="mt-2 text-lg font-bold text-white">{workspaceLabel}</p>
            <p className="mt-2 text-sm text-slate-200">Đi nhanh tới đúng khu vực làm việc theo quyền hiện tại của tài khoản.</p>
            <div className="mt-4 grid gap-2">
              <Link
                href={workspaceHref}
                className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Mở workspace
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-slate-100 hover:bg-white/20"
              >
                Về cổng việc làm
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Hồ sơ cơ bản
            </span>
            <h2 className="text-lg font-bold text-slate-900">Thông tin tài khoản</h2>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Họ tên</p>
              <p className="mt-1 text-base font-bold text-slate-900 break-words">{currentUser.name}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 break-all text-base font-bold text-slate-900">{currentUser.email}</p>
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
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cài đặt nhận tin</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">Thông báo email</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Gửi cho tôi các công việc phù hợp dựa trên lịch sử ứng tuyển và kỹ năng quan tâm.
          </p>

          <label
            className={`mt-5 flex items-start justify-between gap-4 rounded-2xl border p-4 ${
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
        </article>
      </section>
    </main>
  );
}
