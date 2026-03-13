import { FormEvent, useEffect, useState } from "react";
import Modal from "../common/Modal";
import CompanyLogo from "../common/CompanyLogo";
import { Company, CompanyUpsertPayload } from "../../types/models";

interface CompanyFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialCompany?: Company | null;
  submitting: boolean;
  onClose: () => void;
  onUploadLogo: (file: File) => Promise<string>;
  onSubmit: (payload: CompanyUpsertPayload | Omit<CompanyUpsertPayload, "id">) => Promise<void>;
}

interface CompanyFormState {
  name: string;
  address: string;
  logo: string;
  description: string;
}

function initState(company?: Company | null): CompanyFormState {
  return {
    name: company?.name ?? "",
    address: company?.address ?? "",
    logo: company?.logo ?? "",
    description: company?.description ?? ""
  };
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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setState(initState(initialCompany));
    setUploading(false);
    setError("");
  }, [open, initialCompany]);

  async function handleLogoFile(event: FormEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = await onUploadLogo(file);
      setState((prev) => ({ ...prev, logo: fileName }));
    } catch (uploadError) {
      setError((uploadError as Error).message);
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

        <div className="grid gap-3 md:grid-cols-[auto,1fr]">
          <CompanyLogo name={state.name} logo={state.logo} size="lg" className="mx-auto md:mx-0" />
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
          <span className="font-semibold text-slate-700">Logo (tên file hoặc URL)</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            value={state.logo}
            onChange={(event) => setState((prev) => ({ ...prev, logo: event.target.value }))}
            placeholder="1716687538974-amzon.jpg hoặc https://..."
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-700">Tải logo mới</span>
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => void handleLogoFile(event)}
          />
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
