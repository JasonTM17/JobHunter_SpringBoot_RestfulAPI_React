interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  rows?: number;
}

export default function LoadingState({
  title = "Đang tải dữ liệu...",
  subtitle = "Vui lòng đợi trong giây lát.",
  rows = 4
}: LoadingStateProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.22-8.56" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2.5">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="h-3.5 w-1/3 rounded-full bg-slate-200/80" />
            <div className="mt-3 h-3 rounded-full bg-slate-200/70" />
            <div className="mt-2 h-3 w-5/6 rounded-full bg-slate-200/70" />
          </div>
        ))}
      </div>
    </section>
  );
}
