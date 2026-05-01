import type { RefObject } from "react";
import EmptyState from "../common/EmptyState";
import JobCard from "../jobs/JobCard";
import JobFilters from "../jobs/JobFilters";
import JobQuickDetail from "../jobs/JobQuickDetail";
import { Job } from "../../types/models";

const SORT_OPTIONS = [
  { value: "latest", label: "Mới nhất" },
  { value: "salary_desc", label: "Lương cao" },
  { value: "deadline_asc", label: "Deadline gần" }
];

interface JobsBoardProps {
  keyword: string;
  location: string;
  level: string;
  skill: string;
  salaryMin: string;
  salaryMax: string;
  salaryError?: string;
  activeFilterCount: number;
  isFilteringKeyword: boolean;
  locationOptions: string[];
  levelOptions: string[];
  skillOptions: string[];
  jobs: Job[];
  totalItems: number;
  sortMode: string;
  filtersReady?: boolean;
  selectedJobId: number | null;
  selectedJob: Job | null;
  currentPage: number;
  totalPages: number;
  paginationNumbers: number[];
  bookmarkScope?: string;
  bookmarkedJobIds?: number[];
  bookmarkBusyJobIds?: number[];
  isLoading?: boolean;
  jobsSectionRef: RefObject<HTMLElement | null>;
  onKeywordChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onSkillChange: (value: string) => void;
  onSalaryMinChange: (value: string) => void;
  onSalaryMaxChange: (value: string) => void;
  onSortModeChange: (value: string) => void;
  onToggleSavedJob?: (job: Job, nextBookmarked: boolean) => Promise<void> | void;
  onReset: () => void;
  onSelectJob: (jobId: number) => void;
  onCurrentPageChange: (page: number | ((current: number) => number)) => void;
}

export default function JobsBoard({
  keyword,
  location,
  level,
  skill,
  salaryMin,
  salaryMax,
  salaryError,
  activeFilterCount,
  isFilteringKeyword,
  locationOptions,
  levelOptions,
  skillOptions,
  jobs,
  totalItems,
  sortMode,
  filtersReady = true,
  selectedJobId,
  selectedJob,
  currentPage,
  totalPages,
  paginationNumbers,
  bookmarkScope,
  bookmarkedJobIds,
  bookmarkBusyJobIds,
  isLoading,
  jobsSectionRef,
  onKeywordChange,
  onLocationChange,
  onLevelChange,
  onSkillChange,
  onSalaryMinChange,
  onSalaryMaxChange,
  onSortModeChange,
  onToggleSavedJob,
  onReset,
  onSelectJob,
  onCurrentPageChange
}: JobsBoardProps) {
  return (
    <>
      <JobFilters
        keyword={keyword}
        location={location}
        level={level}
        skill={skill}
        salaryMin={salaryMin}
        salaryMax={salaryMax}
        salaryError={salaryError}
        activeFilterCount={activeFilterCount}
        isFiltering={isFilteringKeyword}
        locationOptions={locationOptions}
        levelOptions={levelOptions}
        skillOptions={skillOptions}
        onKeywordChange={onKeywordChange}
        onLocationChange={onLocationChange}
        onLevelChange={onLevelChange}
        onSkillChange={onSkillChange}
        onSalaryMinChange={onSalaryMinChange}
        onSalaryMaxChange={onSalaryMaxChange}
        onReset={onReset}
      />

      <section className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section
          ref={jobsSectionRef}
          id="jobs"
          data-testid="jobs-section"
          className="min-w-0 w-full rounded-lg border border-slate-200 bg-white p-3 shadow-soft sm:p-4"
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2.5">
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Việc làm phù hợp</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {activeFilterCount > 0 ? `Đang áp dụng ${activeFilterCount} bộ lọc` : "Danh sách việc làm mới nhất cho bạn"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <label className="sr-only" htmlFor="jobs-sort-select">
                Sắp xếp việc làm
              </label>
              <select
                id="jobs-sort-select"
                data-testid="jobs-sort-select"
                value={sortMode}
                disabled={!filtersReady}
                onChange={(event) => onSortModeChange(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#b51d1a] focus:ring-2 focus:ring-rose-100"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span
                data-testid="jobs-result-count"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {totalItems} kết quả
              </span>
              {isFilteringKeyword ? <p className="text-[11px] text-slate-500">Đang cập nhật theo từ khóa...</p> : null}
            </div>
          </div>

          <div className="grid gap-2.5">
            {isLoading ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Đang tải danh sách việc làm...
              </div>
            ) : totalItems === 0 ? (
              <EmptyState
                title="Không tìm thấy công việc phù hợp"
                description="Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                actionLabel="Xóa bộ lọc"
                onAction={onReset}
              />
            ) : (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  selected={selectedJobId === job.id}
                  onSelect={onSelectJob}
                  bookmarkScope={bookmarkScope}
                  bookmarked={bookmarkedJobIds?.includes(job.id)}
                  bookmarkBusy={bookmarkBusyJobIds?.includes(job.id)}
                  onBookmarkToggle={onToggleSavedJob}
                />
              ))
            )}
          </div>

          {totalItems > 12 ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Hiển thị trang {currentPage} / {totalPages} ({totalItems} việc làm)
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onCurrentPageChange(1)}
                  disabled={currentPage <= 1}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Trang đầu tiên"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => onCurrentPageChange((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                {paginationNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => onCurrentPageChange(pageNumber)}
                    className={
                      pageNumber === currentPage
                        ? "rounded-md bg-slate-900 px-2.5 py-1 text-xs font-bold text-white"
                        : "rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    }
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onCurrentPageChange((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
                <button
                  type="button"
                  onClick={() => onCurrentPageChange(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Trang cuối cùng"
                >
                  »
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="h-fit min-w-0 w-full xl:sticky xl:top-24 xl:justify-self-end">
          <JobQuickDetail job={selectedJob} />
        </aside>
      </section>
    </>
  );
}
