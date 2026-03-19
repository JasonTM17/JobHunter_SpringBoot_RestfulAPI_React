import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import DashboardHero from "../components/common/DashboardHero";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../contexts/auth-context";
import { fetchResumesWithAuth, fetchUsersWithAuth } from "../services/auth-rbac-api";
import { fetchAllCompanies, fetchAllJobs, fetchAllSkills } from "../services/jobhunter-api";
import { toUserErrorMessage } from "../utils/error-message";
import { canAccessAdminWorkspace } from "../utils/workspace";

interface AdminStats {
  jobs: number;
  activeJobs: number;
  companies: number;
  skills: number;
  users: number | null;
  resumes: number | null;
}

export default function AdminWorkspacePage() {
  const router = useRouter();
  const { status, roleName, canAccessManagement, can } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<AdminStats>({
    jobs: 0,
    activeJobs: 0,
    companies: 0,
    skills: 0,
    users: null,
    resumes: null
  });

  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(router.asPath || "/admin")}`, [router.asPath]);
  const isAllowed = canAccessAdminWorkspace(roleName, canAccessManagement);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isAllowed) {
      void router.replace(`/403?next=${encodeURIComponent(router.asPath || "/admin")}`);
    }
  }, [status, isAllowed, router]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [jobs, companies, skills] = await Promise.all([fetchAllJobs(), fetchAllCompanies(), fetchAllSkills()]);
      const canReadUsers = can("/api/v1/users", "GET");
      const canReadResumes = can("/api/v1/resumes", "GET");

      const [users, resumes] = await Promise.all([
        canReadUsers ? fetchUsersWithAuth() : Promise.resolve(null),
        canReadResumes ? fetchResumesWithAuth() : Promise.resolve(null)
      ]);

      setStats({
        jobs: jobs.length,
        activeJobs: jobs.filter((item) => item.active).length,
        companies: companies.length,
        skills: skills.length,
        users: users ? users.length : null,
        resumes: resumes ? resumes.length : null
      });
    } catch (loadError) {
      setError(toUserErrorMessage(loadError, "Không thể tải dữ liệu quản trị lúc này."));
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
        <Head><title>Khu quản trị — Jobhunter</title><meta name="description" content="Bảng điều hành quản trị hệ thống Jobhunter — quản lý việc làm, công ty, kỹ năng, tài khoản và phân quyền người dùng." /></Head>
        <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
          <LoadingState title="Đang khởi tạo khu quản trị..." rows={4} />
        </main>
      </>
    );
  }

  if (status !== "authenticated") {
    return (
      <>
        <Head><title>Khu quản trị — Jobhunter</title><meta name="description" content="Bảng điều hành quản trị hệ thống Jobhunter — quản lý việc làm, công ty, kỹ năng, tài khoản và phân quyền người dùng." /></Head>
        <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
        <EmptyState
          title="Bạn cần đăng nhập để vào khu quản trị"
          description="Vui lòng đăng nhập bằng tài khoản quản trị để truy cập các công cụ vận hành hệ thống."
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
        <Head><title>Khu quản trị — Jobhunter</title><meta name="description" content="Bảng điều hành quản trị hệ thống Jobhunter — quản lý việc làm, công ty, kỹ năng, tài khoản và phân quyền người dùng." /></Head>
        <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
          <LoadingState title="Đang tải số liệu quản trị..." rows={5} />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head><title>Khu quản trị — Jobhunter</title><meta name="description" content="Bảng điều hành quản trị hệ thống Jobhunter — quản lý việc làm, công ty, kỹ năng, tài khoản và phân quyền người dùng." /></Head>
        <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
          <ErrorState description={error} onRetry={() => void loadData()} />
        </main>
      </>
    );
  }

  return (
    <>
      <Head><title>Khu quản trị — Jobhunter</title></Head>
      <main className="mx-auto max-w-[1180px] px-3 py-5 sm:px-4 sm:py-6">
      <DashboardHero
        eyebrow="Khu quản trị hệ thống"
        title="Bảng điều hành quản trị"
        description="Theo dõi nhanh trạng thái nền tảng và truy cập các nhóm chức năng vận hành người dùng, dữ liệu tuyển dụng và quy trình hồ sơ."
        stats={[
          {
            label: "Việc làm",
            value: stats.jobs,
            caption: `${stats.activeJobs} tin đang tuyển`,
            icon: (
              <svg className="h-4 w-4 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )
          },
          {
            label: "Doanh nghiệp",
            value: stats.companies,
            caption: "Đang hiển thị trên cổng việc làm",
            icon: (
              <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )
          },
          {
            label: "Kỹ năng",
            value: stats.skills,
            caption: "Phục vụ tìm kiếm và lọc",
            icon: (
              <svg className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )
          },
          {
            label: "Tài khoản",
            value: stats.users ?? "Không có quyền",
            caption: "Theo phạm vi quyền hiện tại",
            icon: (
              <svg className="h-4 w-4 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )
          }
        ]}
        actions={
          <>
            <Link
              href="/?tab=manage&module=users"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Mở cổng quản trị chi tiết
            </Link>
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/20"
            >
              Làm mới số liệu
            </button>
          </>
        }
      />

      <section className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,1.05fr)_0.95fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Điều hướng quản trị</h2>
          <p className="mt-1 text-sm text-slate-600">
            Truy cập nhanh vào khu thao tác quản lý dữ liệu và phân quyền.
          </p>
          <div className="mt-4 grid gap-2">
            <Link
              href="/?tab=manage&module=users"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              Mở cổng quản trị chi tiết
            </Link>
            <Link
              href="/?tab=manage&module=roles"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Xem vai trò và quyền
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Kiểm soát truy cập</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mọi thao tác tạo, sửa, xóa tiếp tục được kiểm tra quyền tại backend trước khi xử lý.
          </p>
          <div className="mt-4 grid gap-2.5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Nguồn sự thật cuối cùng</span>
              <span className="mt-1 block">Backend luôn là lớp xác thực và kiểm tra quyền quyết định.</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Số liệu hồ sơ</span>
              <span className="mt-1 block">{stats.resumes ?? "Không có quyền truy cập dữ liệu hồ sơ ở tài khoản này."}</span>
            </div>
          </div>
        </article>
      </section>
    </main>
    </>
  );
}
