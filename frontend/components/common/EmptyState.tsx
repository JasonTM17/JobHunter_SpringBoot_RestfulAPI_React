interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center shadow-soft sm:p-6">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3v18M3 12h18" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
