import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Job } from "../../types/models";
import {
  formatCurrencyVnd,
  formatDateVi,
  formatLevelLabel,
  formatLocationLabel,
  shortText,
  stripHtml
} from "../../utils/format";
import { addBookmark, getBookmarks, removeBookmark } from "../../utils/bookmarks";
import CompanyLogo from "../common/CompanyLogo";

interface JobCardProps {
  job: Job;
  selected: boolean;
  onSelect: (jobId: number) => void;
  bookmarkScope?: string;
  bookmarked?: boolean;
  bookmarkBusy?: boolean;
  onBookmarkToggle?: (job: Job, nextBookmarked: boolean) => Promise<void> | void;
}

export default function JobCard({
  job,
  selected,
  onSelect,
  bookmarkScope,
  bookmarked: controlledBookmarked,
  bookmarkBusy,
  onBookmarkToggle
}: JobCardProps) {
  const router = useRouter();
  const summary = shortText(stripHtml(job.description), 140) || "Nhà tuyển dụng đang cập nhật mô tả chi tiết.";
  const skillNames = (job.skills ?? []).map((skill) => skill.name);

  const isExpiringSoon = job.endDate
    ? new Date(job.endDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  const [localBookmarked, setLocalBookmarked] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const bookmarked = controlledBookmarked ?? localBookmarked;
  const savingBookmark = Boolean(bookmarkBusy || localBusy);

  useEffect(() => {
    if (controlledBookmarked === undefined) {
      setLocalBookmarked(getBookmarks(bookmarkScope).includes(job.id));
    }
  }, [job.id, bookmarkScope, controlledBookmarked]);

  async function toggleBookmark(event: React.MouseEvent) {
    event.stopPropagation();
    if (savingBookmark) return;

    const nextBookmarked = !bookmarked;
    if (onBookmarkToggle) {
      setLocalBusy(true);
      try {
        await onBookmarkToggle(job, nextBookmarked);
      } finally {
        setLocalBusy(false);
      }
      return;
    }

    if (nextBookmarked) {
      addBookmark(job.id, bookmarkScope);
    } else {
      removeBookmark(job.id, bookmarkScope);
    }
    setLocalBookmarked(nextBookmarked);
  }

  function quickApply() {
    void router.push(`/jobs/${job.id}`);
  }

  return (
    <article
      data-testid="job-card"
      data-job-id={job.id}
      className={
        selected
          ? "group relative rounded-lg border-2 border-[#b51d1a] bg-white shadow-card-hover transition"
          : "group relative rounded-lg border border-slate-200 bg-white shadow-card transition hover:border-rose-200 hover:shadow-card-hover"
      }
      aria-label={`${job.name} tại ${job.company?.name ?? "công ty đang cập nhật"}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${selected ? "bg-[#b51d1a]" : "bg-transparent group-hover:bg-rose-300"}`} />

      <div className="flex gap-0">
        <div className="flex w-[70px] shrink-0 flex-col items-center justify-start px-3 pt-4 sm:w-[78px] sm:px-4">
          <CompanyLogo
            name={job.company?.name}
            logo={job.company?.logo}
            size="md"
            className={selected ? "ring-2 ring-rose-300" : ""}
          />
        </div>

        <div className="min-w-0 flex-1 px-2 pb-3 pt-4 sm:px-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-900">{job.name}</h3>
              <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-slate-500">{job.company?.name ?? "Đang cập nhật công ty"}</p>
            </div>
            <div className="salary-badge w-fit max-w-full shrink-0 rounded-md px-2.5 py-1.5 text-left sm:text-right">
              <p className="text-[13px] font-extrabold leading-none">{formatCurrencyVnd(job.salary)}</p>
              <p className="mt-0.5 text-[10px] font-medium opacity-70">/ tháng</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {formatLocationLabel(job.location)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {formatLevelLabel(job.level)}
            </span>
            {isExpiringSoon && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sắp hết hạn
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6V5a3 3 0 016 0v1m-9 0h12a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2zm3 0h6" />
              </svg>
              SL: {job.quantity}
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-slate-600">{summary}</p>

          <div className="mt-2.5 flex min-w-0 flex-1 flex-wrap gap-1.5">
            {skillNames.length > 0 ? (
              skillNames.slice(0, 4).map((skillName) => (
                <span
                  key={`${job.id}-${skillName}`}
                  className="max-w-full truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                  title={skillName}
                >
                  {skillName}
                </span>
              ))
            ) : null}
            {skillNames.length > 4 && (
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                +{skillNames.length - 4}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-col gap-2 border-t border-slate-100 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={isExpiringSoon ? "font-semibold text-amber-600" : ""}>
                Còn {formatDateVi(job.endDate)}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="job-card-bookmark"
                onClick={toggleBookmark}
                disabled={savingBookmark}
                aria-label={bookmarked ? "Bỏ lưu việc làm" : "Lưu việc làm"}
                className="shrink-0 rounded-md p-1.5 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill={bookmarked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button
                type="button"
                data-testid="job-card-quick-view"
                onClick={() => onSelect(job.id)}
                className={
                  selected
                    ? "shrink-0 rounded-md border border-[#b51d1a] bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-[#b51d1a] sm:px-3"
                    : "shrink-0 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-rose-300 hover:text-[#b51d1a] sm:px-3"
                }
              >
                Xem nhanh
              </button>
              <button
                type="button"
                data-testid="job-card-apply"
                onClick={quickApply}
                className={
                  selected
                    ? "shrink-0 rounded-md border border-[#b51d1a] bg-[#b51d1a] px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#8f1515] sm:px-3"
                    : "shrink-0 rounded-md bg-[#b51d1a] px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#8f1515] sm:px-3"
                }
              >
                Ứng tuyển ngay
              </button>
              <Link
                data-testid="job-card-detail"
                href={`/jobs/${job.id}`}
                className={
                  selected
                    ? "shrink-0 rounded-md border border-[#b51d1a] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#b51d1a] transition hover:bg-rose-50 sm:px-3"
                    : "shrink-0 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-[#b51d1a] transition hover:border-rose-400 hover:bg-rose-100 sm:px-3"
                }
              >
                Chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
