import { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import DashboardHero from "../components/common/DashboardHero";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../contexts/auth-context";
import { fetchCurrentUserResumesWithAuth } from "../services/auth-rbac-api";
import { fetchAllJobs } from "../services/jobhunter-api";
import { Job, ResumeItem } from "../types/models";
import { toUserErrorMessage } from "../utils/error-message";
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
      setError(toUserErrorMessage(loadError, "Không thể tải dữ liệu ứng viên lúc này."));
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
      <>
        <Head><title>Không gian ứng viên — Jobhunter</title></Head>
        <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
          <LoadingState title="Đang khởi tạo không gian ứng viên..." rows={4} />
        </main>
      </>
    );
  }

  if (status !== "authenticated") {
    return (
      <>
        <Head><title>Không gian ứng viên — Jobhunter</title></Head>
        <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
        <EmptyState
          title="Bạn cần đăng nhập để vào không gian ứng viên"
          description="Đăng nhập để xem hồ sơ đã ứng tuyển và theo dõi tiến trình tuyển dụng của bạn."
          actionLabel="Đăng nhập"
          onAction={() => void router.push(loginHref)}
        />
        </main>
      </>
    );
  }

  if (!isAllowed) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Head><title>Không gian ứng viên — Jobhunter</title></Head>
        <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
          <LoadingState title="Đang tải dữ liệu ứng viên..." rows={5} />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head><title>Không gian ứng viên — Jobhunter</title></Head>
        <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
          <ErrorState description={error} onRetry={() => void loadData()} />
        </main>
      </>
    );
  }

  const latestApplications = [...resumes].sort((a, b) => {
    const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
    const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
    return bTime - aTime;
  });

  const suggestedJobs = [...jobs]
    .sort((a, b) => Number(b.salary || 0) - Number(a.salary || 0))
    .slice(0, 4);

  const approvedCount = resumes.filter((item) => item.status?.toUpperCase() === "APPROVED").length;
  const reviewingCount = resumes.filter((item) => item.status?.toUpperCase() === "REVIEWING").length;

  return (
    <>
      <Head><title>Không gian ứng viên — Jobhunter</title></Head>
      <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
      <DashboardHero
        eyebrow="Không gian ứng viên"
        title={`Xin chào ${currentUser?.name ?? "bạn"}!`}
        description="Theo dõi trạng thái hồ sơ ứng tuyển, khám phá việc làm mới và cập nhật thông tin tài khoản để tăng cơ hội phù hợp."
        stats={[
          {
            label: "Hồ sơ đã nộp",
            value: resumes.length,
            caption: "Tổng số hồ sơ của bạn",
            icon: (
              <svg className="h-4 w-4 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )
          },
          {
            label: "Đang xem xét",
            value: reviewingCount,
            caption: "Nhà tuyển dụng đang phản hồi",
            icon: (
              <svg className="h-4 w-4 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )
          },
          {
            label: "Đạt vòng",
            value: approvedCount,
            caption: "Các hồ sơ có tín hiệu tích cực",
            icon: (
              <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          },
          {
            label: "Việc làm mở",
            value: jobs.length,
            caption: "Các cơ hội đang active trên hệ thống",
            icon: (
              <svg className="h-4 w-4 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )
          }
        ]}
        actions={
          <>
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
          </>
        }
      />

      <section className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_360px]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
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
            <div className="mt-4 grid gap-2.5">
              {latestApplications.slice(0, 8).map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">{item.job?.name || "Tin tuyển dụng"}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{item.companyName || "Đang cập nhật công ty"}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Ngày nộp: {formatDateVi(item.createdDate)}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Việc làm gợi ý</h2>
              <p className="mt-1 text-sm text-slate-600">Một vài vị trí đang tuyển nổi bật để bạn tham khảo nhanh mà không phải cuộn quá sâu.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {suggestedJobs.length} vị trí
            </span>
          </div>

          <div className="mt-4 grid gap-2.5">
            {suggestedJobs.map((job) => (
              <article key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
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

          <Link
            href="/"
            className="mt-4 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Xem toàn bộ việc làm
          </Link>
        </article>
      </section>
    </main>
    </>
  );
}
