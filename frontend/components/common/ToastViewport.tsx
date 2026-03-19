import { useEffect, useRef } from "react";

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

const AUTO_DISMISS_MS = 4200;

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return (
      <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg className="h-4 w-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function classByType(type: ToastType): string {
  if (type === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (type === "error") return "border-rose-200 bg-rose-50 text-rose-900";
  return "border-slate-200 bg-white text-slate-800";
}

export default function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    toasts.forEach((toast) => {
      if (!timeoutsRef.current.has(toast.id)) {
        const t = setTimeout(() => {
          onDismiss(toast.id);
          timeoutsRef.current.delete(toast.id);
        }, AUTO_DISMISS_MS);
        timeoutsRef.current.set(toast.id, t);
      }
    });
    const activeIds = new Set(toasts.map((t) => t.id));
    timeoutsRef.current.forEach((t, id) => {
      if (!activeIds.has(id)) {
        clearTimeout(t);
        timeoutsRef.current.delete(id);
      }
    });
  }, [toasts, onDismiss]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(110%); opacity: 0; }
        }
        .toast-enter { animation: slideInRight 0.3s ease-out both; }
        .toast-exit  { animation: slideOutRight 0.25s ease-in forwards; }
      `}</style>
      <section
        className="fixed right-4 top-4 z-[120] grid w-[min(360px,calc(100vw-24px))] gap-2"
        aria-live="polite"
        aria-label="Thông báo"
      >
        {toasts.map((toast) => (
          <article
            key={toast.id}
            role="alert"
            className={`toast-enter rounded-xl border px-3 py-2 shadow-soft ${classByType(toast.type)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <ToastIcon type={toast.type} />
                <p className="text-sm">{toast.message}</p>
              </div>
              <button
                type="button"
                className="rounded p-1 text-xs font-semibold transition hover:bg-black/5"
                onClick={() => onDismiss(toast.id)}
                aria-label="Đóng thông báo"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
