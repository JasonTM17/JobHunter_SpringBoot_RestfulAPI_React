import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../contexts/auth-context";
import { fetchResumesWithAuth, fetchUsersWithAuth } from "../services/auth-rbac-api";
import { fetchAllCompanies, fetchAllJobs, fetchAllSkills } from "../services/jobhunter-api";
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
      setError((loadError as Error).message || "Không thể tải dữ liệu quản trị.");
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
        <LoadingState title="Đang khởi tạo khu quản trị..." rows={4} />
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <EmptyState
          title="Bạn cần đăng nhập để vào khu quản trị"
          description="Vui lòng đăng nhập bằng tài khoản quản trị để truy cập các công cụ vận hành hệ thống."
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
        <LoadingState title="Đang tải số liệu quản trị..." rows={5} />
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-white shadow-soft">
        <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
          Khu quản trị hệ thống
        </p>
        <h1 className="mt-3 text-3xl font-extrabold">Bảng điều hành quản trị</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          Theo dõi nhanh trạng thái nền tảng và truy cập các nhóm chức năng vận hành người dùng, dữ liệu tuyển dụng và quy trình hồ sơ.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Việc làm</p>
            <p className="mt-1 text-2xl font-extrabold">{stats.jobs}</p>
            <p className="text-xs text-slate-200">{stats.activeJobs} tin đang tuyển</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Doanh nghiệp</p>
            <p className="mt-1 text-2xl font-extrabold">{stats.companies}</p>
            <p className="text-xs text-slate-200">Đang hiện trên cổng việc làm</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Kỹ năng</p>
            <p className="mt-1 text-2xl font-extrabold">{stats.skills}</p>
            <p className="text-xs text-slate-200">Phục vụ tìm kiếm và lọc</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Tài khoản</p>
            <p className="mt-1 text-2xl font-extrabold">{stats.users ?? "Không có quyền"}</p>
            <p className="text-xs text-slate-200">Theo quyền hiện tại</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-200">Hồ sơ ứng tuyển</p>
            <p className="mt-1 text-2xl font-extrabold">{stats.resumes ?? "Không có quyền"}</p>
            <p className="text-xs text-slate-200">Theo quyền hiện tại</p>
          </article>
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Điều hướng quản trị</h2>
          <p className="mt-1 text-sm text-slate-600">
            Truy cập nhanh vào khu thao tác quản lý dữ liệu và phân quyền.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/?tab=manage"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Mở cổng quản trị chi tiết
            </Link>
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Làm mới số liệu
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-lg font-bold text-slate-900">Kiểm soát truy cập</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mọi thao tác tạo, sửa, xóa tiếp tục được kiểm tra quyền tại backend trước khi xử lý.
          </p>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Không sử dụng quyền từ frontend để cấp phép thao tác. Backend luôn là nguồn xác thực cuối cùng.
          </div>
        </article>
      </section>
    </main>
  );
}
