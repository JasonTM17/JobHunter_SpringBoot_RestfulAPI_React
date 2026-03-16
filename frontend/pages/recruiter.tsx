import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import DashboardHero from "../components/common/DashboardHero";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../contexts/auth-context";
import { fetchResumesWithAuth } from "../services/auth-rbac-api";
import { fetchAllCompanies, fetchAllJobs } from "../services/jobhunter-api";
import { Job, ResumeItem } from "../types/models";
import { toUserErrorMessage } from "../utils/error-message";
import { formatDateVi } from "../utils/format";
import { canAccessRecruiterWorkspace } from "../utils/workspace";

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

function statusCount(resumes: ResumeItem[], value: string): number {
  return resumes.filter((item) => item.status?.toUpperCase() === value).length;
}

export default function RecruiterWorkspacePage() {
  const router = useRouter();
  const { status, roleName, can, canAccessManagement } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [companyCount, setCompanyCount] = useState(0);

  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(router.asPath || "/recruiter")}`, [router.asPath]);
  const isAllowed = canAccessRecruiterWorkspace(roleName);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isAllowed) {
      void router.replace(`/403?next=${encodeURIComponent(router.asPath || "/recruiter")}`);
    }
  }, [status, isAllowed, router]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [allJobs, allCompanies, companyResumes] = await Promise.all([
        fetchAllJobs(),
        fetchAllCompanies(),
        can("/api/v1/resumes", "GET") ? fetchResumesWithAuth() : Promise.resolve([])
      ]);

      setJobs(allJobs);
      setCompanyCount(allCompanies.length);
      setResumes(companyResumes);
    } catch (loadError) {
      setError(toUserErrorMessage(loadError, "Không thể tải dữ liệu tuyển dụng lúc này."));
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
      <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
        <LoadingState title="Đang khởi tạo không gian tuyển dụng..." rows={4} />
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
        <EmptyState
          title="Bạn cần đăng nhập để vào khu tuyển dụng"
          description="Đăng nhập bằng tài khoản tuyển dụng để quản lý tin tuyển và theo dõi hồ sơ ứng viên."
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
      <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
        <LoadingState title="Đang tải dữ liệu tuyển dụng..." rows={5} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
        <ErrorState description={error} onRetry={() => void loadData()} />
      </main>
    );
  }

  const activeJobs = jobs.filter((item) => item.active);
  const reviewingCount = statusCount(resumes, "REVIEWING");
  const pendingCount = statusCount(resumes, "PENDING");
  const approvedCount = statusCount(resumes, "APPROVED");
  const latestResumes = [...resumes].sort((a, b) => {
    const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
    const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
      <DashboardHero
        eyebrow="Không gian tuyển dụng"
        title="Bảng điều phối tuyển dụng"
        description="Theo dõi tình trạng tin tuyển, xử lý hồ sơ ứng viên và giữ nhịp tuyển dụng ổn định theo kế hoạch của đội ngũ."
        stats={[
          { label: "Tin đang tuyển", value: activeJobs.length, caption: "Các vị trí vẫn đang mở" },
          { label: "Hồ sơ chờ xử lý", value: pendingCount, caption: "Cần phản hồi từ đội tuyển dụng" },
          { label: "Đang xem xét", value: reviewingCount, caption: "Các hồ sơ đang ở vòng review" },
          { label: "Đạt vòng", value: approvedCount, caption: "Các hồ sơ có tiến triển tốt" }
        ]}
        actions={
          <>
            <Link
              href="/"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/20"
            >
              Về cổng việc làm
            </Link>
            {canAccessManagement ? (
              <Link
                href="/?tab=manage&module=resumes"
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Mở công cụ quản lý
              </Link>
            ) : null}
          </>
        }
      />

      <section className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_360px]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Luồng hồ sơ gần đây</h2>
          <p className="mt-1 text-sm text-slate-600">
            Danh sách hiển thị các hồ sơ ứng tuyển thuộc phạm vi bạn đang phụ trách.
          </p>

          {latestResumes.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                title="Chưa có hồ sơ ứng tuyển"
                description="Hãy kiểm tra lại tin tuyển đang mở hoặc làm mới dữ liệu sau."
                actionLabel="Làm mới"
                onAction={() => void loadData()}
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-2.5">
              {latestResumes.slice(0, 8).map((resume) => (
                <article key={resume.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">{resume.job?.name || "Tin tuyển dụng"}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{resume.email || "—"}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(resume.status)}`}>
                      {statusLabel(resume.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Cập nhật: {resume.lastModifiedDate ? formatDateVi(resume.lastModifiedDate) : formatDateVi(resume.createdDate)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Tổng quan nhanh</h2>
          <p className="mt-1 text-sm text-slate-600">Số liệu cơ bản để giữ nhịp kiểm soát tuyển dụng hàng ngày.</p>

          <div className="mt-4 grid gap-2.5">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tổng số việc làm trên hệ thống</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{jobs.length}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Doanh nghiệp đang hiển thị</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{companyCount}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Hồ sơ trong phạm vi của bạn</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{resumes.length}</p>
            </article>
          </div>
        </article>
      </section>
    </main>
  );
}
