import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
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
      <main className="mx-auto max-w-[1240px] px-3 py-5 sm:px-4">
        <LoadingState title="Đang khởi tạo không gian tuyển dụng..." rows={4} />
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-[1240px] px-3 py-5 sm:px-4">
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
      <main className="mx-auto max-w-[1240px] px-3 py-5 sm:px-4">
        <LoadingState title="Đang tải dữ liệu tuyển dụng..." rows={5} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-[1240px] px-3 py-5 sm:px-4">
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
    <main className="mx-auto max-w-[1240px] px-3 py-5 sm:px-4">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-5 text-white shadow-soft sm:p-6">
        <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
          Không gian tuyển dụng
        </p>
        <h1 className="mt-3 text-3xl font-extrabold">Bảng điều phối tuyển dụng</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          Theo dõi tình trạng tin tuyển, xử lý hồ sơ ứng viên và giữ nhịp tuyển dụng ổn định theo kế hoạch của đội ngũ.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Tin đang tuyển</p>
            <p className="mt-1 text-2xl font-extrabold">{activeJobs.length}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Hồ sơ chờ xử lý</p>
            <p className="mt-1 text-2xl font-extrabold">{pendingCount}</p>
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
        </div>
      </section>

      <section className="mt-3.5 grid gap-3 lg:grid-cols-[1.3fr,1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
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
            <div className="mt-3 grid gap-2">
              {latestResumes.slice(0, 8).map((resume) => (
                <article key={resume.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{resume.job?.name || "Tin tuyển dụng"}</h3>
                      <p className="text-xs text-slate-500">{resume.email}</p>
                    </div>
                    <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {resume.status}
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

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Tổng quan nhanh</h2>
          <div className="mt-3 grid gap-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tổng số việc làm trên hệ thống</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{jobs.length}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Doanh nghiệp đang hiển thị</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{companyCount}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Hồ sơ trong phạm vi của bạn</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{resumes.length}</p>
            </article>
          </div>
        </article>
      </section>
    </main>
  );
}
