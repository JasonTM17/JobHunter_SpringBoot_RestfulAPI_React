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
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-base font-bold text-slate-900">Chi tiết nhanh</h2>
        <p className="mt-2 text-sm text-slate-500">Chọn một việc làm trong danh sách để xem thông tin tóm tắt.</p>
      </section>
    );
  }

  const companyName = job.company?.name ?? "Đang cập nhật";
  const skillNames = (job.skills ?? []).map((item) => item.name);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="text-base font-bold text-slate-900">Chi tiết nhanh</h2>
      <div className="mt-3 flex items-start gap-3">
        <CompanyLogo name={companyName} logo={job.company?.logo} size="lg" />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-slate-900">{job.name}</h3>
          <p className="mt-1 text-sm font-medium text-slate-600">{companyName}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
          <dt className="text-xs text-slate-500">Mức lương</dt>
          <dd className="font-semibold text-slate-800">{formatCurrencyVnd(job.salary)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
          <dt className="text-xs text-slate-500">Địa điểm</dt>
          <dd className="font-semibold text-slate-800">{formatLocationLabel(job.location)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
          <dt className="text-xs text-slate-500">Cấp độ</dt>
          <dd className="font-semibold text-slate-800">{formatLevelLabel(job.level)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
          <dt className="text-xs text-slate-500">Hạn nộp</dt>
          <dd className="font-semibold text-slate-800">{formatDateVi(job.endDate)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm text-slate-600">
        {shortText(stripHtml(job.description), 220) || "Nhà tuyển dụng đang cập nhật nội dung công việc."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {skillNames.length > 0 ? (
          skillNames.map((name) => (
            <span
              key={`${job.id}-${name}`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
            >
              {name}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
            Chưa cập nhật kỹ năng
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          href={`/jobs/${job.id}`}
          className="rounded-xl bg-rose-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-rose-700"
        >
          Xem chi tiết đầy đủ
        </Link>
        <Link
          href={`/chatbot?jobId=${job.id}`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Trao đổi với trợ lý AI
        </Link>
      </div>
    </section>
  );
}
