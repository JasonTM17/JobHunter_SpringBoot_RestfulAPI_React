import { FormEvent, useEffect, useState } from "react";
import Modal from "../common/Modal";
import { Skill, SkillUpsertPayload } from "../../types/models";

interface SkillFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialSkill?: Skill | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: SkillUpsertPayload) => Promise<void>;
}

export default function SkillFormModal({
  open,
  mode,
  initialSkill,
  submitting,
  onClose,
  onSubmit
}: SkillFormModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialSkill?.name ?? "");
    setError("");
  }, [open, initialSkill]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Tên kỹ năng là bắt buộc.");
      return;
    }

    setError("");
    await onSubmit({
      id: mode === "edit" ? initialSkill?.id : undefined,
      name: name.trim()
    });
  }

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo kỹ năng mới" : "Cập nhật kỹ năng"}
      onClose={onClose}
      widthClassName="max-w-xl"
    >
      <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-700">Tên kỹ năng *</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: ReactJS, Java, Spring Boot"
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
            disabled={submitting}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang lưu..." : mode === "create" ? "Tạo kỹ năng" : "Cập nhật"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
