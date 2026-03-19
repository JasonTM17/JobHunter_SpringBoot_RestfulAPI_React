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
      <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Chi tiết nhanh</p>
            <h2 className="mt-0.5 text-sm font-bold text-slate-900">Chưa chọn việc làm</h2>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
          Chọn một việc làm trong danh sách để xem thông tin tóm tắt nhanh.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center">
          <p className="text-[12px] text-slate-400">Thông tin chi tiết sẽ hiển thị ở đây</p>
        </div>
      </section>
    );
  }

  const companyName = job.company?.name ?? "Đang cập nhật";
  const skillNames = (job.skills ?? []).map((item) => item.name);

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-card">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" />

      <div className="p-4 sm:p-5">
        {/* Header */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">Chi tiết nhanh</p>
        <h2 className="mt-1 min-w-0 text-[15px] font-bold leading-snug text-slate-900 line-clamp-2">{job.name}</h2>

        {/* Company row */}
        <div className="mt-3 flex min-w-0 items-start gap-2.5">
          <CompanyLogo name={companyName} logo={job.company?.logo} size="md" className="shrink-0 ring-1 ring-slate-100" />
          <div className="min-w-0 flex-1">
            <p className="break-words text-[13px] font-semibold text-slate-700">{companyName}</p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{job.company?.address || formatLocationLabel(job.location)}</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <dl className="mt-4 grid grid-cols-2 gap-2">
          {[
            {
              label: "Mức lương",
              value: formatCurrencyVnd(job.salary),
              accent: "text-rose-600 font-extrabold",
              icon: (
                <svg className="h-3.5 w-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            {
              label: "Địa điểm",
              value: formatLocationLabel(job.location),
              accent: "text-slate-800 font-semibold",
              icon: (
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )
            },
            {
              label: "Cấp độ",
              value: formatLevelLabel(job.level),
              accent: "text-slate-800 font-semibold",
              icon: (
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )
            },
            {
              label: "Hạn nộp",
              value: formatDateVi(job.endDate),
              accent: "text-slate-800 font-semibold",
              icon: (
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            }
          ].map((item) => (
            <div key={item.label} className="flex min-h-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <div className="shrink-0">{item.icon}</div>
              <div className="min-w-0 flex-1">
                <dt className="truncate text-[11px] text-slate-400">{item.label}</dt>
                <dd className={`mt-0.5 min-w-0 truncate text-[12px] ${item.accent}`}>{item.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        {/* Description */}
        <p className="mt-4 line-clamp-4 min-w-0 break-words text-[13px] leading-relaxed text-slate-600">
          {shortText(stripHtml(job.description), 180) || "Nhà tuyển dụng đang cập nhật nội dung công việc."}
        </p>

        {/* Skills */}
        <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
          {skillNames.length > 0 ? (
            skillNames.slice(0, 6).map((name) => (
              <span
                key={`${job.id}-${name}`}
                className="max-w-full min-w-0 shrink-0 truncate rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                title={name}
              >
                {name}
              </span>
            ))
          ) : (
            <span className="max-w-full min-w-0 break-words rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
              Chưa cập nhật kỹ năng
            </span>
          )}
        </div>

        {/* CTA buttons */}
        <div className="mt-4 grid min-h-0 grid-cols-2 gap-2">
          <Link
            href={`/jobs/${job.id}`}
            className="flex min-h-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 px-3 py-2.5 text-center text-[12px] font-bold text-white shadow-sm shadow-rose-500/25 transition hover:from-rose-700 hover:to-pink-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Chi tiết
          </Link>
          <Link
            href={`/chatbot?jobId=${job.id}`}
            className="flex min-h-0 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-[12px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-1.1 3 3 0 00-4.133 1.345A8.963 8.963 0 0012 20c4.97 0 9-3.582 9-8 0-4.418-4.03-8-9-8" />
            </svg>
            Hỏi AI
          </Link>
        </div>
      </div>
    </section>
  );
}
