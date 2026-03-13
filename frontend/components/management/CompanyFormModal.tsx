import { FormEvent, useEffect, useState } from "react";
import Modal from "../common/Modal";
import CompanyLogo from "../common/CompanyLogo";
import { Company, CompanyUpsertPayload, UploadFileResponse } from "../../types/models";
import { toUserErrorMessage } from "../../utils/error-message";

interface CompanyFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialCompany?: Company | null;
  submitting: boolean;
  onClose: () => void;
  onUploadLogo: (file: File) => Promise<UploadFileResponse>;
  onSubmit: (payload: CompanyUpsertPayload | Omit<CompanyUpsertPayload, "id">) => Promise<void>;
}

interface CompanyFormState {
  name: string;
  address: string;
  logo: string;
  description: string;
}

const MAX_LOGO_SIZE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function initState(company?: Company | null): CompanyFormState {
  return {
    name: company?.name ?? "",
    address: company?.address ?? "",
    logo: company?.logo ?? "",
    description: company?.description ?? ""
  };
}

function validateLocalImage(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return "Chỉ hỗ trợ ảnh PNG, JPG, WEBP hoặc GIF.";
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return "Ảnh logo vượt quá 3MB. Vui lòng chọn ảnh nhỏ hơn.";
  }
  return null;
}

export default function CompanyFormModal({
  open,
  mode,
  initialCompany,
  submitting,
  onClose,
  onUploadLogo,
  onSubmit
}: CompanyFormModalProps) {
  const [state, setState] = useState<CompanyFormState>(initState(initialCompany));
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setState(initState(initialCompany));
    setUploading(false);
    setError("");
    setUploadInfo("");
    setPreviewUrl("");
  }, [open, initialCompany]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleLogoFile(event: FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const invalidFileMessage = validateLocalImage(file);
    if (invalidFileMessage) {
      setError(invalidFileMessage);
      target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setUploading(true);
    setError("");
    setUploadInfo("");
    try {
      const result = await onUploadLogo(file);
      setState((prev) => ({ ...prev, logo: result.fileUrl || result.fileName }));
      setUploadInfo("Tải logo thành công. Bạn có thể lưu công ty để áp dụng.");
    } catch (uploadError) {
      setError(toUserErrorMessage(uploadError, "Không thể tải logo lên lúc này."));
      setPreviewUrl("");
    } finally {
      setUploading(false);
      target.value = "";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state.name.trim()) {
      setError("Tên công ty là bắt buộc.");
      return;
    }

    setError("");
    if (mode === "create") {
      await onSubmit({
        name: state.name.trim(),
        address: state.address.trim(),
        description: state.description.trim(),
        logo: state.logo.trim()
      });
      return;
    }

    await onSubmit({
      id: initialCompany?.id ?? 0,
      name: state.name.trim(),
      address: state.address.trim(),
      description: state.description.trim(),
      logo: state.logo.trim()
    });
  }

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo công ty mới" : "Cập nhật công ty"}
      onClose={onClose}
      widthClassName="max-w-3xl"
    >
      <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}
        {uploadInfo ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{uploadInfo}</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-[auto,1fr]">
          <CompanyLogo name={state.name} logo={previewUrl || state.logo} size="lg" className="mx-auto md:mx-0" />
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Tên công ty *</span>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                value={state.name}
                onChange={(event) => setState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ví dụ: FPT Software"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Địa chỉ</span>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                value={state.address}
                onChange={(event) => setState((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="Hà Nội / TP.HCM / Đà Nẵng / Remote"
              />
            </label>
          </div>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-700">Logo (URL hoặc đường dẫn)</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            value={state.logo}
            onChange={(event) => setState((prev) => ({ ...prev, logo: event.target.value }))}
            placeholder="/storage/company/logo.png hoặc https://..."
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-700">Tải logo mới</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => void handleLogoFile(event)}
          />
          <span className="text-xs text-slate-500">
            Dung lượng tối đa 3MB. Ảnh được lưu thật vào storage và hiển thị lại ngay sau khi tải xong.
          </span>
          {uploading ? <span className="text-xs text-slate-500">Đang tải logo...</span> : null}
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-700">Mô tả</span>
          <textarea
            rows={5}
            className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            value={state.description}
            onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="<p>Mô tả công ty...</p>"
          />
        </label>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang lưu..." : mode === "create" ? "Tạo công ty" : "Cập nhật"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
