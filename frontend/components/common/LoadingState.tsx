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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4 grid gap-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-200/70 sm:h-14" />
        ))}
      </div>
    </section>
  );
}
