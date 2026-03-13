import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center px-4 py-10">
      <section className="grid gap-6 rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft md:grid-cols-[1.2fr,1fr] md:p-10">
        <article>
          <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Trang không tồn tại
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">404</h1>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Bạn vừa đi lạc khỏi Jobhunter</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Trang bạn đang tìm không tồn tại hoặc đã được chuyển đi. Bạn có thể quay về trang chủ, tiếp tục khám phá việc làm, hoặc đăng nhập để vào khu vực của mình.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Về trang chủ
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Khám phá việc làm
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              Đăng nhập
            </Link>
          </div>
        </article>

        <aside className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-slate-100">
          <h3 className="text-lg font-bold">Gợi ý nhanh</h3>
          <ul className="mt-3 grid gap-2 text-sm text-slate-200">
            <li>• Tìm việc theo kỹ năng và mức lương.</li>
            <li>• Xem chi tiết tin tuyển dụng từ công ty thật.</li>
            <li>• Dùng trợ lý AI để chuẩn bị CV và phỏng vấn.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
