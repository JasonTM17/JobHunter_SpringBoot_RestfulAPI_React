import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { registerAccount } from "../services/auth-rbac-api";
import { RegisterPayload } from "../types/models";
import { getPostLoginRedirect, resolveSafeNextPath } from "../utils/auth-redirect";

type GenderValue = "MALE" | "FEMALE" | "OTHER";

export default function RegisterPage() {
  const router = useRouter();
  const { status, roleName, canAccessManagement } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("22");
  const [gender, setGender] = useState<GenderValue>("MALE");
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
    const numberAge = Number(age);
    if (!Number.isFinite(numberAge) || numberAge < 0 || numberAge > 150) {
      return "Tuổi phải trong khoảng từ 0 đến 150.";
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
      age: Number(age),
      email: email.trim().toLowerCase(),
      password,
      address: address.trim(),
      gender
    };

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
      setError((submitError as Error).message || "Không thể tạo tài khoản.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-7xl items-center px-4 py-8">
      <section className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-extrabold text-slate-900">Tạo tài khoản mới</h1>
        <p className="mt-2 text-sm text-slate-600">
          Đăng ký tài khoản Jobhunter để theo dõi cơ hội việc làm và đăng nhập vào hệ thống.
        </p>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        {success ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        <form className="mt-4 grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Họ tên</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nguyễn Văn A"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Mật khẩu</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Xác nhận mật khẩu</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Tuổi</span>
              <input
                inputMode="numeric"
                value={age}
                onChange={(event) => setAge(event.target.value.replace(/[^\d]/g, ""))}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Giới tính</span>
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value as GenderValue)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Địa chỉ</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Hà Nội / TP. Hồ Chí Minh / ..."
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-bold text-rose-700 hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </section>
    </main>
  );
}
