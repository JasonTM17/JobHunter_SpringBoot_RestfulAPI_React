interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Không thể tải dữ liệu",
  description,
  onRetry
}: ErrorStateProps) {
  return (
    <section className="rounded-3xl border border-rose-200 bg-gradient-to-b from-white to-rose-50 p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-rose-200 bg-white text-rose-700 shadow-sm">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v5m0 3h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-rose-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-rose-700">{description}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Thử lại
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
