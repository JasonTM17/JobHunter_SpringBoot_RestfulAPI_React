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
  const controlClassName =
    "min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-700 transition focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card sm:p-4">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-3 pt-3 sm:mb-3 sm:px-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Bộ lọc việc làm</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {activeFilterCount > 0 ? `${activeFilterCount} bộ lọc đang áp dụng` : "Tìm kiếm chính xác hơn"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {isFiltering ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tìm...
            </span>
          ) : null}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-100"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Xóa {activeFilterCount}
            </button>
          )}
        </div>
      </div>

      {/* Keyword search — ITviec-style search bar */}
      <div className="mb-3 px-3 sm:mb-3 sm:px-0">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-[13px] text-slate-700 placeholder-slate-400 transition focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 sm:text-[14px]"
            placeholder="Tìm theo vị trí, công ty, kỹ năng..."
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          {keyword ? (
            <button
              type="button"
              onClick={() => onKeywordChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown row */}
      <div className="flex flex-wrap gap-2 px-3 sm:px-0">
        <select
          className={controlClassName}
          style={{ minWidth: "140px", flex: "1 1 140px" }}
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
        >
          <option value="ALL">Toàn quốc</option>
          {locationOptions.map((option) => (
            <option key={option} value={option}>
              {formatLocationLabel(option)}
            </option>
          ))}
        </select>

        <select
          className={controlClassName}
          style={{ minWidth: "140px", flex: "1 1 140px" }}
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
          className={controlClassName}
          style={{ minWidth: "140px", flex: "2 2 200px" }}
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
      </div>

      {/* Salary range */}
      <div className="mt-2 flex flex-wrap gap-2 px-3 pb-3 sm:px-0 sm:pb-0">
        <div className="relative" style={{ minWidth: "120px", flex: "1 1 120px" }}>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-12 text-[13px] text-slate-700 placeholder-slate-400 transition focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
            placeholder="Lương từ"
            value={salaryMin}
            inputMode="numeric"
            onChange={(event) => onSalaryMinChange(numericOnly(event))}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">VNĐ</span>
        </div>
        <div className="relative" style={{ minWidth: "120px", flex: "1 1 120px" }}>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-12 text-[13px] text-slate-700 placeholder-slate-400 transition focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
            placeholder="Lương đến"
            value={salaryMax}
            inputMode="numeric"
            onChange={(event) => onSalaryMaxChange(numericOnly(event))}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">VNĐ</span>
        </div>
      </div>
    </section>
  );
}
