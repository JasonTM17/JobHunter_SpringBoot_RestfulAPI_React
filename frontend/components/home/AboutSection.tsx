interface AboutSectionProps {
  activeJobsLabel: string;
  companiesLabel: string;
  skillsLabel: string;
}

const ABOUT_HIGHLIGHTS = [
  {
    title: "Minh bạch cho ứng viên",
    description:
      "Jobhunter ưu tiên thông tin có thể so sánh ngay: mức lương, kỹ năng, địa điểm, cấp độ, hạn tuyển và hồ sơ công ty trước khi ứng tuyển."
  },
  {
    title: "Pipeline rõ cho recruiter",
    description:
      "Nhà tuyển dụng theo dõi hồ sơ theo từng job, đổi trạng thái trong đúng phạm vi công ty và lưu lại ghi chú xử lý để không thất lạc bối cảnh."
  },
  {
    title: "Vận hành an toàn cho admin",
    description:
      "RBAC, guard production, audit, smoke check, visual regression và E2E giúp đội vận hành kiểm soát dữ liệu tốt hơn khi sản phẩm mở rộng."
  }
];

const ABOUT_STATS = [
  {
    label: "Việc làm IT đang mở",
    key: "jobs"
  },
  {
    label: "Công ty trong hệ thống",
    key: "companies"
  },
  {
    label: "Kỹ năng có thể lọc",
    key: "skills"
  },
  {
    label: "Workspace vận hành",
    key: "workspaces"
  }
];

export default function AboutSection({
  activeJobsLabel,
  companiesLabel,
  skillsLabel
}: AboutSectionProps) {
  const statValues: Record<string, string> = {
    jobs: activeJobsLabel,
    companies: companiesLabel,
    skills: skillsLabel,
    workspaces: "3 vai trò"
  };

  return (
    <section id="about" data-testid="about-section" className="border-y border-slate-200 bg-white px-4 py-8 sm:px-5 lg:px-6">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">About Jobhunter</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl">
            Nền tảng tuyển dụng IT tập trung vào tốc độ tìm việc, dữ liệu rõ ràng và vận hành có kiểm soát.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Jobhunter được xây dựng như một production MVP cho thị trường tuyển dụng công nghệ tại Việt Nam. Ứng viên có
            thể tìm việc theo kỹ năng, thành phố, cấp độ và lương; recruiter có pipeline xử lý hồ sơ; admin có công cụ
            quản trị người dùng, công ty, kỹ năng và tin tuyển dụng trong cùng một hệ thống.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Phiên bản hiện tại ưu tiên những năng lực cốt lõi của một sản phẩm thật: search-first job board, apply bằng CV,
            saved jobs theo tài khoản, lịch sử trạng thái hồ sơ, email preference, hardening bảo mật, smoke test, E2E và
            visual regression để giảm rủi ro khi phát hành.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ABOUT_STATS.map((item) => (
            <article key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-2xl font-extrabold text-slate-950">{statValues[item.key]}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {ABOUT_HIGHLIGHTS.map((item) => (
          <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
