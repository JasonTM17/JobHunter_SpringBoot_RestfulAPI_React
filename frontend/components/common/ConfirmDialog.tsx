import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  loading = false,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      widthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={loading}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-700">{message}</p>
    </Modal>
  );
}
