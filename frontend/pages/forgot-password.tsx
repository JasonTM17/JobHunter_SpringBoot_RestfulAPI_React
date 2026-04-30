import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AuthShell from "../components/common/AuthShell";
import { requestPasswordReset, resetPassword } from "../services/auth-rbac-api";
import { toUserErrorMessage } from "../utils/error-message";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasToken = token.trim().length > 0;
  const tokenFromQuery = useMemo(() => {
    const raw = router.query.token;
    return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  }, [router.query.token]);

  useEffect(() => {
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
    }
  }, [tokenFromQuery]);

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Email chưa đúng định dạng.");
      return;
    }

    setRequesting(true);
    try {
      const response = await requestPasswordReset(cleanEmail);
      setMessage(response.message || "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.");
      if (response.devResetToken) {
        setToken(response.devResetToken);
      }
    } catch (requestError) {
      setError(toUserErrorMessage(requestError, "Không thể gửi yêu cầu khôi phục mật khẩu lúc này."));
    } finally {
      setRequesting(false);
    }
  }

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Mật khẩu mới cần có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setResetting(true);
    try {
      const response = await resetPassword(token.trim(), password);
      setMessage(response.message || "Mật khẩu đã được cập nhật.");
      setPassword("");
      setConfirmPassword("");
      setToken("");
    } catch (resetError) {
      setError(toUserErrorMessage(resetError, "Không thể đặt lại mật khẩu lúc này."));
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Quên mật khẩu — Jobhunter</title>
        <meta name="description" content="Khôi phục mật khẩu Jobhunter bằng email hoặc token đặt lại mật khẩu." />
      </Head>
      <AuthShell
        eyebrow="Khôi phục tài khoản"
        asideTitle="Đặt lại mật khẩu an toàn"
        asideDescription="Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu. Ở môi trường dev, hệ thống có thể trả token trực tiếp để kiểm thử nhanh."
        highlights={[
          "Không tiết lộ email có tồn tại trong hệ thống hay không.",
          "Token đặt lại mật khẩu có hạn dùng ngắn và chỉ sử dụng một lần.",
          "Sau khi đổi mật khẩu, refresh token cũ sẽ bị vô hiệu hóa."
        ]}
      >
        <div className="max-w-md">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Khôi phục mật khẩu</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Gửi yêu cầu khôi phục bằng email, sau đó dùng token trong email để tạo mật khẩu mới.
          </p>

          <form onSubmit={submitForgotPassword} className="mt-6 grid gap-3">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Email tài khoản
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <button
              type="submit"
              disabled={requesting}
              className="rounded-md bg-rose-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {requesting ? "Đang gửi..." : "Gửi hướng dẫn khôi phục"}
            </button>
          </form>

          <form onSubmit={submitResetPassword} className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">Đặt mật khẩu mới</p>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Reset token
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Token trong email"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Mật khẩu mới
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ít nhất 8 ký tự"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Nhập lại mật khẩu
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <button
              type="submit"
              disabled={resetting || !hasToken}
              className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
            </button>
          </form>

          {message ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}

          <p className="mt-5 text-center text-sm text-slate-600">
            Nhớ mật khẩu?{" "}
            <Link href="/login" className="font-semibold text-rose-700 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </AuthShell>
    </>
  );
}
