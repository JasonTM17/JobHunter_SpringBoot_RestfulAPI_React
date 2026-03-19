import Head from "next/head";
import Link from "next/link";
import AuthShell from "../components/common/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <>
      <Head>
        <title>Quên mật khẩu — Jobhunter</title>
        <meta name="description" content="Khôi phục mật khẩu Jobhunter. Liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu một cách an toàn." />
      </Head>
      <AuthShell
        eyebrow="Khôi phục tài khoản"
        asideTitle="Quên mật khẩu?"
        asideDescription="Liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu một cách an toàn."
        highlights={[
          "Chúng tôi bảo vệ tài khoản bằng quy trình xác minh qua quản trị viên.",
          "Email của bạn sẽ được xử lý trong giờ hành chính.",
          "Nếu cần hỗ trợ khẩn cấp, hãy liên hệ trực tiếp bộ phận kỹ thuật."
        ]}
      >
        <div className="max-w-md">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Khôi phục mật khẩu</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Vì lý do bảo mật, việc đặt lại mật khẩu cần được xác minh thủ công bởi quản trị viên Jobhunter.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">Liên hệ hỗ trợ:</p>
            <p className="mt-1 text-sm text-amber-700">Email: support@jobhunter.vn</p>
            <p className="text-sm text-amber-700">Giờ hành chính: Thứ 2 – Thứ 6, 8:00 – 17:00</p>
          </div>

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
