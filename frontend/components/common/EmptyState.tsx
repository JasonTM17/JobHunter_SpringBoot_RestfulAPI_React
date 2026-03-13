interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-200 text-slate-700">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3v18M3 12h18" />
        </svg>
      </div>
      <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
