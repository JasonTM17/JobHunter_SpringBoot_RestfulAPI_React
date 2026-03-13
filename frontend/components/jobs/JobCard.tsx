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
  const metaPillClass = "inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700";

  return (
    <article
      className={
        selected
          ? "min-w-0 overflow-hidden rounded-2xl border border-rose-200 bg-white p-2.5 ring-1 ring-rose-100 transition"
          : "min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
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
      <div className="flex items-start gap-2.5">
        <CompanyLogo name={job.company?.name} logo={job.company?.logo} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <div className="min-w-0">
              <h3 className="line-clamp-2 break-words text-[15px] font-bold leading-tight text-slate-900">{job.name}</h3>
              <p className="mt-0.5 line-clamp-1 break-words text-[13px] font-medium text-slate-600">
                {job.company?.name ?? "Đang cập nhật công ty"}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
              {formatCurrencyVnd(job.salary)}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className={metaPillClass}>{formatLocationLabel(job.location)}</span>
            <span className={metaPillClass}>{formatLevelLabel(job.level)}</span>
            <span className={metaPillClass}>SL: {job.quantity}</span>
            <span className={metaPillClass}>Hạn: {formatDateVi(job.endDate)}</span>
          </div>

          <p className="mt-1.5 line-clamp-2 break-words text-[13px] leading-5 text-slate-600">{summary}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {skillNames.length > 0 ? (
            skillNames.slice(0, 4).map((skillName) => (
              <span
                key={`${job.id}-${skillName}`}
                className="max-w-full truncate rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                title={skillName}
              >
                {skillName}
              </span>
            ))
          ) : (
            <span className="max-w-full rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
              Chưa cập nhật kỹ năng
            </span>
          )}
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          onClick={(event) => event.stopPropagation()}
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}
