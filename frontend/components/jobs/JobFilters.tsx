import { ChangeEvent } from "react";
import { formatLevelLabel, formatLocationLabel } from "../../utils/format";

interface JobFiltersProps {
  keyword: string;
  location: string;
  level: string;
  skill: string;
  salaryMin: string;
  salaryMax: string;
  activeFilterCount: number;
  isFiltering: boolean;
  locationOptions: string[];
  levelOptions: string[];
  skillOptions: string[];
  onKeywordChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onSkillChange: (value: string) => void;
  onSalaryMinChange: (value: string) => void;
  onSalaryMaxChange: (value: string) => void;
  onReset: () => void;
}

function numericOnly(event: ChangeEvent<HTMLInputElement>): string {
  return event.target.value.replace(/[^\d]/g, "");
}

export default function JobFilters({
  keyword,
  location,
  level,
  skill,
  salaryMin,
  salaryMax,
  activeFilterCount,
  isFiltering,
  locationOptions,
  levelOptions,
  skillOptions,
  onKeywordChange,
  onLocationChange,
  onLevelChange,
  onSkillChange,
  onSalaryMinChange,
  onSalaryMaxChange,
  onReset
}: JobFiltersProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Bộ lọc việc làm</h2>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">
            {activeFilterCount > 0 ? `Đang dùng ${activeFilterCount} bộ lọc` : "Chưa áp dụng bộ lọc"}
          </p>
          {isFiltering ? <p className="text-xs font-semibold text-slate-600">Đang cập nhật...</p> : null}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
        <input
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 xl:col-span-2"
          placeholder="Tìm theo vị trí, công ty, kỹ năng..."
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />

        <select
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
        >
          <option value="ALL">Tất cả khu vực</option>
          {locationOptions.map((option) => (
            <option key={option} value={option}>
              {formatLocationLabel(option)}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          value={level}
          onChange={(event) => onLevelChange(event.target.value)}
        >
          <option value="ALL">Tất cả cấp độ</option>
          {levelOptions.map((option) => (
            <option key={option} value={option}>
              {formatLevelLabel(option)}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          value={skill}
          onChange={(event) => onSkillChange(event.target.value)}
        >
          <option value="ALL">Tất cả kỹ năng</option>
          {skillOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Lương từ"
            value={salaryMin}
            onChange={(event) => onSalaryMinChange(numericOnly(event))}
          />
          <input
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Lương đến"
            value={salaryMax}
            onChange={(event) => onSalaryMaxChange(numericOnly(event))}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onReset}
          disabled={activeFilterCount === 0}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Xóa bộ lọc
        </button>
      </div>
    </section>
  );
}
