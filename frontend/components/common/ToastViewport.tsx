export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function classByType(type: ToastType): string {
  if (type === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (type === "error") return "border-rose-200 bg-rose-50 text-rose-900";
  return "border-slate-200 bg-white text-slate-800";
}

export default function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <section className="fixed right-4 top-4 z-[120] grid w-[min(360px,calc(100vw-24px))] gap-2">
      {toasts.map((toast) => (
        <article key={toast.id} className={`rounded-xl border px-3 py-2 shadow-soft ${classByType(toast.type)}`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">{toast.message}</p>
            <button
              type="button"
              className="rounded border border-current/20 px-2 py-0.5 text-xs font-semibold hover:bg-white/50"
              onClick={() => onDismiss(toast.id)}
            >
              Đóng
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
