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
      setError((loadError as Error).message || "Không thể tải chi tiết công việc.");
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
      setApplyError((submitError as Error).message || "Không thể gửi hồ sơ ứng tuyển.");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-5">
        <LoadingState title="Đang tải chi tiết công việc..." rows={5} />
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-5">
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

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-5">
      <header className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-soft">
        <Link
          href="/"
          className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-white/20"
        >
          Quay lại danh sách việc làm
        </Link>

        <div className="flex flex-wrap items-start gap-4">
          <CompanyLogo name={job.company?.name} logo={job.company?.logo} size="lg" className="border-white/20" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold md:text-4xl">{job.name}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-200">{job.company?.name ?? "Đang cập nhật"}</p>
            <p className="mt-2 text-sm text-slate-100">
              {formatCurrencyVnd(job.salary)} • {formatLocationLabel(job.location)} • {formatLevelLabel(job.level)} •{" "}
              {job.quantity} vị trí
            </p>
            <p className="mt-1 text-sm text-slate-200">Hạn nộp: {formatDateVi(job.endDate)}</p>
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-3 lg:grid-cols-[2fr,1fr]">
        <article className="grid gap-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">Mô tả công việc</h2>
            {safeDescription ? (
              <div className="job-richtext mt-3 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: safeDescription }} />
            ) : (
              <p className="mt-3 text-sm text-slate-500">Đang cập nhật mô tả.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">Yêu cầu</h2>
            {safeRequirements ? (
              <div className="job-richtext mt-3 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: safeRequirements }} />
            ) : (
              <p className="mt-3 text-sm text-slate-500">Đang cập nhật yêu cầu.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-bold text-slate-900">Quyền lợi</h2>
            {safeBenefits ? (
              <div className="job-richtext mt-3 text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: safeBenefits }} />
            ) : (
              <p className="mt-3 text-sm text-slate-500">Đang cập nhật quyền lợi.</p>
            )}
          </section>
        </article>

        <aside className="grid content-start gap-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-base font-bold text-slate-900">Thông tin nhanh</h2>
            <p className="mt-2 text-sm text-slate-700">
              <strong>Công ty:</strong> {job.company?.name ?? "Đang cập nhật"}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <strong>Địa điểm:</strong> {formatLocationLabel(job.location)}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <strong>Mức lương:</strong> {formatCurrencyVnd(job.salary)}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <strong>Cấp độ:</strong> {formatLevelLabel(job.level)}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <strong>Số lượng:</strong> {job.quantity}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <strong>Hạn nộp:</strong> {formatDateVi(job.endDate)}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-base font-bold text-slate-900">Kỹ năng liên quan</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(job.skills ?? []).length > 0 ? (
                (job.skills ?? []).map((item) => (
                  <span
                    key={`${job.id}-${item.id}`}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    {item.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">Đang cập nhật.</span>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-base font-bold text-slate-900">Hành động</h2>
            <div className="mt-3 grid gap-2">
              <Link
                href={`/chatbot?jobId=${job.id}`}
                className="rounded-xl bg-rose-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-rose-700"
              >
                Tư vấn cùng AI trước khi ứng tuyển
              </Link>

              {authStatus !== "authenticated" ? (
                <div className="grid gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <p>Bạn cần đăng nhập để gửi hồ sơ ứng tuyển.</p>
                  <Link
                    href={loginHref}
                    className="inline-flex w-fit rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : !can("/api/v1/resumes", "POST") ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Tài khoản hiện tại chưa được cấp quyền gửi hồ sơ ứng tuyển.
                </p>
              ) : (
                <form
                  className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void applyForJob();
                  }}
                >
                  <label className="grid gap-1 text-xs text-slate-600">
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
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {applying ? "Đang gửi hồ sơ..." : "Ứng tuyển ngay"}
                  </button>
                  {applyError ? (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                      {applyError}
                    </p>
                  ) : null}
                  {applySuccess ? (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      {applySuccess}
                    </p>
                  ) : null}
                </form>
              )}

              <Link
                href="/"
                className="rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
