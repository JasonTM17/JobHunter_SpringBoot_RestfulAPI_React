import { FormEvent, useMemo } from "react";
import { Skill } from "../../types/models";

interface SubscriberSectionProps {
  email: string;
  name: string;
  selectedSkillIds: number[];
  skills: Skill[];
  submitting: boolean;
  message: string;
  error: string;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onToggleSkill: (skillId: number) => void;
  onSubmit: () => void;
}

export default function SubscriberSection({
  email,
  name,
  selectedSkillIds,
  skills,
  submitting,
  message,
  error,
  onEmailChange,
  onNameChange,
  onToggleSkill,
  onSubmit
}: SubscriberSectionProps) {
  const visibleSkills = useMemo(() => skills.slice(0, 10), [skills]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section id="job-alerts" className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">Job alerts</p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight text-slate-950">
            Nhận gợi ý việc làm theo kỹ năng bạn quan tâm
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Đăng ký email một lần, chọn nhóm kỹ năng chính và Jobhunter sẽ dùng nguồn subscriber hiện có để chuẩn bị
            email gợi ý việc làm phù hợp khi lịch gửi được bật.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Họ tên
              <input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Tên của bạn"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Email
              <input
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@example.com"
                type="email"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </label>
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Kỹ năng quan tâm</p>
            <div className="flex flex-wrap gap-2">
              {visibleSkills.map((skill) => {
                const selected = selectedSkillIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => onToggleSkill(skill.id)}
                    className={
                      selected
                        ? "rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-bold text-[#b51d1a]"
                        : "rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-rose-200 hover:bg-rose-50"
                    }
                  >
                    {skill.name}
                  </button>
                );
              })}
              {!visibleSkills.length ? (
                <span className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">
                  Kỹ năng sẽ hiện khi backend trả dữ liệu.
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-md bg-[#b51d1a] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#951513] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang đăng ký..." : "Đăng ký nhận việc"}
          </button>

          {message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
