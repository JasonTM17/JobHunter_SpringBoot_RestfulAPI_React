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
  const summary = shortText(stripHtml(job.description), 120) || "Nhà tuyển dụng đang cập nhật mô tả chi tiết.";
  const skillNames = (job.skills ?? []).map((skill) => skill.name);

  return (
    <article
      className={
        selected
          ? "rounded-2xl border border-slate-300 bg-slate-50 p-4 ring-1 ring-slate-200 transition"
          : "rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
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
      <div className="flex items-start gap-3">
        <CompanyLogo name={job.company?.name} logo={job.company?.logo} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-tight text-slate-900">{job.name}</h3>
          <p className="mt-1 text-sm font-medium text-slate-600">{job.company?.name ?? "Đang cập nhật công ty"}</p>
          <p className="mt-2 text-sm text-slate-700">
            <strong>{formatCurrencyVnd(job.salary)}</strong> • {formatLocationLabel(job.location)} • {formatLevelLabel(job.level)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Số lượng: {job.quantity} • Hạn nộp: {formatDateVi(job.endDate)}
          </p>
          <p className="mt-2 text-sm text-slate-500">{summary}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skillNames.length > 0 ? (
              skillNames.slice(0, 4).map((skillName) => (
                <span
                  key={`${job.id}-${skillName}`}
                  className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                >
                  {skillName}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-500">
                Chưa cập nhật kỹ năng
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href={`/jobs/${job.id}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          onClick={(event) => event.stopPropagation()}
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}
