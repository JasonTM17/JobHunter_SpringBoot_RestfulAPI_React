interface AboutSectionProps {
  activeJobsLabel: string;
  companiesLabel: string;
  skillsLabel: string;
}

const ABOUT_HIGHLIGHTS = [
  {
    title: "Minh bạch cho ứng viên",
    description: "Tìm theo vị trí, thành phố, kỹ năng, cấp độ và khoảng lương; xem nhanh công ty trước khi nộp CV."
  },
  {
    title: "Pipeline cho recruiter",
    description: "Theo dõi hồ sơ theo job, đổi trạng thái trong đúng phạm vi công ty và nhìn rõ lịch sử xử lý gần nhất."
  },
  {
    title: "Vận hành chắc tay hơn",
    description: "RBAC, validation, smoke check và dashboard tách vai trò giúp team vận hành ổn định hơn khi mở rộng."
  }
];

export default function AboutSection({
  activeJobsLabel,
  companiesLabel,
  skillsLabel
}: AboutSectionProps) {
  return (
    <section id="about" data-testid="about-section" className="border-y border-slate-200 bg-white px-4 py-8 sm:px-5 lg:px-6">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#b51d1a]">About Jobhunter</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl">
            Jobhunter là nền tảng tuyển dụng IT ưu tiên dữ liệu rõ ràng và quy trình vận hành thực dụng
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Chúng tôi xây Jobhunter để giải quyết một bài toán rất thực tế: ứng viên cần đọc nhanh và so sánh được job,
            recruiter cần quản lý hồ sơ không rối, còn admin cần vận hành hệ thống mà không mất dấu vết dữ liệu.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Phiên bản hiện tại tập trung vào trải nghiệm search-first, job board dễ quét, apply bằng CV thật,
            trạng thái hồ sơ rõ ràng và các workspace riêng cho candidate, recruiter, admin để mỗi vai trò vào đúng việc cần làm ngay.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Viec lam IT dang mo", value: activeJobsLabel },
            { label: "Cong ty trong he thong", value: companiesLabel },
            { label: "Ky nang co the loc", value: skillsLabel },
            { label: "Luong van hanh", value: "3 vai tro" }
          ].map((item) => (
            <article key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-2xl font-extrabold text-slate-950">{item.value}</p>
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
