import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  widthClassName = "max-w-3xl"
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/60 p-3">
      <section
        className={`w-full ${widthClassName} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            onClick={onClose}
          >
            Đóng
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
        {footer ? <footer className="border-t border-slate-200 bg-slate-50 p-4">{footer}</footer> : null}
      </section>
    </div>
  );
}
