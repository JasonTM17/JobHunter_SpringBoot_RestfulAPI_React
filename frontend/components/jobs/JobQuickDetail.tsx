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

interface JobQuickDetailProps {
  job: Job | null;
}

export default function JobQuickDetail({ job }: JobQuickDetailProps) {
  if (!job) {
    return (
      <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Chi tiết nhanh</p>
        <h2 className="mt-1 text-base font-bold text-slate-900">Chưa chọn việc làm</h2>
        <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
          Chọn một việc làm trong danh sách để xem thông tin tóm tắt nhanh.
        </p>
      </section>
    );
  }

  const companyName = job.company?.name ?? "Đang cập nhật";
  const skillNames = (job.skills ?? []).map((item) => item.name);

  return (
    <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Chi tiết nhanh</p>
      <h2 className="mt-1 min-w-0 text-base font-bold text-slate-900">{job.name}</h2>

      <div className="mt-3 flex min-w-0 items-start gap-2.5">
        <CompanyLogo name={companyName} logo={job.company?.logo} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="break-words text-[13px] font-semibold text-slate-700">{companyName}</p>
          <p className="mt-1 text-[12px] text-slate-500">Xem nhanh thông tin tuyển dụng</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 2xl:grid-cols-1">
        {[
          { label: "Mức lương", value: formatCurrencyVnd(job.salary) },
          { label: "Địa điểm", value: formatLocationLabel(job.location) },
          { label: "Cấp độ", value: formatLevelLabel(job.level) },
          { label: "Hạn nộp", value: formatDateVi(job.endDate) },
        ].map((item) => (
          <div key={item.label} className="min-h-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <dt className="text-[11px] text-slate-500">{item.label}</dt>
            <dd className="mt-0.5 min-w-0 break-words text-[13px] font-semibold text-slate-800">{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 line-clamp-4 min-w-0 break-words text-[13px] leading-5 text-slate-600">
        {shortText(stripHtml(job.description), 180) || "Nhà tuyển dụng đang cập nhật nội dung công việc."}
      </p>

      <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
        {skillNames.length > 0 ? (
          skillNames.slice(0, 6).map((name) => (
            <span
              key={`${job.id}-${name}`}
              className="max-w-full min-w-0 shrink-0 truncate rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
              title={name}
            >
              {name}
            </span>
          ))
        ) : (
          <span className="max-w-full min-w-0 break-words rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
            Chưa cập nhật kỹ năng
          </span>
        )}
      </div>

      <div className="mt-3 grid min-h-0 grid-cols-2 gap-2 2xl:grid-cols-1">
        <Link
          href={`/jobs/${job.id}`}
          className="flex min-h-0 items-center justify-center rounded-xl bg-rose-600 px-3 py-2 text-center text-[12px] font-semibold text-white hover:bg-rose-700"
        >
          Xem chi tiết đầy đủ
        </Link>
        <Link
          href={`/chatbot?jobId=${job.id}`}
          className="flex min-h-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-[12px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          Trao đổi với trợ lý AI
        </Link>
      </div>
    </section>
  );
}
