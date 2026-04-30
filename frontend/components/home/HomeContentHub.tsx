import type { RefObject } from "react";
import Link from "next/link";
import CompanyLogo from "../common/CompanyLogo";
import EmptyState from "../common/EmptyState";
import { Company } from "../../types/models";

interface CampaignTile {
  title: string;
  description: string;
  action: string;
  href: string;
}

interface FeaturedArticle {
  label: string;
  title: string;
  description: string;
  keyword: string;
}

interface ExpertiseGroup {
  title: string;
  skills: string[];
  focus: string;
}

interface RankedCompany {
  company: Company;
  activeJobs: number;
}

interface HubCityOption {
  label: string;
  value: string;
}

interface HomeContentHubProps {
  campaignTiles: CampaignTile[];
  featuredArticles: FeaturedArticle[];
  expertiseGroups: ExpertiseGroup[];
  rankedCompanies: RankedCompany[];
  secondaryCompanies: RankedCompany[];
  hubSkillOptions: string[];
  hubCityOptions: HubCityOption[];
  companiesCount: number;
  secondaryScrollLeft: boolean;
  secondaryScrollRight: boolean;
  companiesSectionRef: RefObject<HTMLElement | null>;
  secondaryCompaniesScrollRef: RefObject<HTMLDivElement | null>;
  onResetFilters: () => void;
  onApplySkillFilter: (skillName: string) => void;
  onApplyKeywordFilter: (keyword: string) => void;
  onApplyCityFilter: (city: string) => void;
  onSelectCompany: (company: Company) => void;
  onViewAllCompanies: () => void;
  onScrollSecondaryBy: (direction: 1 | -1) => void;
  onUpdateSecondaryScrollState: () => void;
}

export default function HomeContentHub({
  campaignTiles,
  featuredArticles,
  expertiseGroups,
  rankedCompanies,
  secondaryCompanies,
  hubSkillOptions,
  hubCityOptions,
  companiesCount,
  secondaryScrollLeft,
  secondaryScrollRight,
  companiesSectionRef,
  secondaryCompaniesScrollRef,
  onResetFilters,
  onApplySkillFilter,
  onApplyKeywordFilter,
  onApplyCityFilter,
  onSelectCompany,
  onViewAllCompanies,
  onScrollSecondaryBy,
  onUpdateSecondaryScrollState
}: HomeContentHubProps) {
  return (
    <>
      <section className="grid gap-3 md:grid-cols-3" aria-label="Jobhunter campaigns">
        {campaignTiles.map((item) => (
          <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">Jobhunter</p>
            <h2 className="mt-2 text-base font-extrabold text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <Link
              href={item.href}
              className="mt-4 inline-flex rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-[#b51d1a] hover:bg-rose-100"
            >
              {item.action}
            </Link>
          </article>
        ))}
      </section>

      <section id="it-expertise" className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">IT Expertise Summary</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">Nhóm kỹ năng đang được tuyển nhiều</h2>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Xóa bộ lọc
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {expertiseGroups.map((group) => (
            <article key={group.title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">{group.title}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.focus}</p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-[#b51d1a]">
                  {group.skills.length} skills
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.skills.map((skillName) => (
                  <button
                    key={`${group.title}-${skillName}`}
                    type="button"
                    onClick={() => onApplySkillFilter(skillName)}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-rose-200 hover:text-[#b51d1a]"
                  >
                    {skillName}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="career-resources" className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">Featured Articles & Reports</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">Career hub cho developer và recruiter</h2>
          </div>
          <Link href="/chatbot" className="rounded-md bg-[#b51d1a] px-3 py-2 text-xs font-bold text-white hover:bg-[#951513]">
            Hỏi trợ lý AI
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {featuredArticles.map((article) => (
            <button
              key={article.title}
              type="button"
              onClick={() => onApplyKeywordFilter(article.keyword)}
              className="rounded-md border border-slate-200 bg-slate-50 p-4 text-left hover:border-rose-200 hover:bg-rose-50/40"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{article.label}</p>
              <h3 className="mt-2 text-base font-extrabold leading-snug text-slate-950">{article.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{article.description}</p>
            </button>
          ))}
        </div>
      </section>

      {rankedCompanies.length > 0 ? (
        <section
          id="companies"
          ref={companiesSectionRef}
          className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4"
          aria-labelledby="companies-heading"
        >
          <h2 id="companies-heading" className="sr-only">
            Tất cả doanh nghiệp
          </h2>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                Xem chi tiết từng doanh nghiệp
              </p>
              <h3 className="mt-1 text-base font-bold text-slate-900">Tất cả {companiesCount} công ty</h3>
              <p className="mt-1 text-sm text-slate-500">
                Bấm vào công ty để xem việc làm đang tuyển của công ty đó.
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAllCompanies}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Xem tất cả
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rankedCompanies.map(({ company, activeJobs }) => (
              <button
                key={company.id}
                type="button"
                onClick={() => onSelectCompany(company)}
                className="flex items-start gap-2.5 rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <CompanyLogo name={company.name} logo={company.logo} size="sm" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="line-clamp-2 text-sm font-semibold text-slate-800">{company.name}</h4>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {activeJobs} vị trí
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                    {company.address || "Đang cập nhật địa chỉ"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
          <EmptyState
            title="Chưa có doanh nghiệp nào"
            description="Hệ thống hiện chưa có doanh nghiệp nào. Hãy quay lại sau."
          />
        </section>
      )}

      {secondaryCompanies.length ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Mở rộng hệ sinh thái tuyển dụng
              </p>
              <h2 className="mt-1 text-base font-bold text-slate-900">Khám phá thêm doanh nghiệp</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ngoài nhóm nổi bật phía trên, đây là những doanh nghiệp cũng đang tuyển dụng tích cực.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {secondaryCompanies.length} công ty
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label="Cuộn sang trái"
                  onClick={() => onScrollSecondaryBy(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!secondaryScrollLeft}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Cuộn sang phải"
                  onClick={() => onScrollSecondaryBy(1)}
                  disabled={!secondaryScrollRight}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div
            ref={secondaryCompaniesScrollRef}
            onScroll={onUpdateSecondaryScrollState}
            className="flex gap-2.5 overflow-x-auto pb-1 scroll-snap-x scroll-snap-mandatory [scroll-behavior:smooth] [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.300)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
          >
            {secondaryCompanies.map(({ company, activeJobs }) => (
              <button
                key={company.id}
                type="button"
                onClick={() => onSelectCompany(company)}
                className="min-w-[220px] shrink-0 snap-start rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <div className="flex items-start gap-2.5">
                  <CompanyLogo name={company.name} logo={company.logo} size="sm" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-800">{company.name}</h3>
                      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {activeJobs} vị trí
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                      {company.address || "Đang cập nhật địa chỉ"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <article id="jobs-by-skill" className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">Jobs by Skill</p>
          <h2 className="mt-1 text-base font-extrabold text-slate-950">Kỹ năng phổ biến</h2>
          <div className="mt-3 grid gap-2">
            {hubSkillOptions.map((skillName) => (
              <button
                key={`hub-skill-${skillName}`}
                type="button"
                onClick={() => onApplySkillFilter(skillName)}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-800 hover:border-rose-200 hover:bg-rose-50 hover:text-[#b51d1a]"
              >
                <span>{skillName}</span>
                <span className="text-xs text-slate-400">View jobs</span>
              </button>
            ))}
          </div>
        </article>

        <article id="jobs-by-city" className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">Jobs by City</p>
          <h2 className="mt-1 text-base font-extrabold text-slate-950">Thanh pho tuyen dung</h2>
          <div className="mt-3 grid gap-2">
            {hubCityOptions.map((city) => (
              <button
                key={`hub-city-${city.value}`}
                type="button"
                onClick={() => onApplyCityFilter(city.value)}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-800 hover:border-rose-200 hover:bg-rose-50 hover:text-[#b51d1a]"
              >
                <span>{city.label}</span>
                <span className="text-xs text-slate-400">Filter</span>
              </button>
            ))}
          </div>
        </article>

        <article id="jobs-by-company" className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">Jobs by Company</p>
          <h2 className="mt-1 text-base font-extrabold text-slate-950">Công ty đang nổi bật</h2>
          <div className="mt-3 grid gap-2">
            {rankedCompanies.slice(0, 10).map(({ company, activeJobs }) => (
              <button
                key={`hub-company-${company.id}`}
                type="button"
                onClick={() => onSelectCompany(company)}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-bold text-slate-800 hover:border-rose-200 hover:bg-rose-50 hover:text-[#b51d1a]"
              >
                <span className="line-clamp-1">{company.name}</span>
                <span className="shrink-0 text-xs text-slate-400">{activeJobs} jobs</span>
              </button>
            ))}
            {!rankedCompanies.length ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                Danh sách công ty sẽ hiển thị khi backend trả dữ liệu.
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </>
  );
}
