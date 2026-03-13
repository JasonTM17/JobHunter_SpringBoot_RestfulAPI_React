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
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <h3 className="text-base font-bold text-rose-900">{title}</h3>
      <p className="mt-1 text-sm text-rose-700">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Thử lại
        </button>
      ) : null}
    </section>
  );
}
