import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../contexts/auth-context";
import { fetchCurrentUserResumesWithAuth } from "../services/auth-rbac-api";
import { fetchAllJobs } from "../services/jobhunter-api";
import { Job, ResumeItem } from "../types/models";
import { formatCurrencyVnd, formatDateVi } from "../utils/format";
import { canAccessCandidateWorkspace } from "../utils/workspace";

function statusLabel(status: string): string {
  const normalized = (status || "").toUpperCase();
  if (normalized === "PENDING") return "Đang chờ";
  if (normalized === "REVIEWING") return "Đang xem xét";
  if (normalized === "APPROVED") return "Đạt";
  if (normalized === "REJECTED") return "Từ chối";
  return "Đang xử lý";
}

function statusClass(status: string): string {
  const normalized = (status || "").toUpperCase();
  if (normalized === "APPROVED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "REJECTED") return "border-rose-200 bg-rose-50 text-rose-700";
  if (normalized === "REVIEWING") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function CandidateWorkspacePage() {
  const router = useRouter();
  const { status, currentUser, roleName, canAccessManagement } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);

  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(router.asPath || "/candidate")}`, [router.asPath]);
  const isAllowed = canAccessCandidateWorkspace(roleName, canAccessManagement);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isAllowed) {
      void router.replace(`/403?next=${encodeURIComponent(router.asPath || "/candidate")}`);
    }
  }, [status, isAllowed, router]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [jobData, resumeData] = await Promise.all([fetchAllJobs(), fetchCurrentUserResumesWithAuth()]);
      setJobs(jobData.filter((item) => item.active));
      setResumes(resumeData);
    } catch (loadError) {
      setError((loadError as Error).message || "Không thể tải dữ liệu ứng viên.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" && isAllowed) {
      void loadData();
    }
  }, [status, isAllowed]);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <LoadingState title="Đang khởi tạo không gian ứng viên..." rows={4} />
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <EmptyState
          title="Bạn cần đăng nhập để vào không gian ứng viên"
          description="Đăng nhập để xem hồ sơ đã ứng tuyển và theo dõi tiến trình tuyển dụng của bạn."
          actionLabel="Đăng nhập"
          onAction={() => void router.push(loginHref)}
        />
      </main>
    );
  }

  if (!isAllowed) {
    return null;
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <LoadingState title="Đang tải dữ liệu ứng viên..." rows={5} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <ErrorState description={error} onRetry={() => void loadData()} />
      </main>
    );
  }

  const latestApplications = [...resumes].sort((a, b) => {
    const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
    const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
    return bTime - aTime;
  });

  const suggestedJobs = [...jobs]
    .sort((a, b) => Number(b.salary || 0) - Number(a.salary || 0))
    .slice(0, 6);

  const approvedCount = resumes.filter((item) => item.status?.toUpperCase() === "APPROVED").length;
  const reviewingCount = resumes.filter((item) => item.status?.toUpperCase() === "REVIEWING").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-soft">
        <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
          Không gian ứng viên
        </p>
        <h1 className="mt-3 text-3xl font-extrabold">Xin chào {currentUser?.name ?? "bạn"}!</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          Theo dõi trạng thái hồ sơ ứng tuyển, khám phá việc làm mới và cập nhật thông tin tài khoản để tăng cơ hội phù hợp.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Hồ sơ đã nộp</p>
            <p className="mt-1 text-2xl font-extrabold">{resumes.length}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Đang xem xét</p>
            <p className="mt-1 text-2xl font-extrabold">{reviewingCount}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Đạt vòng</p>
            <p className="mt-1 text-2xl font-extrabold">{approvedCount}</p>
          </article>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Khám phá việc làm
          </Link>
          <Link
            href="/account"
            className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/20"
          >
            Cập nhật tài khoản
          </Link>
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-[1.35fr,1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Hồ sơ ứng tuyển gần đây</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tất cả trạng thái trong danh sách này được lấy trực tiếp từ hồ sơ của bạn.
          </p>

          {latestApplications.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                title="Bạn chưa nộp hồ sơ nào"
                description="Hãy khám phá danh sách việc làm và ứng tuyển vị trí phù hợp."
                actionLabel="Xem việc làm"
                onAction={() => void router.push("/")}
              />
            </div>
          ) : (
            <div className="mt-3 grid gap-2">
              {latestApplications.slice(0, 8).map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.job?.name || "Tin tuyển dụng"}</h3>
                      <p className="text-xs text-slate-500">{item.companyName || "Đang cập nhật công ty"}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Ngày nộp: {formatDateVi(item.createdDate)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Việc làm gợi ý</h2>
          <p className="mt-1 text-sm text-slate-600">Một số vị trí đang tuyển nổi bật để bạn tham khảo nhanh.</p>

          <div className="mt-3 grid gap-2">
            {suggestedJobs.map((job) => (
              <article key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <h3 className="text-sm font-bold text-slate-900">{job.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{job.company?.name || "Đang cập nhật công ty"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {job.location}
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {formatCurrencyVnd(job.salary)}
                  </span>
                </div>
                <Link
                  href={`/jobs/${job.id}`}
                  className="mt-2 inline-flex text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline"
                >
                  Xem chi tiết
                </Link>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
