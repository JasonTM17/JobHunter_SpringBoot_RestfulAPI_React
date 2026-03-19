import { useCallback, useRef, useState } from "react";
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
  onViewAllCompanies?: () => void;
  onSelectCompany?: (company: Company) => void;
}

const CARD_MIN_WIDTH = 240;
const CARD_GAP = 12;

export default function FeaturedEmployersStrip({
  items,
  totalCompanies,
  onViewAllCompanies,
  onSelectCompany
}: FeaturedEmployersStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  function scrollBy(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = CARD_MIN_WIDTH + CARD_GAP;
    const scrollAmount = cardWidth * 3 * direction;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateScrollState, 350);
  }

  if (!items.length) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-card sm:p-4">
      {/* Section header */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-500">Doanh nghiệp tiêu biểu</p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-900">Nhà tuyển dụng nổi bật</h2>
          <p className="mt-1 text-sm text-slate-500">
            Những doanh nghiệp đang tuyển dụng tích cực và đáng chú ý trên hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewAllCompanies ? (
            <button
              type="button"
              onClick={() => onViewAllCompanies()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-rose-300"
              aria-label={`Xem chi tiết ${totalCompanies} công ty`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Xem tất cả {totalCompanies} công ty
            </button>
          ) : null}

          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label="Cuộn sang trái"
              onClick={() => scrollBy(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canScrollLeft}
              data-scroll-btn="left"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Cuộn sang phải"
              onClick={() => scrollBy(1)}
              disabled={!canScrollRight}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              data-scroll-btn="right"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scroll rail */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-3 overflow-x-auto pb-1 [scroll-behavior:smooth] [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {items.map(({ company, activeJobs }) => {
          const cardContent = (
            <>
              {/* Top: logo + jobs badge */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="relative">
                  <CompanyLogo name={company.name} logo={company.logo} size="md" className="shadow-sm" />
                  {/* Active indicator dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {activeJobs}
                  </span>
                  <span className="text-[11px] text-slate-400">vị trí đang tuyển</span>
                </div>
              </div>

              {/* Company name */}
              <h3 className="line-clamp-2 min-w-0 text-[15px] font-bold leading-tight text-slate-900">{company.name}</h3>

              {/* Address */}
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <svg className="h-3 w-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{company.address || "Địa điểm đang cập nhật"}</span>
              </div>

              {/* Description */}
              <p className="mt-2.5 line-clamp-3 flex-1 text-[13px] leading-5 text-slate-500">
                {shortText(stripHtml(company.description), 96) || "Doanh nghiệp đang cập nhật thêm thông tin giới thiệu."}
              </p>

              {/* Bottom CTA */}
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                <span>Xem việc làm</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Gradient bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r from-rose-500 to-pink-500 opacity-0 transition group-hover:opacity-100" />
            </>
          );

          const cardClass =
            "group relative flex shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition-all hover:border-rose-200 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-rose-300 min-w-0";
          const cardStyle = { width: CARD_MIN_WIDTH, scrollSnapAlign: "start" as const };

          if (onSelectCompany) {
            return (
              <button
                key={company.id}
                type="button"
                onClick={() => onSelectCompany(company)}
                className={`cursor-pointer ${cardClass}`}
                style={cardStyle}
                aria-label={`Xem việc làm tại ${company.name}`}
              >
                {cardContent}
              </button>
            );
          }

          return (
            <article key={company.id} className={cardClass} style={cardStyle}>
              {cardContent}
            </article>
          );
        })}
      </div>
    </section>
  );
}
