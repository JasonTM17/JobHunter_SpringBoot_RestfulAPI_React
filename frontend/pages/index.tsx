import { useRouter } from "next/router";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import FloatingChatWidget from "../components/chat/FloatingChatWidget";
import CompanyLogo from "../components/common/CompanyLogo";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";
import ToastViewport, { ToastItem, ToastType } from "../components/common/ToastViewport";
import JobCard from "../components/jobs/JobCard";
import JobFilters from "../components/jobs/JobFilters";
import JobQuickDetail from "../components/jobs/JobQuickDetail";
import ManagementPanel from "../components/management/ManagementPanel";
import { useAuth } from "../contexts/auth-context";
import {
  createUserWithAuth,
  deleteResumeWithAuth,
  deleteUserWithAuth,
  fetchPermissionsWithAuth,
  fetchResumesWithAuth,
  fetchRolesWithAuth,
  fetchUserActionCapabilityWithAuth,
  fetchUsersWithAuth,
  updateResumeWithAuth,
  updateUserWithAuth
} from "../services/auth-rbac-api";
import {
  createCompany,
  createJob,
  createSkill,
  deleteCompany,
  deleteJob,
  deleteSkill,
  fetchAllCompanies,
  fetchAllJobs,
  fetchAllSkills,
  updateCompany,
  updateJob,
  updateSkill,
  uploadCompanyLogo
} from "../services/jobhunter-api";
import {
  Company,
  CompanyUpsertPayload,
  Job,
  JobUpsertPayload,
  Permission,
  ResumeItem,
  Role,
  Skill,
  SkillUpsertPayload,
  UserActionCapability,
  UserCreatePayload,
  UserListItem,
  UserUpdatePayload
} from "../types/models";
import { toUserErrorMessage } from "../utils/error-message";
import { createId, stripHtml } from "../utils/format";
import { resolveWorkspaceKind, workspacePath } from "../utils/workspace";

type MainTab = "browse" | "manage";
type ManageModule = "jobs" | "companies" | "skills" | "resumes" | "users" | "roles" | "permissions";
const UNKNOWN_LEVEL = "CHUA_CAP_NHAT";
const JOBS_PER_PAGE = 12;

export default function HomePage() {
  const router = useRouter();
  const {
    status: authStatus,
    can,
    assignableRoles,
    permissionKeys,
    canAccessManagement,
    roleName,
    refreshAccount
  } = useAuth();

  const [tab, setTab] = useState<MainTab>("browse");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userCapabilities, setUserCapabilities] = useState<Record<number, UserActionCapability>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rbacLoading, setRbacLoading] = useState(false);
  const [rbacLoaded, setRbacLoaded] = useState(false);
  const [rbacError, setRbacError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [skill, setSkill] = useState("ALL");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const deferredKeyword = useDeferredValue(keyword.trim().toLowerCase());
  const workspace = useMemo(
    () => resolveWorkspaceKind(roleName, canAccessManagement),
    [roleName, canAccessManagement]
  );
  const workspaceHref = useMemo(() => workspacePath(workspace), [workspace]);
  const workspaceLabel = useMemo(() => {
    if (workspace === "admin") return "Bảng điều hành quản trị";
    if (workspace === "recruiter") return "Bảng tuyển dụng";
    return "Không gian ứng viên";
  }, [workspace]);

  function renderPublicStat(value: number): string {
    if (loading) return "Đang tải...";
    if (error) return "Không khả dụng";
    return String(value);
  }

  function queryWithoutTab(currentQuery: typeof router.query): Record<string, string> {
    const nextQuery: Record<string, string> = {};
    Object.entries(currentQuery).forEach(([key, value]) => {
      if (key === "tab" || key === "module") return;
      if (Array.isArray(value)) {
        if (value[0]) nextQuery[key] = value[0];
      } else if (value) {
        nextQuery[key] = value;
      }
    });
    return nextQuery;
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }

  function addToast(type: ToastType, message: string) {
    const safeMessage = type === "error" ? toUserErrorMessage(message) : message.trim();
    if (!safeMessage) return;

    let createdToastId = "";
    setToasts((prev) => {
      const duplicated = prev.some((item) => item.type === type && item.message === safeMessage);
      if (duplicated) {
        return prev;
      }

      createdToastId = createId("toast");
      return [...prev, { id: createdToastId, type, message: safeMessage }];
    });

    if (createdToastId && typeof window !== "undefined") {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== createdToastId));
      }, 4200);
    }
  }

  async function loadPublicData() {
    setLoading(true);
    setError("");
    try {
      const [nextJobs, nextCompanies, nextSkills] = await Promise.all([fetchAllJobs(), fetchAllCompanies(), fetchAllSkills()]);
      const sortedJobs = [...nextJobs].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        const aDate = a.endDate ? new Date(a.endDate).getTime() : 0;
        const bDate = b.endDate ? new Date(b.endDate).getTime() : 0;
        return bDate - aDate;
      });
      const sortedCompanies = [...nextCompanies].sort((a, b) => a.name.localeCompare(b.name));
      const sortedSkills = [...nextSkills].sort((a, b) => a.name.localeCompare(b.name));

      setJobs(sortedJobs);
      setCompanies(sortedCompanies);
      setSkills(sortedSkills);
    } catch (loadError) {
      setError(toUserErrorMessage(loadError, "Không thể tải dữ liệu tuyển dụng lúc này."));
    } finally {
      setLoading(false);
    }
  }

  async function loadRbacData() {
    if (authStatus !== "authenticated") {
      setUsers([]);
      setRoles([]);
      setPermissions([]);
      setResumes([]);
      setUserCapabilities({});
      setRbacLoaded(false);
      setRbacError("");
      return;
    }

    setRbacLoaded(false);
    setRbacLoading(true);
    setRbacError("");
    const canReadUsers = can("/api/v1/users", "GET");
    const canReadRoles = can("/api/v1/roles", "GET");
    const canReadPermissions = can("/api/v1/permissions", "GET");
    const canReadResumes = can("/api/v1/resumes", "GET");

    try {
      const messages: string[] = [];

      if (canReadUsers) {
        try {
          const usersResult = await fetchUsersWithAuth();
          setUsers(usersResult);

          const capabilityPairs = await Promise.allSettled(
            usersResult.map(async (user) => {
              const capability = await fetchUserActionCapabilityWithAuth(user.id);
              return [user.id, capability] as const;
            })
          );

          const capabilityMap: Record<number, UserActionCapability> = {};
          capabilityPairs.forEach((item) => {
            if (item.status === "fulfilled") {
              const [id, capability] = item.value;
              capabilityMap[id] = capability;
            }
          });
          setUserCapabilities(capabilityMap);
        } catch (usersError) {
          setUsers([]);
          setUserCapabilities({});
          messages.push(`Người dùng: ${toUserErrorMessage(usersError, "Không thể tải danh sách tài khoản.")}`);
        }
      } else {
        setUsers([]);
        setUserCapabilities({});
      }

      if (canReadRoles) {
        try {
          setRoles(await fetchRolesWithAuth());
        } catch (rolesError) {
          setRoles([]);
          messages.push(`Vai trò: ${toUserErrorMessage(rolesError, "Không thể tải danh sách vai trò.")}`);
        }
      } else {
        setRoles([]);
      }

      if (canReadPermissions) {
        try {
          setPermissions(await fetchPermissionsWithAuth());
        } catch (permError) {
          setPermissions([]);
          messages.push(`Quyền: ${toUserErrorMessage(permError, "Không thể tải danh sách quyền.")}`);
        }
      } else {
        setPermissions([]);
      }

      if (canReadResumes) {
        try {
          setResumes(await fetchResumesWithAuth());
        } catch (resumeError) {
          setResumes([]);
          messages.push(`Ứng tuyển: ${toUserErrorMessage(resumeError, "Không thể tải hồ sơ ứng tuyển.")}`);
        }
      } else {
        setResumes([]);
      }

      setRbacError(messages.join(" | "));
    } catch (loadError) {
      setRbacError(toUserErrorMessage(loadError, "Không thể tải dữ liệu quản trị lúc này."));
    } finally {
      setRbacLoading(false);
      setRbacLoaded(true);
    }
  }

  async function reloadRbacData() {
    if (authStatus === "authenticated") {
      try {
        await refreshAccount();
      } catch (refreshError) {
        addToast("error", toUserErrorMessage(refreshError, "Không thể đồng bộ lại quyền truy cập."));
      }
    }
    await loadRbacData();
  }

  const manageModuleQuery = useMemo(() => {
    const raw = router.query.module;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return null;

    const normalized = value.trim().toLowerCase();
    const supported = new Set(["jobs", "companies", "skills", "resumes", "users", "roles", "permissions"]);
    return supported.has(normalized) ? (normalized as ManageModule) : null;
  }, [router.query.module]);

  const defaultManageModule = useMemo<ManageModule>(() => {
    if (workspace === "admin") return "users";
    if (workspace === "recruiter") return "resumes";
    return "jobs";
  }, [workspace]);
  const manageCtaLabel = useMemo(() => {
    if (workspace === "admin") return "Mở quản trị dữ liệu";
    if (workspace === "recruiter") return "Mở công cụ tuyển dụng";
    return "Mở khu quản lý";
  }, [workspace]);

  useEffect(() => {
    void loadPublicData();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.tab;
    const tabQueryValue = Array.isArray(raw) ? raw[0] : raw;
    const wantsManage = tabQueryValue === "manage" || Boolean(manageModuleQuery);

    if (wantsManage && !canAccessManagement) {
      const nextQuery = queryWithoutTab(router.query);
      setTab("browse");
      void router.replace(
        {
          pathname: router.pathname,
          query: nextQuery
        },
        undefined,
        { shallow: true }
      );
      return;
    }

    const nextTab: MainTab = wantsManage ? "manage" : "browse";
    setTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [router.isReady, router.query.tab, canAccessManagement, manageModuleQuery]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setUsers([]);
      setRoles([]);
      setPermissions([]);
      setResumes([]);
      setUserCapabilities({});
      setRbacLoaded(false);
      setRbacError("");
      return;
    }
    void reloadRbacData();
  }, [authStatus]);

  const locationOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.location).filter(Boolean))),
    [jobs]
  );

  const levelOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => String(job.level || UNKNOWN_LEVEL)).filter(Boolean))),
    [jobs]
  );

  const skillOptions = useMemo(
    () => Array.from(new Set(skills.map((item) => item.name).filter(Boolean))),
    [skills]
  );

  const activeJobsCount = useMemo(() => jobs.filter((job) => job.active).length, [jobs]);
  const isFilteringKeyword = keyword.trim().toLowerCase() !== deferredKeyword;

  const filteredJobs = useMemo(() => {
    const min = salaryMin ? Number(salaryMin) : null;
    const max = salaryMax ? Number(salaryMax) : null;

    return jobs.filter((job) => {
      if (!job.active) return false;
      if (location !== "ALL" && job.location !== location) return false;
      if (level !== "ALL" && String(job.level || UNKNOWN_LEVEL) !== level) return false;
      if (skill !== "ALL" && !(job.skills ?? []).some((item) => item.name === skill)) return false;
      if (min !== null && Number(job.salary || 0) < min) return false;
      if (max !== null && Number(job.salary || 0) > max) return false;

      if (!deferredKeyword) return true;

      const haystack = [
        job.name,
        job.location,
        job.level || "",
        job.company?.name || "",
        stripHtml(job.description),
        ...(job.skills ?? []).map((item) => item.name)
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(deferredKeyword);
    });
  }, [jobs, location, level, skill, salaryMin, salaryMax, deferredKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  const paginationNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const start = Math.min(Math.max(currentPage - 2, 1), totalPages - 4);
    return Array.from({ length: 5 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (keyword.trim()) count += 1;
    if (location !== "ALL") count += 1;
    if (level !== "ALL") count += 1;
    if (skill !== "ALL") count += 1;
    if (salaryMin) count += 1;
    if (salaryMax) count += 1;
    return count;
  }, [keyword, location, level, skill, salaryMin, salaryMax]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, location, level, skill, salaryMin, salaryMax]);

  useEffect(() => {
    setCurrentPage((prev) => (prev > totalPages ? totalPages : prev));
  }, [totalPages]);

  useEffect(() => {
    if (!paginatedJobs.length) {
      setSelectedJobId(null);
      return;
    }
    const stillExists = paginatedJobs.some((item) => item.id === selectedJobId);
    if (!stillExists) {
      setSelectedJobId(paginatedJobs[0].id);
    }
  }, [paginatedJobs, selectedJobId]);

  const selectedJob = paginatedJobs.find((job) => job.id === selectedJobId) ?? null;

  function resetFilters() {
    setKeyword("");
    setLocation("ALL");
    setLevel("ALL");
    setSkill("ALL");
    setSalaryMin("");
    setSalaryMax("");
    setCurrentPage(1);
  }

  function changeMainTab(nextTab: MainTab, module?: ManageModule) {
    if (nextTab === "manage" && !canAccessManagement) {
      addToast("error", "Bạn chưa có quyền truy cập khu vực quản trị.");
      return;
    }

    setTab(nextTab);
    if (!router.isReady) return;

    const nextQuery = queryWithoutTab(router.query);
    if (nextTab === "manage") {
      nextQuery.tab = "manage";
      if (module) {
        nextQuery.module = module;
      }
    }

    void router.replace(
      {
        pathname: router.pathname,
        query: nextQuery
      },
      undefined,
      { shallow: true }
    );
  }

  function syncManageModule(module: ManageModule) {
    if (!canAccessManagement || !router.isReady) return;
    void router.replace(
      {
        pathname: router.pathname,
        query: {
          ...queryWithoutTab(router.query),
          tab: "manage",
          module
        }
      },
      undefined,
      { shallow: true }
    );
  }

  async function runProtectedMutation(action: () => Promise<void>, successMessage: string) {
    if (authStatus !== "authenticated") {
      addToast("error", "Vui lòng đăng nhập để thực hiện thao tác này.");
      throw new Error("Bạn chưa đăng nhập.");
    }
    try {
      await action();
      await Promise.all([loadPublicData(), reloadRbacData()]);
      addToast("success", successMessage);
    } catch (mutationError) {
      addToast("error", toUserErrorMessage(mutationError, "Không thể hoàn tất thao tác lúc này."));
      throw mutationError;
    }
  }

  async function runRbacMutation(action: () => Promise<void>, successMessage: string) {
    if (authStatus !== "authenticated") {
      addToast("error", "Vui lòng đăng nhập để thao tác trên khu vực quản trị.");
      throw new Error("Bạn chưa đăng nhập.");
    }
    try {
      await action();
      await reloadRbacData();
      addToast("success", successMessage);
    } catch (mutationError) {
      addToast("error", toUserErrorMessage(mutationError, "Không thể hoàn tất thao tác lúc này."));
      throw mutationError;
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-4 sm:px-5 xl:px-6">
      <ToastViewport toasts={toasts} onDismiss={removeToast} />

      <header className="mb-3 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-4 text-white shadow-soft sm:p-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
          <img src="/favicon.svg" alt="Jobhunter" className="h-4 w-4" />
          Jobhunter
        </div>
        <h1 className="text-[27px] font-extrabold leading-tight sm:text-3xl lg:text-[34px]">
          Nền tảng việc làm công nghệ dành cho ứng viên tại Việt Nam
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-200 md:text-[15px]">
          Tìm vị trí phù hợp theo kỹ năng, mức lương và khu vực. Xem thông tin tuyển dụng rõ ràng, ứng tuyển nhanh và theo dõi cơ hội mới mỗi ngày.
        </p>

        <div className="mt-3.5 grid gap-2 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-200">Việc đang tuyển</p>
            <p className="mt-1 text-xl font-extrabold sm:text-2xl">{renderPublicStat(activeJobsCount)}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-200">Doanh nghiệp</p>
            <p className="mt-1 text-xl font-extrabold sm:text-2xl">{renderPublicStat(companies.length)}</p>
          </article>
          <article className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-200">Kỹ năng nổi bật</p>
            <p className="mt-1 text-xl font-extrabold sm:text-2xl">{renderPublicStat(skills.length)}</p>
          </article>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeMainTab("browse")}
            className="rounded-xl bg-rose-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-rose-700 sm:text-sm"
          >
            Khám phá việc làm
          </button>
          {authStatus === "authenticated" ? (
            <>
              <button
                type="button"
                onClick={() => void router.push(workspaceHref)}
                className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-slate-100 hover:bg-white/20 sm:text-sm"
              >
                {workspaceLabel}
              </button>
              <button
                type="button"
                onClick={() => void router.push("/account")}
                className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-slate-100 hover:bg-white/20 sm:text-sm"
              >
                Thông tin tài khoản
              </button>
              {canAccessManagement ? (
                <button
                  type="button"
                  onClick={() => changeMainTab("manage", manageModuleQuery ?? defaultManageModule)}
                  className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-slate-100 hover:bg-white/20 sm:text-sm"
                >
                  {manageCtaLabel}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void router.push(`/login?next=${encodeURIComponent(router.asPath || "/")}`)}
                className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-slate-100 hover:bg-white/20 sm:text-sm"
              >
                Đăng nhập để ứng tuyển
              </button>
              <button
                type="button"
                onClick={() => void router.push(`/register?next=${encodeURIComponent(router.asPath || "/")}`)}
                className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-slate-100 hover:bg-white/20 sm:text-sm"
              >
                Tạo tài khoản
              </button>
            </>
          )}
        </div>
      </header>

      {canAccessManagement ? (
        <section className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeMainTab("browse")}
            className={
              tab === "browse"
                ? "rounded-xl bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white sm:text-sm"
                : "rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm"
            }
          >
            Việc làm
          </button>
          <button
            type="button"
            onClick={() => changeMainTab("manage", manageModuleQuery ?? defaultManageModule)}
            className={
              tab === "manage"
                ? "rounded-xl bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white sm:text-sm"
                : "rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm"
            }
          >
            Quản lý
          </button>
        </section>
      ) : null}

      {loading ? (
        <LoadingState title="Đang tải dữ liệu tuyển dụng..." rows={6} />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void loadPublicData()} />
      ) : tab === "browse" ? (
        <section className="grid gap-4">
          <JobFilters
            keyword={keyword}
            location={location}
            level={level}
            skill={skill}
            salaryMin={salaryMin}
            salaryMax={salaryMax}
            activeFilterCount={activeFilterCount}
            isFiltering={isFilteringKeyword}
            locationOptions={locationOptions}
            levelOptions={levelOptions}
            skillOptions={skillOptions}
            onKeywordChange={(value) => startTransition(() => setKeyword(value))}
            onLocationChange={setLocation}
            onLevelChange={setLevel}
            onSkillChange={setSkill}
            onSalaryMinChange={setSalaryMin}
            onSalaryMaxChange={setSalaryMax}
            onReset={resetFilters}
          />

          <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
            <section className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-soft sm:p-4">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2.5">
                <div>
                  <h2 className="text-[17px] font-bold text-slate-900">Việc làm phù hợp</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {activeFilterCount > 0 ? `Đang áp dụng ${activeFilterCount} bộ lọc` : "Danh sách việc làm mới nhất cho bạn"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {filteredJobs.length} kết quả
                  </span>
                  {isFilteringKeyword ? <p className="text-[11px] text-slate-500">Đang cập nhật theo từ khóa...</p> : null}
                </div>
              </div>

              <div className="grid gap-2.5">
                {filteredJobs.length === 0 ? (
                  <EmptyState
                    title="Không tìm thấy công việc phù hợp"
                    description="Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                    actionLabel="Xóa bộ lọc"
                    onAction={resetFilters}
                  />
                ) : (
                  paginatedJobs.map((job) => (
                    <JobCard key={job.id} job={job} selected={selectedJobId === job.id} onSelect={setSelectedJobId} />
                  ))
                )}
              </div>

              {filteredJobs.length > JOBS_PER_PAGE ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">
                    Trang {currentPage}/{totalPages}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trước
                    </button>
                    {paginationNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={
                          pageNumber === currentPage
                            ? "rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white"
                            : "rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        }
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="h-fit min-w-0 w-full xl:sticky xl:top-24">
              <JobQuickDetail job={selectedJob} />
            </aside>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Nhà tuyển dụng nổi bật</h2>
              <span className="text-xs font-semibold text-slate-500">{companies.length} công ty</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {companies.slice(0, 12).map((company) => (
                <article key={company.id} className="min-w-[152px] rounded-xl border border-slate-200 bg-white p-2.5">
                  <div className="mb-2 flex items-center gap-2">
                    <CompanyLogo name={company.name} logo={company.logo} size="sm" />
                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-800">{company.name}</h3>
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-500">{company.address || "Đang cập nhật địa chỉ"}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : canAccessManagement ? (
        <section className="grid gap-3">
          <section className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tài khoản quản lý được</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {rbacLoading ? "..." : can("/api/v1/users", "GET") ? users.length : "Không có quyền"}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Hồ sơ ứng tuyển</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {rbacLoading ? "..." : can("/api/v1/resumes", "GET") ? resumes.length : "Không có quyền"}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Vai trò trong hệ thống</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {rbacLoading ? "..." : can("/api/v1/roles", "GET") ? roles.length : "Không có quyền"}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Quyền khả dụng</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{permissionKeys.length}</p>
            </article>
          </section>

          <ManagementPanel
            jobs={jobs}
            companies={companies}
            skills={skills}
            resumes={resumes}
            users={users}
            roles={roles}
            permissions={permissions}
            userCapabilities={userCapabilities}
            createAssignableRoles={assignableRoles}
            rbacLoading={rbacLoading}
            rbacError={rbacError}
            preferredModule={manageModuleQuery}
            onModuleChange={syncManageModule}
            onReloadPublicData={loadPublicData}
            onReloadRbacData={reloadRbacData}
            onCreateJob={(payload) => runProtectedMutation(() => createJob(payload), "Tạo việc làm thành công.")}
            onUpdateJob={(payload) => runProtectedMutation(() => updateJob(payload), "Cập nhật việc làm thành công.")}
            onDeleteJob={(jobId) => runProtectedMutation(() => deleteJob(jobId), "Xóa việc làm thành công.")}
            onCreateCompany={(payload) => runProtectedMutation(() => createCompany(payload), "Tạo công ty thành công.")}
            onUpdateCompany={(payload) => runProtectedMutation(() => updateCompany(payload), "Cập nhật công ty thành công.")}
            onDeleteCompany={(companyId) => runProtectedMutation(() => deleteCompany(companyId), "Xóa công ty thành công.")}
            onCreateSkill={(payload) => runProtectedMutation(() => createSkill(payload), "Tạo kỹ năng thành công.")}
            onUpdateSkill={(payload) => runProtectedMutation(() => updateSkill(payload), "Cập nhật kỹ năng thành công.")}
            onDeleteSkill={(skillId) => runProtectedMutation(() => deleteSkill(skillId), "Xóa kỹ năng thành công.")}
            onUpdateResumeStatus={(resume, nextStatus) =>
              runRbacMutation(
                () =>
                  updateResumeWithAuth({
                    id: resume.id,
                    email: resume.email,
                    url: resume.url,
                    status: nextStatus,
                    user: resume.user?.id ? { id: resume.user.id } : null,
                    job: resume.job?.id ? { id: resume.job.id } : null
                  }),
                "Cập nhật trạng thái hồ sơ thành công."
              )
            }
            onDeleteResume={(resumeId) => runRbacMutation(() => deleteResumeWithAuth(resumeId), "Xóa hồ sơ thành công.")}
            onUploadCompanyLogo={(file) => uploadCompanyLogo(file)}
            onCreateUser={(payload) => runRbacMutation(() => createUserWithAuth(payload), "Tạo tài khoản thành công.")}
            onUpdateUser={(userId, payload) =>
              runRbacMutation(() => updateUserWithAuth(userId, payload), "Cập nhật tài khoản thành công.")
            }
            onDeleteUser={(userId) => runRbacMutation(() => deleteUserWithAuth(userId), "Xóa tài khoản thành công.")}
          />
        </section>
      ) : (
        <EmptyState
          title="Bạn không có quyền truy cập khu vực này"
          description="Khu vực quản trị chỉ hiển thị cho tài khoản có quyền phù hợp."
          actionLabel="Về danh sách việc làm"
          onAction={() => changeMainTab("browse")}
        />
      )}

      {tab === "browse" ? <FloatingChatWidget /> : null}
    </main>
  );
}
