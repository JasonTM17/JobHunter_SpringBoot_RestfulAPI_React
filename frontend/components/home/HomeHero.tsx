import { formatLocationLabel } from "../../utils/format";

interface HomeHeroProps {
  activeJobsCountLabel: string;
  keyword: string;
  location: string;
  locationOptions: string[];
  trendingSkillOptions: string[];
  onKeywordChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
  onSelectSkill: (skillName: string) => void;
}

const HERO_FEATURES = [
  { title: "Ứng tuyển bằng CV thật", description: "Tải PDF, DOC hoặc DOCX trực tiếp vào hồ sơ ứng tuyển." },
  { title: "AI tư vấn trước khi nộp", description: "Hỏi nhanh về JD, kỹ năng cần có và cách chuẩn bị phù hợp." },
  { title: "Workspace theo vai trò", description: "Candidate, recruiter và admin có luồng làm việc tách bạch." }
];

export default function HomeHero({
  activeJobsCountLabel,
  keyword,
  location,
  locationOptions,
  trendingSkillOptions,
  onKeywordChange,
  onLocationChange,
  onSearch,
  onSelectSkill
}: HomeHeroProps) {
  return (
    <header className="border-b border-slate-200 bg-[#f7f7f8] text-slate-950">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-5 lg:px-6 lg:py-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <section>
            <p className="inline-flex rounded-md border border-rose-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#b51d1a]">
              IT jobs for serious builders
            </p>
            <h1 className="mt-4 max-w-3xl text-[30px] font-extrabold leading-tight sm:text-[38px] lg:text-[44px]">
              {activeJobsCountLabel} việc làm IT cho developer muốn đi xa hơn
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Tìm kiếm theo kỹ năng, thành phố và cấp độ. Jobhunter ưu tiên thông tin rõ ràng: lương, deadline, công ty và lộ trình ứng tuyển.
            </p>

            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70" data-testid="hero-search-panel">
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_190px_130px]">
                <label className="relative block">
                  <span className="sr-only">Từ khóa tìm việc</span>
                  <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    data-testid="hero-keyword-input"
                    value={keyword}
                    onChange={(event) => onKeywordChange(event.target.value)}
                    placeholder="Nhập vị trí, công ty, kỹ năng..."
                    className="h-12 w-full rounded-md border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </label>
                <label className="relative block">
                  <span className="sr-only">Địa điểm</span>
                  <select
                    data-testid="hero-location-select"
                    value={location}
                    onChange={(event) => onLocationChange(event.target.value)}
                    className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  >
                    <option value="ALL">Tất cả thành phố</option>
                    {locationOptions.map((option) => (
                      <option key={option} value={option}>
                        {formatLocationLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  data-testid="hero-search-button"
                  onClick={onSearch}
                  className="h-12 rounded-md bg-[#b51d1a] px-5 text-sm font-extrabold text-white transition hover:bg-[#951513]"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-700">Đang được tìm nhiều:</span>
              {trendingSkillOptions.map((skillName) => (
                <button
                  key={skillName}
                  type="button"
                  onClick={() => onSelectSkill(skillName)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-[#b51d1a]"
                >
                  {skillName}
                </button>
              ))}
            </div>
          </section>

          <aside className="grid gap-3">
            {HERO_FEATURES.map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-extrabold text-slate-950">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </header>
  );
}
