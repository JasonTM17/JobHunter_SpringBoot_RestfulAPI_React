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
}

const CARD_MIN_WIDTH = 240;
const CARD_GAP = 12;

export default function FeaturedEmployersStrip({ items, totalCompanies }: FeaturedEmployersStripProps) {
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Doanh nghiệp tiêu biểu</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Nhà tuyển dụng nổi bật</h2>
          <p className="mt-1 text-sm text-slate-500">
            Những doanh nghiệp đang tuyển dụng tích cực và đáng chú ý trên hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {totalCompanies} công ty
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label="Cuộn sang trái"
              onClick={() => scrollBy(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* Horizontal scroll rail — always scrolls horizontally, never wraps */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-3 overflow-x-auto pb-1 [scroll-behavior:smooth] [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {items.map(({ company, activeJobs }) => (
          <article
            key={company.id}
            className="flex shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition hover:border-rose-200 hover:bg-white hover:shadow-md"
            style={{ width: CARD_MIN_WIDTH, scrollSnapAlign: "start" }}
          >
            <div className="flex items-start justify-between gap-2">
              <CompanyLogo name={company.name} logo={company.logo} size="md" className="shrink-0" />
              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {activeJobs} vị trí
              </span>
            </div>

            <h3 className="mt-2 line-clamp-2 min-w-0 text-[15px] font-bold leading-tight text-slate-900">
              {company.name}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
              {company.address || "Địa điểm đang cập nhật"}
            </p>

            <p className="mt-3 line-clamp-3 flex-1 text-[13px] leading-5 text-slate-600">
              {shortText(stripHtml(company.description), 96) || "Doanh nghiệp đang cập nhật thêm thông tin giới thiệu."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
