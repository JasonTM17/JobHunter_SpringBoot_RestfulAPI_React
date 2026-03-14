import { Company } from "../../types/models";
import { shortText, stripHtml } from "../../utils/format";
import CompanyLogo from "../common/CompanyLogo";

interface FeaturedEmployerItem {
  company: Company;
  activeJobs: number;
}

interface FeaturedEmployersStripProps {
  items: FeaturedEmployerItem[];
  totalCompanies: number;
}

export default function FeaturedEmployersStrip({ items, totalCompanies }: FeaturedEmployersStripProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Doanh nghiệp tiêu biểu</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Nhà tuyển dụng nổi bật</h2>
          <p className="mt-1 text-sm text-slate-500">Những doanh nghiệp đang tuyển dụng tích cực và đáng chú ý trên hệ thống.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {totalCompanies} công ty
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ company, activeJobs }) => (
          <article
            key={company.id}
            className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <CompanyLogo name={company.name} logo={company.logo} size="md" className="shrink-0" />
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-[15px] font-bold leading-tight text-slate-900">{company.name}</h3>
                  <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">{company.address || "Địa điểm đang cập nhật"}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {activeJobs} vị trí
              </span>
            </div>

            <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-slate-600">
              {shortText(stripHtml(company.description), 96) || "Doanh nghiệp đang cập nhật thêm thông tin giới thiệu."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
