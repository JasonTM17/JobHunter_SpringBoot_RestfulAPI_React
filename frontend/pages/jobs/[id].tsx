import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import CompanyLogo from "../../components/common/CompanyLogo";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { useAuth } from "../../contexts/auth-context";
import { createResumeWithAuth } from "../../services/auth-rbac-api";
import { fetchJobDetail } from "../../services/jobhunter-api";
import { Job } from "../../types/models";
import { toUserErrorMessage } from "../../utils/error-message";
import {
  formatCurrencyVnd,
  formatDateVi,
  formatLevelLabel,
  formatLocationLabel,
  sanitizeRichText,
  splitDescriptionSections
} from "../../utils/format";

export default function JobDetailPage() {
  const router = useRouter();
  const { status: authStatus, currentUser, can } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  const jobId = useMemo(() => {
    const raw = router.query.id;
    if (!raw) return null;
    const id = Number(Array.isArray(raw) ? raw[0] : raw);
    return Number.isNaN(id) ? null : id;
  }, [router.query.id]);
  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent(router.asPath || "/")}`,
    [router.asPath]
  );

  async function loadJob() {
    if (!jobId) {
      setError("ID công việc không hợp lệ.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchJobDetail(jobId);
      setJob(data);
    } catch (loadError) {
      setError(toUserErrorMessage(loadError, "Không thể tải chi tiết công việc lúc này."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!router.isReady) return;
    void loadJob();
  }, [router.isReady, jobId]);

  useEffect(() => {
    setCvUrl("");
    setApplyError("");
    setApplySuccess("");
  }, [job?.id]);

  async function applyForJob() {
    if (!job) return;

    if (!currentUser) {
      setApplySuccess("");
      setApplyError("Bạn cần đăng nhập để ứng tuyển.");
      return;
    }

    if (!can("/api/v1/resumes", "POST")) {
      setApplySuccess("");
      setApplyError("Tài khoản hiện tại chưa có quyền gửi hồ sơ ứng tuyển.");
      return;
    }

    const cleanUrl = cvUrl.trim();
    if (!cleanUrl) {
      setApplySuccess("");
      setApplyError("Vui lòng nhập URL CV trước khi ứng tuyển.");
      return;
    }
    try {
      const parsed = new URL(cleanUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setApplySuccess("");
        setApplyError("URL CV phải bắt đầu bằng http:// hoặc https://.");
        return;
      }
    } catch {
      setApplySuccess("");
      setApplyError("URL CV chưa đúng định dạng.");
      return;
    }

    setApplying(true);
    setApplyError("");
    setApplySuccess("");
    try {
      await createResumeWithAuth({
        email: currentUser.email,
        url: cleanUrl,
        status: "PENDING",
        user: { id: currentUser.id },
        job: { id: job.id }
      });
      setApplySuccess("Đã gửi hồ sơ ứng tuyển thành công.");
      setCvUrl("");
    } catch (submitError) {
      setApplyError(toUserErrorMessage(submitError, "Không thể gửi hồ sơ ứng tuyển lúc này."));
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
        <LoadingState title="Đang tải chi tiết công việc..." rows={5} />
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="mx-auto min-h-screen max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
        <ErrorState description={error || "Không tìm thấy dữ liệu công việc."} onRetry={() => void loadJob()} />
        <div className="mt-3">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Quay lại danh sách
          </Link>
        </div>
      </main>
    );
  }

  const sections = splitDescriptionSections(job.description);
  const safeDescription = sanitizeRichText(sections.description);
  const safeRequirements = sanitizeRichText(sections.requirements);
  const safeBenefits = sanitizeRichText(sections.benefits);
  const skillNames = (job.skills ?? []).map((item) => item.name);
  const companyName = job.company?.name ?? "Đang cập nhật";
  const companyAddress = job.company?.address || formatLocationLabel(job.location);
  const heroMetaItems = [
    formatLocationLabel(job.location),
    formatLevelLabel(job.level),
    `${job.quantity} vị trí`,
    `Hạn nộp ${formatDateVi(job.endDate)}`
  ];
  const quickInfoItems = [
    { label: "Mức lương", value: formatCurrencyVnd(job.salary) },
    { label: "Cấp độ", value: formatLevelLabel(job.level) },
    { label: "Số lượng", value: `${job.quantity} vị trí` },
    { label: "Hạn nộp", value: formatDateVi(job.endDate) }
  ];

  return (
    <main className="mx-auto min-h-screen max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
      <header className="relative overflow-hidden rounded-[28px] border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-soft sm:p-6 lg:p-7">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />

        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-100 backdrop-blur transition hover:bg-white/20"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại danh sách việc làm
        </Link>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0">
            {/* Eyebrow */}
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
              Đang tuyển dụng
            </div>

            <div className="flex items-start gap-4">
              <CompanyLogo
                name={job.company?.name}
                logo={job.company?.logo}
                size="lg"
                className="border-white/20 bg-white/95 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Chi tiết tuyển dụng</p>
                <h1 className="mt-1.5 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">{job.name}</h1>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  {companyName}
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  <span className="text-xs text-slate-300">{companyAddress}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {heroMetaItems.map((item) => (
                    <span
                      key={`${job.id}-${item}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                {skillNames.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skillNames.slice(0, 8).map((name) => (
                      <span
                        key={`${job.id}-hero-${name}`}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Salary card — ITviec highlight */}
          <div className="relative grid gap-2.5 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Mức lương</p>
              <p className="mt-2 break-words text-[28px] font-extrabold leading-none tracking-tight text-white">
                {formatCurrencyVnd(job.salary)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">/ tháng</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold text-white">{formatLocationLabel(job.location)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-white">Còn {formatDateVi(job.endDate)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a3 3 0 00-5.196V6a3 3 0 00-5.196V4h5" />
                </svg>
                <span className="text-sm font-semibold text-white">{job.quantity} vị trí</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_360px] xl:gap-5">
        <article className="grid gap-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Tổng quan
              </span>
              <h2 className="text-lg font-bold text-slate-900">Mô tả công việc</h2>
            </div>
            {safeDescription ? (
              <div className="job-richtext mt-4 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: safeDescription }} />
            ) : (
              <p className="mt-4 text-sm text-slate-500">Đang cập nhật mô tả.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                Phù hợp nếu
              </span>
              <h2 className="text-lg font-bold text-slate-900">Yêu cầu</h2>
            </div>
            {safeRequirements ? (
              <div className="job-richtext mt-4 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: safeRequirements }} />
            ) : (
              <p className="mt-4 text-sm text-slate-500">Đang cập nhật yêu cầu.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Giá trị nhận được
              </span>
              <h2 className="text-lg font-bold text-slate-900">Quyền lợi</h2>
            </div>
            {safeBenefits ? (
              <div className="job-richtext mt-4 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: safeBenefits }} />
            ) : (
              <p className="mt-4 text-sm text-slate-500">Đang cập nhật quyền lợi.</p>
            )}
          </section>
        </article>

        <aside className="grid content-start gap-3 xl:sticky xl:top-24">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <CompanyLogo name={companyName} logo={job.company?.logo} size="md" className="shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Doanh nghiệp tuyển dụng</p>
                <h2 className="mt-1 text-base font-bold text-slate-900">{companyName}</h2>
                <p className="mt-1 text-sm text-slate-500">{companyAddress}</p>
              </div>
            </div>

            <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {quickInfoItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <dt className="text-[11px] text-slate-500">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Kỹ năng liên quan</h2>
                <p className="mt-1 text-sm text-slate-500">Các năng lực được nhắc trực tiếp trong mô tả tuyển dụng.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {skillNames.length}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {skillNames.length > 0 ? (
                skillNames.map((name) => (
                  <span
                    key={`${job.id}-${name}`}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">Đang cập nhật.</span>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-rose-200 bg-gradient-to-b from-white to-rose-50/60 p-4 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">Sẵn sàng ứng tuyển</p>
            <h2 className="mt-1 text-base font-bold text-slate-900">Hành động</h2>
            <p className="mt-1 text-sm text-slate-500">Trao đổi với AI hoặc gửi ngay CV thật của bạn khi đã sẵn sàng.</p>

            <div className="mt-4 grid gap-2.5">
              <Link
                href={`/chatbot?jobId=${job.id}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-center text-sm font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-1.1 3 3 0 00-4.133 1.345A8.963 8.963 0 0012 20c4.97 0 9-3.582 9-8 0-4.418-4.03-8-9-8" />
                </svg>
                Tư vấn cùng AI trước khi ứng tuyển
              </Link>

              {authStatus !== "authenticated" ? (
                <div className="grid gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
                  <p>Bạn cần đăng nhập để gửi hồ sơ ứng tuyển.</p>
                  <Link
                    href={loginHref}
                    className="inline-flex w-fit rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : !can("/api/v1/resumes", "POST") ? (
                <p className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600">
                  Tài khoản hiện tại chưa được cấp quyền gửi hồ sơ ứng tuyển.
                </p>
              ) : (
                <form
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void applyForJob();
                  }}
                >
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Dán liên kết CV dạng http/https để gửi trực tiếp vào tin tuyển dụng này.
                  </div>
                  <label className="grid gap-1.5 text-xs text-slate-600">
                    URL CV của bạn
                    <input
                      value={cvUrl}
                      onChange={(event) => setCvUrl(event.target.value)}
                      placeholder="https://... hoặc link Google Drive"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={applying || cvUrl.trim().length === 0}
                    className="rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {applying ? "Đang gửi hồ sơ..." : "Ứng tuyển ngay"}
                  </button>
                  {applyError ? (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
                      {applyError}
                    </p>
                  ) : null}
                  {applySuccess ? (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
                      {applySuccess}
                    </p>
                  ) : null}
                </form>
              )}

              <Link
                href="/"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Quay lại danh sách
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
