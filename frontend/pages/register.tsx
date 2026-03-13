import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { registerAccount } from "../services/auth-rbac-api";
import { RegisterPayload } from "../types/models";
import { getPostLoginRedirect, resolveSafeNextPath } from "../utils/auth-redirect";
import { toUserErrorMessage } from "../utils/error-message";

type GenderValue = "MALE" | "FEMALE" | "OTHER";

export default function RegisterPage() {
  const router = useRouter();
  const { status, roleName, canAccessManagement } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<GenderValue | "">("");
  const [address, setAddress] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const nextPath = useMemo(() => {
    const raw = router.query.next;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return resolveSafeNextPath(value, "/");
  }, [router.query.next]);

  useEffect(() => {
    if (!router.isReady || status !== "authenticated") return;
    const target = getPostLoginRedirect(roleName, canAccessManagement, nextPath);
    void router.replace(target);
  }, [router.isReady, status, roleName, canAccessManagement, nextPath]);

  function validateForm(): string | null {
    if (!name.trim()) return "Vui lòng nhập họ tên.";
    const safeEmail = email.trim().toLowerCase();
    if (!safeEmail) return "Vui lòng nhập email.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(safeEmail)) return "Email không đúng định dạng.";
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp.";
    if (age.trim()) {
      const numberAge = Number(age);
      if (!Number.isFinite(numberAge) || numberAge < 0 || numberAge > 150) {
        return "Tuổi phải trong khoảng từ 0 đến 150.";
      }
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: RegisterPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    };

    if (age.trim()) payload.age = Number(age.trim());
    if (gender) payload.gender = gender;
    if (address.trim()) payload.address = address.trim();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await registerAccount(payload);
      setSuccess("Tạo tài khoản thành công. Đang chuyển đến trang đăng nhập...");
      await router.push(
        `/login?registered=1&email=${encodeURIComponent(payload.email)}&next=${encodeURIComponent(nextPath)}`
      );
    } catch (submitError) {
      setError(toUserErrorMessage(submitError, "Không thể tạo tài khoản lúc này."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1180px] items-center px-3 py-6 sm:px-4 md:py-10">
      <section className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-soft lg:grid-cols-[1.04fr,1fr]">
        <aside className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-slate-100 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-rose-100">
            <img src="/favicon.svg" alt="Jobhunter" className="h-4 w-4" />
            Jobhunter
          </div>
          <h2 className="mt-6 text-3xl font-extrabold leading-tight">Tạo tài khoản mới để bắt đầu tìm việc dễ hơn</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-200">
            Bước đầu chỉ cần thông tin tài khoản cơ bản. Thông tin hồ sơ cá nhân có thể bổ sung sau để tối ưu gợi ý công việc.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              Duyệt việc làm theo kỹ năng, mức lương và khu vực chỉ trong vài giây.
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              Theo dõi hồ sơ ứng tuyển và trạng thái phản hồi minh bạch theo thời gian thực.
            </div>
          </div>
        </aside>

        <article className="p-5 sm:p-7 lg:p-8">
          <div className="mb-4 md:hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              <img src="/favicon.svg" alt="Jobhunter" className="h-4 w-4" />
              Jobhunter
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Tạo tài khoản Jobhunter</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Nhập thông tin tài khoản để bắt đầu. Các mục hồ sơ nâng cao là tùy chọn.
          </p>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          ) : null}

          {success ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          <form className="mt-5 grid gap-3.5" onSubmit={(event) => void handleSubmit(event)}>
            <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <header>
                <h2 className="text-sm font-bold text-slate-800">Thông tin tài khoản</h2>
                <p className="mt-0.5 text-xs text-slate-500">Bắt buộc</p>
              </header>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Họ tên</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ví dụ: Nguyễn Minh Anh"
                    autoComplete="name"
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Mật khẩu</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Xác nhận mật khẩu</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </label>
              </div>
            </section>

            <details className="rounded-2xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
                <span className="inline-flex items-center gap-2">
                  Thông tin cá nhân thêm
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    Không bắt buộc
                  </span>
                </span>
              </summary>
              <p className="mt-1 text-xs text-slate-500">
                Bạn có thể bỏ qua bước này và bổ sung sau. Hệ thống vẫn tạo tài khoản bình thường.
              </p>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Tuổi</span>
                  <input
                    inputMode="numeric"
                    value={age}
                    onChange={(event) => setAge(event.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Ví dụ: 22"
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Giới tính</span>
                  <select
                    value={gender}
                    onChange={(event) => setGender(event.target.value as GenderValue | "")}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="">Chưa chọn</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </label>
              </div>

              <label className="mt-3 grid gap-1.5 text-sm">
                <span className="font-semibold text-slate-700">Địa chỉ</span>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Ví dụ: Hà Nội / TP.HCM / ..."
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                />
              </label>
            </details>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Đã có tài khoản?{" "}
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-rose-700 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </article>
      </section>
    </main>
  );
}
