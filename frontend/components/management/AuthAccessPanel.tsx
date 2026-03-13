import { FormEvent, useState } from "react";
import { useAuth } from "../../contexts/auth-context";

interface AuthAccessPanelProps {
  onAfterLogin?: () => Promise<void>;
}

export default function AuthAccessPanel({ onAfterLogin }: AuthAccessPanelProps) {
  const { status, currentUser, roleName, permissionKeys, lastAuthError, login, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      if (onAfterLogin) await onAfterLogin();
      setPassword("");
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (status === "authenticated") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tài khoản đang quản trị</h3>
            <p className="mt-1 text-sm text-slate-600">
              {currentUser?.name ?? "Không rõ"} • {currentUser?.email ?? "Không có email"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Vai trò: {roleName ?? "Chưa gán vai trò"}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Đăng xuất
          </button>
        </div>

        {lastAuthError ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Cảnh báo xác thực: {lastAuthError}
          </p>
        ) : null}

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-700">
            Số khóa quyền hiện có: {permissionKeys.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Các nút thao tác sẽ tự ẩn/khóa theo danh sách quyền này.
          </p>
        </div>

        {permissionKeys.length === 0 ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Tài khoản hiện tại chưa có quyền thao tác nào. Bạn cần được cấp quyền trước khi chỉnh sửa dữ liệu.
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <h3 className="text-base font-bold text-slate-900">Đăng nhập để dùng cổng quản trị</h3>
      <p className="mt-1 text-sm text-slate-600">
        Hệ thống sẽ tự bật hoặc ẩn thao tác theo quyền của tài khoản hiện tại.
      </p>

      <form className="mt-3 grid gap-2" onSubmit={(event) => void submit(event)}>
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          placeholder="Email"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          type="password"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          placeholder="Mật khẩu"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !username.trim() || password.length < 3}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>
      ) : null}

      {lastAuthError ? (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {lastAuthError}
        </p>
      ) : null}
    </section>
  );
}
