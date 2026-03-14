import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AuthShell from "../components/common/AuthShell";
import { useAuth } from "../contexts/auth-context";
import { getPostLoginRedirect, resolveSafeNextPath } from "../utils/auth-redirect";

function normalizeLoginErrorMessage(rawMessage: string): string {
  const message = rawMessage.trim().toLowerCase();
  if (!message) return "Đăng nhập không thành công. Vui lòng thử lại.";

  if (
    message.includes("bad credentials") ||
    message.includes("invalid credentials") ||
    message.includes("sai") ||
    message.includes("không đúng")
  ) {
    return "Email hoặc mật khẩu chưa đúng.";
  }

  if (message.includes("session") || message.includes("phiên") || message.includes("hết hạn")) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (message.includes("network") || message.includes("kết nối") || message.includes("fetch")) {
    return "Không thể kết nối tới máy chủ. Vui lòng thử lại sau ít phút.";
  }

  return "Đăng nhập không thành công. Vui lòng thử lại.";
}

export default function LoginPage() {
  const router = useRouter();
  const { status, roleName, canAccessManagement, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const nextPath = useMemo(() => {
    const raw = router.query.next;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return resolveSafeNextPath(value, "/");
  }, [router.query.next]);

  const registered = useMemo(() => {
    const raw = router.query.registered;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value === "1";
  }, [router.query.registered]);

  useEffect(() => {
    if (!router.isReady) return;
    const queryEmail = Array.isArray(router.query.email) ? router.query.email[0] : router.query.email;
    if (typeof queryEmail === "string" && queryEmail.trim()) {
      setEmail(queryEmail.trim());
    }
  }, [router.isReady, router.query.email]);

  useEffect(() => {
    if (!router.isReady || status !== "authenticated") return;
    const target = getPostLoginRedirect(roleName, canAccessManagement, nextPath);
    void router.replace(target);
  }, [router.isReady, status, roleName, canAccessManagement, nextPath]);

  function validateForm(): string | null {
    const safeEmail = email.trim();
    if (!safeEmail) return "Vui lòng nhập email.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(safeEmail)) return "Email chưa đúng định dạng. Bạn vui lòng kiểm tra lại.";

    if (password.length < 6) return "Mật khẩu cần có ít nhất 6 ký tự.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await login(email.trim().toLowerCase(), password);
      setSuccess("Đăng nhập thành công. Đang chuyển bạn tới trang phù hợp...");
    } catch (submitError) {
      setError(normalizeLoginErrorMessage((submitError as Error).message || ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Đăng nhập tài khoản"
      asideTitle="Chào mừng bạn quay lại với hành trình nghề nghiệp của mình"
      asideDescription="Đăng nhập để theo dõi việc làm phù hợp, cập nhật hồ sơ và kết nối nhanh hơn với nhà tuyển dụng."
      highlights={[
        "Gợi ý việc làm theo kỹ năng, khu vực và cấp độ phù hợp.",
        "Quản lý hồ sơ ứng tuyển gọn gàng, rõ ràng, dễ theo dõi.",
        "Trải nghiệm tuyển dụng hiện đại, minh bạch và đáng tin cậy."
      ]}
    >
      <div className="max-w-md">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Đăng nhập vào Jobhunter</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Tiếp tục với tài khoản của bạn để theo dõi việc làm phù hợp và quản lý hồ sơ ứng tuyển thuận tiện hơn.
          </p>

          {registered ? (
            <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Tài khoản đã được tạo thành công. Bạn hãy đăng nhập để bắt đầu sử dụng Jobhunter.
            </p>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          ) : null}

          {success ? (
            <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          <form className="mt-5 grid gap-3.5" onSubmit={(event) => void handleSubmit(event)}>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Nhập email của bạn"
                autoComplete="email"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-slate-700">Mật khẩu</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
              />
            </label>

            <div className="mt-0.5 flex items-center justify-end">
              <a
                href="mailto:support@jobhunter.local"
                className="text-xs font-medium text-slate-500 transition hover:text-rose-700 hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Chưa có tài khoản?{" "}
            <Link
              href={`/register?next=${encodeURIComponent(nextPath)}`}
              className="font-semibold text-rose-700 transition hover:text-rose-800 hover:underline"
            >
              Tạo tài khoản
            </Link>
          </p>
      </div>
    </AuthShell>
  );
}
