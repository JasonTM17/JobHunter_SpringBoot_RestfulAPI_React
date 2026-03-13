import { FormEvent, useEffect, useState } from "react";
import Modal from "../common/Modal";
import { Company, Job, JobUpsertPayload, Level, Skill } from "../../types/models";
import { toDateInput, toIsoDate } from "../../utils/format";

interface JobFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialJob?: Job | null;
  companies: Company[];
  skills: Skill[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: JobUpsertPayload) => Promise<void>;
}

const LEVELS: Level[] = ["INTERN", "FRESHER", "JUNIOR", "MIDDLE", "SENIOR"];
const LEVEL_LABELS: Record<Level, string> = {
  INTERN: "Thực tập",
  FRESHER: "Mới đi làm",
  JUNIOR: "Junior",
  MIDDLE: "Middle",
  SENIOR: "Senior"
};

interface JobFormState {
  name: string;
  location: string;
  salary: string;
  quantity: string;
  level: Level;
  active: boolean;
  startDate: string;
  endDate: string;
  companyId: string;
  skillIds: number[];
  description: string;
}

function initJobState(job?: Job | null): JobFormState {
  return {
    name: job?.name ?? "",
    location: job?.location ?? "",
    salary: job?.salary ? String(Math.round(job.salary)) : "",
    quantity: job?.quantity ? String(job.quantity) : "1",
    level: (job?.level as Level) ?? "JUNIOR",
    active: typeof job?.active === "boolean" ? job.active : true,
    startDate: toDateInput(job?.startDate),
    endDate: toDateInput(job?.endDate),
    companyId: job?.company?.id ? String(job.company.id) : "",
    skillIds: (job?.skills ?? []).map((item) => item.id),
    description: job?.description ?? ""
  };
}

export default function JobFormModal({
  open,
  mode,
  initialJob,
  companies,
  skills,
  submitting,
  onClose,
  onSubmit
}: JobFormModalProps) {
  const [state, setState] = useState<JobFormState>(initJobState(initialJob));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setState(initJobState(initialJob));
    setError("");
  }, [open, initialJob]);

  function toggleSkill(skillId: number) {
    setState((prev) => {
      const next = prev.skillIds.includes(skillId)
        ? prev.skillIds.filter((id) => id !== skillId)
        : [...prev.skillIds, skillId];
      return { ...prev, skillIds: next };
    });
  }

  function validate(): string | null {
    if (!state.name.trim()) return "Tên công việc là bắt buộc.";
    if (!state.location.trim()) return "Khu vực làm việc là bắt buộc.";
    if (!state.companyId) return "Bạn cần chọn công ty.";

    const salary = Number(state.salary || "0");
    if (salary < 0) return "Mức lương không hợp lệ.";

    const quantity = Number(state.quantity || "0");
    if (quantity <= 0) return "Số lượng phải lớn hơn 0.";

    if (state.startDate && state.endDate && state.startDate > state.endDate) {
      return "Hạn nộp phải sau ngày bắt đầu.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: JobUpsertPayload = {
      id: mode === "edit" ? initialJob?.id : undefined,
      name: state.name.trim(),
      location: state.location.trim().toUpperCase(),
      salary: Number(state.salary || "0"),
      quantity: Number(state.quantity || "0"),
      level: state.level,
      active: state.active,
      startDate: toIsoDate(state.startDate),
      endDate: toIsoDate(state.endDate),
      description: state.description.trim(),
      company: { id: Number(state.companyId) },
      skills: state.skillIds.map((id) => ({ id }))
    };

    await onSubmit(payload);
  }

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo việc làm mới" : "Cập nhật việc làm"}
      onClose={onClose}
      widthClassName="max-w-5xl"
    >
      <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Tên công việc *</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.name}
              onChange={(event) => setState((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ví dụ: Frontend Developer"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Khu vực *</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 uppercase focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.location}
              onChange={(event) => setState((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="HANOI / HOCHIMINH / DANANG / REMOTE"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Mức lương (VND)</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              inputMode="numeric"
              value={state.salary}
              onChange={(event) =>
                setState((prev) => ({ ...prev, salary: event.target.value.replace(/[^\d]/g, "") }))
              }
              placeholder="20000000"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Số lượng *</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              inputMode="numeric"
              value={state.quantity}
              onChange={(event) =>
                setState((prev) => ({ ...prev, quantity: event.target.value.replace(/[^\d]/g, "") }))
              }
              placeholder="1"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Cấp độ</span>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.level}
              onChange={(event) => setState((prev) => ({ ...prev, level: event.target.value as Level }))}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Công ty *</span>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.companyId}
              onChange={(event) => setState((prev) => ({ ...prev, companyId: event.target.value }))}
            >
              <option value="">Chọn công ty</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Ngày bắt đầu</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.startDate}
              onChange={(event) => setState((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Hạn nộp</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.endDate}
              onChange={(event) => setState((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={state.active}
            onChange={(event) => setState((prev) => ({ ...prev, active: event.target.checked }))}
          />
          Đang mở tuyển
        </label>

        <section>
          <h4 className="text-sm font-semibold text-slate-700">Kỹ năng liên quan</h4>
          <div className="mt-2 grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-3">
            {skills.map((skill) => (
              <label key={skill.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={state.skillIds.includes(skill.id)}
                  onChange={() => toggleSkill(skill.id)}
                />
                {skill.name}
              </label>
            ))}
          </div>
        </section>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-700">Mô tả công việc</span>
          <textarea
            rows={8}
            className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            value={state.description}
            onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Nhập mô tả công việc, yêu cầu và quyền lợi..."
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
            {submitting ? "Đang lưu..." : mode === "create" ? "Tạo việc làm" : "Cập nhật"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
