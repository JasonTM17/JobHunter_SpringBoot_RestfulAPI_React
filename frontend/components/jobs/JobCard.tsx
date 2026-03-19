import Link from "next/link";
import { Job } from "../../types/models";
import {
  formatCurrencyVnd,
  formatDateVi,
  formatLevelLabel,
  formatLocationLabel,
  shortText,
  stripHtml
} from "../../utils/format";
import CompanyLogo from "../common/CompanyLogo";

interface JobCardProps {
  job: Job;
  selected: boolean;
  onSelect: (jobId: number) => void;
}

export default function JobCard({ job, selected, onSelect }: JobCardProps) {
  const summary = shortText(stripHtml(job.description), 140) || "Nhà tuyển dụng đang cập nhật mô tả chi tiết.";
  const skillNames = (job.skills ?? []).map((skill) => skill.name);

  const isExpiringSoon = job.endDate
    ? new Date(job.endDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <article
      className={
        selected
          ? "group relative cursor-pointer rounded-2xl border-2 border-rose-400 bg-white shadow-card-hover transition-all"
          : "group relative cursor-pointer rounded-2xl border border-slate-200 bg-white shadow-card transition-all hover:border-rose-200 hover:shadow-card-hover"
      }
      onClick={() => onSelect(job.id)}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(job.id);
        }
      }}
    >
      {/* Left accent bar — ITviec style */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${selected ? "bg-gradient-to-b from-rose-500 to-pink-500" : "bg-transparent group-hover:bg-gradient-to-b group-hover:from-rose-400 group-hover:to-pink-400"}`}
      />

      <div className="flex gap-0">
        {/* Logo column */}
        <div className="flex w-[72px] shrink-0 flex-col items-center justify-start px-3 pt-4 sm:w-[80px] sm:px-4">
          <CompanyLogo
            name={job.company?.name}
            logo={job.company?.logo}
            size="md"
            className={selected ? "ring-2 ring-rose-300" : ""}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 px-2 pb-3 pt-4 sm:px-3">
          {/* Row 1: title + salary */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">{job.name}</h3>
              <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-slate-500">{job.company?.name ?? "Đang cập nhật công ty"}</p>
            </div>
            {/* Salary — ITviec style highlight */}
            <div className="salary-badge shrink-0 rounded-xl px-2.5 py-1.5 text-right">
              <p className="text-[13px] font-extrabold leading-none">{formatCurrencyVnd(job.salary)}</p>
              <p className="mt-0.5 text-[10px] font-medium opacity-70">/ tháng</p>
            </div>
          </div>

          {/* Row 2: meta badges */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {formatLocationLabel(job.location)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {formatLevelLabel(job.level)}
            </span>
            {isExpiringSoon && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sắp hết hạn
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a3 3 0 00-5.196V6a3 3 0 00-5.196V4h5" />
              </svg>
              SL: {job.quantity}
            </span>
          </div>

          {/* Row 3: skills */}
          <div className="mt-2.5 flex min-w-0 flex-1 flex-wrap gap-1.5">
            {skillNames.length > 0 ? (
              skillNames.slice(0, 4).map((skillName) => (
                <span
                  key={`${job.id}-${skillName}`}
                  className="max-w-full truncate rounded-full border border-emerald-100 bg-emerald-50/70 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                  title={skillName}
                >
                  {skillName}
                </span>
              ))
            ) : null}
            {skillNames.length > 4 && (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                +{skillNames.length - 4}
              </span>
            )}
          </div>

          {/* Row 4: deadline + action */}
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={isExpiringSoon ? "font-semibold text-amber-600" : ""}>
                Còn {formatDateVi(job.endDate)}
              </span>
            </div>
            <Link
              href={`/jobs/${job.id}`}
              className={
                selected
                  ? "shrink-0 rounded-xl border-2 border-rose-500 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 transition hover:border-rose-600 hover:bg-rose-100"
                  : "shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 transition hover:border-rose-400 hover:bg-rose-100"
              }
              onClick={(event) => event.stopPropagation()}
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
