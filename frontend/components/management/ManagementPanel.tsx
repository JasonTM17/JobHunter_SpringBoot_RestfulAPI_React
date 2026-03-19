import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/auth-context";
import {
  Company,
  CompanyUpsertPayload,
  Job,
  JobUpsertPayload,
  Permission,
  ResumeItem,
  Role,
  RoleOption,
  Skill,
  SkillUpsertPayload,
  UploadFileResponse,
  UserActionCapability,
  UserCreatePayload,
  UserListItem,
  UserUpdatePayload
} from "../../types/models";
import { formatCurrencyVnd, shortText, stripHtml } from "../../utils/format";
import CompanyLogo from "../common/CompanyLogo";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import AuthAccessPanel from "./AuthAccessPanel";
import CompanyFormModal from "./CompanyFormModal";
import JobFormModal from "./JobFormModal";
import ResumeManagementPanel from "./ResumeManagementPanel";
import SkillFormModal from "./SkillFormModal";
import UserManagementPanel from "./UserManagementPanel";

type PublicEntity = "jobs" | "companies" | "skills" | "resumes";
type RbacEntity = "users" | "roles" | "permissions";
type ManagementModule = PublicEntity | RbacEntity;
type PublicConfirmTarget = { entity: PublicEntity; id: number; name: string } | null;
type ManagementTab = "public-crud" | "rbac";

const ENTITY_LABEL: Record<PublicEntity, string> = {
  jobs: "việc làm",
  companies: "công ty",
  skills: "kỹ năng",
  resumes: "hồ sơ ứng tuyển"
};

interface ManagementPanelProps {
  jobs: Job[];
  companies: Company[];
  skills: Skill[];
  resumes: ResumeItem[];
  users: UserListItem[];
  roles: Role[];
  permissions: Permission[];
  userCapabilities: Record<number, UserActionCapability>;
  createAssignableRoles: RoleOption[];
  rbacLoading: boolean;
  rbacError: string;
  onReloadPublicData: () => Promise<void>;
  onReloadRbacData: () => Promise<void>;
  onCreateJob: (payload: JobUpsertPayload) => Promise<void>;
  onUpdateJob: (payload: JobUpsertPayload) => Promise<void>;
  onDeleteJob: (jobId: number) => Promise<void>;
  onCreateCompany: (payload: Omit<CompanyUpsertPayload, "id">) => Promise<void>;
  onUpdateCompany: (payload: CompanyUpsertPayload) => Promise<void>;
  onDeleteCompany: (companyId: number) => Promise<void>;
  onCreateSkill: (payload: SkillUpsertPayload) => Promise<void>;
  onUpdateSkill: (payload: SkillUpsertPayload) => Promise<void>;
  onDeleteSkill: (skillId: number) => Promise<void>;
  onUpdateResumeStatus: (resume: ResumeItem, status: string) => Promise<void>;
  onDeleteResume: (resumeId: number) => Promise<void>;
  onUploadCompanyLogo: (file: File) => Promise<UploadFileResponse>;
  onCreateUser: (payload: UserCreatePayload) => Promise<void>;
  onUpdateUser: (userId: number, payload: UserUpdatePayload) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
  preferredModule?: ManagementModule | null;
  onModuleChange?: (module: ManagementModule) => void;
}

export default function ManagementPanel({
  jobs,
  companies,
  skills,
  resumes,
  users,
  roles,
  permissions,
  userCapabilities,
  createAssignableRoles,
  rbacLoading,
  rbacError,
  onReloadPublicData,
  onReloadRbacData,
  onCreateJob,
  onUpdateJob,
  onDeleteJob,
  onCreateCompany,
  onUpdateCompany,
  onDeleteCompany,
  onCreateSkill,
  onUpdateSkill,
  onDeleteSkill,
  onUpdateResumeStatus,
  onDeleteResume,
  onUploadCompanyLogo,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  preferredModule,
  onModuleChange
}: ManagementPanelProps) {
  const { status, roleName, permissionKeys, can } = useAuth();

  const [tab, setTab] = useState<ManagementTab>("public-crud");
  const [publicTab, setPublicTab] = useState<PublicEntity>("jobs");
  const [rbacMode, setRbacMode] = useState<RbacEntity>("users");
  const [loadingAction, setLoadingAction] = useState(false);
  const [reloadingPublic, setReloadingPublic] = useState(false);
  const [reloadingRbac, setReloadingRbac] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<PublicConfirmTarget>(null);

  const [jobModal, setJobModal] = useState<{ open: boolean; mode: "create" | "edit"; target: Job | null }>({
    open: false,
    mode: "create",
    target: null
  });
  const [companyModal, setCompanyModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: Company | null;
  }>({
    open: false,
    mode: "create",
    target: null
  });
  const [skillModal, setSkillModal] = useState<{ open: boolean; mode: "create" | "edit"; target: Skill | null }>({
    open: false,
    mode: "create",
    target: null
  });

  const [jobSearch, setJobSearch] = useState("");
  const [showInactiveJobs, setShowInactiveJobs] = useState(false);
  const [companySearch, setCompanySearch] = useState("");

  const filteredJobs = useMemo(
    () =>
      jobs.filter((j) => {
        const q = jobSearch.toLowerCase();
        if (q && !j.name.toLowerCase().includes(q) && !j.company?.name?.toLowerCase().includes(q)) return false;
        if (!showInactiveJobs && !j.active) return false;
        return true;
      }),
    [jobs, jobSearch, showInactiveJobs]
  );

  const filteredCompanies = useMemo(
    () =>
      companies.filter(
        (c) =>
          !companySearch ||
          c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
          c.address?.toLowerCase().includes(companySearch.toLowerCase())
      ),
    [companies, companySearch]
  );

  const canCreateJob = can("/api/v1/jobs", "POST");
  const canUpdateJob = can("/api/v1/jobs", "PUT");
  const canDeleteJob = can("/api/v1/jobs/{id}", "DELETE");

  const canCreateCompany = can("/api/v1/companies", "POST");
  const canUpdateCompany = can("/api/v1/companies", "PUT");
  const canDeleteCompany = can("/api/v1/companies/{id}", "DELETE");

  const canCreateSkill = can("/api/v1/skills", "POST");
  const canUpdateSkill = can("/api/v1/skills", "PUT");
  const canDeleteSkill = can("/api/v1/skills/{id}", "DELETE");

  const canReadResumes = can("/api/v1/resumes", "GET");
  const canUpdateResumes = can("/api/v1/resumes", "PUT");
  const canDeleteResumes = can("/api/v1/resumes/{id}", "DELETE");

  const canReadUsers = can("/api/v1/users", "GET");
  const canCreateUser = can("/api/v1/users", "POST");
  const canReadRoles = can("/api/v1/roles", "GET");
  const canReadPermissions = can("/api/v1/permissions", "GET");
  const canManageJobs = canCreateJob || canUpdateJob || canDeleteJob;
  const canManageCompanies = canCreateCompany || canUpdateCompany || canDeleteCompany;
  const canManageSkills = canCreateSkill || canUpdateSkill || canDeleteSkill;
  const canAccessRbac = canReadUsers || canCreateUser || canReadRoles || canReadPermissions;

  const sortedUsers = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const noPermissionTitle = "Bạn không có quyền thực hiện thao tác này.";

  function getFirstAllowedRbacMode(): RbacEntity {
    if (canReadUsers || canCreateUser) return "users";
    if (canReadRoles) return "roles";
    if (canReadPermissions) return "permissions";
    return "users";
  }

  function resolveAllowedRbacMode(nextMode: RbacEntity): RbacEntity {
    if (nextMode === "users" && (canReadUsers || canCreateUser)) return "users";
    if (nextMode === "roles" && canReadRoles) return "roles";
    if (nextMode === "permissions" && canReadPermissions) return "permissions";
    return getFirstAllowedRbacMode();
  }

  useEffect(() => {
    if (publicTab === "resumes" && !canReadResumes) {
      setPublicTab("jobs");
    }
  }, [publicTab, canReadResumes]);

  useEffect(() => {
    if (tab === "rbac" && !canAccessRbac) {
      setTab("public-crud");
    }
  }, [tab, canAccessRbac]);

  useEffect(() => {
    if (!preferredModule) return;

    if (preferredModule === "jobs" || preferredModule === "companies" || preferredModule === "skills" || preferredModule === "resumes") {
      const nextPublicTab = preferredModule === "resumes" && !canReadResumes ? "jobs" : preferredModule;
      setTab("public-crud");
      setPublicTab((prev) => (prev === nextPublicTab ? prev : nextPublicTab));
      return;
    }

    if (!canAccessRbac) {
      const fallbackModule: PublicEntity = canReadResumes ? "resumes" : "jobs";
      setTab("public-crud");
      setPublicTab((prev) => (prev === fallbackModule ? prev : fallbackModule));
      onModuleChange?.(fallbackModule);
      return;
    }
    const nextMode = resolveAllowedRbacMode(preferredModule);
    setTab("rbac");
    setRbacMode((prev) => (prev === nextMode ? prev : nextMode));
  }, [preferredModule, canReadResumes, canAccessRbac, canReadUsers, canCreateUser, canReadRoles, canReadPermissions]);

  function selectPublicTab(nextTab: PublicEntity) {
    const safeTab = nextTab === "resumes" && !canReadResumes ? "jobs" : nextTab;
    setTab("public-crud");
    setPublicTab(safeTab);
    onModuleChange?.(safeTab);
  }

  function selectRbacMode(nextMode: RbacEntity) {
    if (!canAccessRbac) return;
    const safeMode = resolveAllowedRbacMode(nextMode);
    setTab("rbac");
    setRbacMode(safeMode);
    onModuleChange?.(safeMode);
  }

  async function reloadPublicData() {
    setReloadingPublic(true);
    try {
      await onReloadPublicData();
    } finally {
      setReloadingPublic(false);
    }
  }

  async function reloadRbacData() {
    setReloadingRbac(true);
    try {
      await onReloadRbacData();
    } finally {
      setReloadingRbac(false);
    }
  }

  async function runAction(action: () => Promise<void>) {
    setLoadingAction(true);
    try {
      await action();
    } finally {
      setLoadingAction(false);
    }
  }

  async function confirmDelete() {
    if (!confirmTarget) return;
    setConfirming(true);
    try {
      if (confirmTarget.entity === "jobs") await onDeleteJob(confirmTarget.id);
      if (confirmTarget.entity === "companies") await onDeleteCompany(confirmTarget.id);
      if (confirmTarget.entity === "skills") await onDeleteSkill(confirmTarget.id);
      if (confirmTarget.entity === "resumes") await onDeleteResume(confirmTarget.id);
      setConfirmTarget(null);
    } finally {
      setConfirming(false);
    }
  }

  async function submitJob(payload: JobUpsertPayload) {
    await runAction(async () => {
      if (jobModal.mode === "create") await onCreateJob(payload);
      else await onUpdateJob(payload);
      setJobModal({ open: false, mode: "create", target: null });
    });
  }

  async function submitCompany(payload: CompanyUpsertPayload | Omit<CompanyUpsertPayload, "id">) {
    await runAction(async () => {
      if (companyModal.mode === "create") await onCreateCompany(payload as Omit<CompanyUpsertPayload, "id">);
      else await onUpdateCompany(payload as CompanyUpsertPayload);
      setCompanyModal({ open: false, mode: "create", target: null });
    });
  }

  async function submitSkill(payload: SkillUpsertPayload) {
    await runAction(async () => {
      if (skillModal.mode === "create") await onCreateSkill(payload);
      else await onUpdateSkill(payload);
      setSkillModal({ open: false, mode: "create", target: null });
    });
  }

  return (
    <section className="grid gap-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cổng quản trị</h2>
            <p className="mt-1 text-xs text-slate-500">
              Mọi thao tác đều kiểm tra quyền truy cập theo vai trò hiện tại.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void reloadPublicData()}
              disabled={reloadingPublic || loadingAction}
              className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:text-sm"
            >
              Tải lại dữ liệu công khai
            </button>
            <button
              type="button"
              onClick={() => void reloadRbacData()}
              disabled={reloadingRbac || loadingAction}
              className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:text-sm"
            >
              Tải lại quyền truy cập
            </button>
          </div>
        </header>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectPublicTab(publicTab)}
            className={
              tab === "public-crud"
                ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
            }
          >
            Quản lý dữ liệu
          </button>
          <button
            type="button"
            onClick={() => selectRbacMode(rbacMode)}
            disabled={!canAccessRbac}
            title={canAccessRbac ? "Mở quản lý tài khoản và phân quyền" : "Mục này chỉ hiện khi tài khoản có quyền liên quan"}
            className={
              tab === "rbac"
                ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
            }
          >
            Tài khoản & phân quyền
          </button>
        </div>
      </section>

      {tab === "public-crud" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectPublicTab("jobs")}
              className={
                publicTab === "jobs"
                  ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                  : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
              }
            >
              Việc làm ({jobs.length})
            </button>
            <button
              type="button"
              onClick={() => selectPublicTab("companies")}
              className={
                publicTab === "companies"
                  ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                  : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
              }
            >
              Công ty ({companies.length})
            </button>
            <button
              type="button"
              onClick={() => selectPublicTab("skills")}
              className={
                publicTab === "skills"
                  ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                  : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
              }
            >
              Kỹ năng ({skills.length})
            </button>
            <button
              type="button"
              onClick={() => selectPublicTab("resumes")}
              disabled={!canReadResumes}
              title={canReadResumes ? "Mở danh sách hồ sơ ứng tuyển" : "Bạn chưa có quyền xem hồ sơ ứng tuyển"}
              className={
                publicTab === "resumes"
                  ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                  : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
              }
            >
              Hồ sơ ứng tuyển ({rbacLoading ? "Đang tải..." : canReadResumes ? resumes.length : "Không có quyền"})
            </button>
          </div>

          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {`Việc làm: ${canManageJobs ? "Có thể thao tác" : "Chỉ xem"} • `}
            {`Công ty: ${canManageCompanies ? "Có thể thao tác" : "Chỉ xem"} • `}
            {`Kỹ năng: ${canManageSkills ? "Có thể thao tác" : "Chỉ xem"} • `}
            {`Hồ sơ ứng tuyển: ${canReadResumes ? "Có thể xem" : "Đã ẩn do chưa đủ quyền"}`}
          </div>

          {publicTab === "jobs" ? (
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Tìm kiếm việc làm..."
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={showInactiveJobs}
                      onChange={(e) => setShowInactiveJobs(e.target.checked)}
                      className="rounded"
                    />
                    Hiển thị đã đóng ({jobs.filter((j) => !j.active).length})
                  </label>
                </div>
                <button
                  type="button"
                  disabled={!canCreateJob}
                  title={canCreateJob ? "Tạo việc làm mới" : noPermissionTitle}
                  onClick={() => setJobModal({ open: true, mode: "create", target: null })}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tạo việc làm
                </button>
              </div>

              {filteredJobs.length === 0 ? (
                <EmptyState title="Không tìm thấy việc làm phù hợp" description="Thử thay đổi từ khóa tìm kiếm." />
              ) : (
                <div className="w-full overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Việc làm</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Công ty</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Khu vực</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Lương</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Trạng thái</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredJobs.map((job) => (
                        <tr key={job.id} className={!job.active ? "opacity-50" : ""}>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-900">{job.name}</p>
                            <p className="text-xs text-slate-500">{shortText(stripHtml(job.description), 80)}</p>
                          </td>
                          <td className="px-3 py-2">{job.company?.name ?? "Chưa cập nhật"}</td>
                          <td className="px-3 py-2">{job.location}</td>
                          <td className="px-3 py-2">{formatCurrencyVnd(job.salary)}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${job.active ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-100 text-slate-500"}`}
                            >
                              {job.active ? "Đang tuyển" : "Đã đóng"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                disabled={!canUpdateJob}
                                title={canUpdateJob ? "Sửa việc làm" : noPermissionTitle}
                                className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => setJobModal({ open: true, mode: "edit", target: job })}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                disabled={!canDeleteJob}
                                title={canDeleteJob ? "Xóa việc làm" : noPermissionTitle}
                                className="rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => setConfirmTarget({ entity: "jobs", id: job.id, name: job.name })}
                              >
                                Xóa
                              </button>
                              <Link
                                href={`/jobs/${job.id}`}
                                className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Chi tiết
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {publicTab === "companies" ? (
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <input
                  type="search"
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Tìm kiếm công ty..."
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                />
                <button
                  type="button"
                  disabled={!canCreateCompany}
                  title={canCreateCompany ? "Tạo công ty mới" : noPermissionTitle}
                  onClick={() => setCompanyModal({ open: true, mode: "create", target: null })}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tạo công ty
                </button>
              </div>

              {companies.length === 0 && !companySearch ? (
                <EmptyState title="Chưa có công ty" description="Bạn có thể tạo công ty mới." />
              ) : filteredCompanies.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                  Không tìm thấy công ty phù hợp.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCompanies.map((company) => (
                    <article key={company.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start gap-3">
                        <CompanyLogo name={company.name} logo={company.logo} size="md" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900">{company.name}</h3>
                          <p className="mt-1 text-xs text-slate-500">{company.address || "Đang cập nhật địa chỉ"}</p>
                          <p className="mt-1 text-xs text-slate-500">{shortText(stripHtml(company.description), 100)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        <button
                          type="button"
                          disabled={!canUpdateCompany}
                          title={canUpdateCompany ? "Sửa công ty" : noPermissionTitle}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => setCompanyModal({ open: true, mode: "edit", target: company })}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={!canDeleteCompany}
                          title={canDeleteCompany ? "Xóa công ty" : noPermissionTitle}
                          className="rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => setConfirmTarget({ entity: "companies", id: company.id, name: company.name })}
                        >
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {publicTab === "skills" ? (
            <section>
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  disabled={!canCreateSkill}
                  title={canCreateSkill ? "Tạo kỹ năng mới" : noPermissionTitle}
                  onClick={() => setSkillModal({ open: true, mode: "create", target: null })}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tạo kỹ năng
                </button>
              </div>

              {skills.length === 0 ? (
                <EmptyState title="Chưa có kỹ năng" description="Bạn có thể tạo kỹ năng mới." />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {skills.map((skill) => (
                    <article
                      key={skill.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-slate-800">{skill.name}</p>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={!canUpdateSkill}
                          title={canUpdateSkill ? "Sửa kỹ năng" : noPermissionTitle}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => setSkillModal({ open: true, mode: "edit", target: skill })}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={!canDeleteSkill}
                          title={canDeleteSkill ? "Xóa kỹ năng" : noPermissionTitle}
                          className="rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => setConfirmTarget({ entity: "skills", id: skill.id, name: skill.name })}
                        >
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {publicTab === "resumes" ? (
            <ResumeManagementPanel
              resumes={resumes}
              loadingAction={loadingAction}
              canReadResumes={canReadResumes}
              canUpdateResume={canUpdateResumes}
              canDeleteResume={canDeleteResumes}
              onUpdateResumeStatus={(resume, nextStatus) =>
                runAction(() =>
                  onUpdateResumeStatus(resume, nextStatus)
                )
              }
              onDeleteResume={(resumeId) => runAction(() => onDeleteResume(resumeId))}
            />
          ) : null}
        </section>
      ) : null}

      {tab === "rbac" && canAccessRbac ? (
        <section className="grid gap-3">
          <AuthAccessPanel onAfterLogin={reloadRbacData} />
          {status === "authenticated" && permissionKeys.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Tài khoản hiện tại chưa được cấp quyền thao tác. Cổng quản trị đang hiển thị ở chế độ chỉ xem.
            </div>
          ) : null}
          {rbacLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              Đang tải quyền truy cập...
            </div>
          ) : null}
          {rbacError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              Không thể tải một phần dữ liệu quản trị: {rbacError}
            </div>
          ) : null}
          {status !== "authenticated" ? (
            <EmptyState
              title="Chưa đăng nhập quản trị"
              description="Vui lòng đăng nhập để hệ thống hiển thị đúng các quyền quản trị của bạn."
            />
          ) : (
            <UserManagementPanel
              users={sortedUsers}
              roles={roles}
              permissions={permissions}
              companies={companies}
              userCapabilities={userCapabilities}
              createAssignableRoles={createAssignableRoles}
              loadingAction={loadingAction}
              canReadUsers={canReadUsers}
              canCreateUser={canCreateUser}
              canReadRoles={canReadRoles}
              canReadPermissions={canReadPermissions}
              preferredMode={rbacMode}
              onModeChange={(nextMode) => selectRbacMode(nextMode)}
              onCreateUser={(payload) => runAction(() => onCreateUser(payload))}
              onUpdateUser={(userId, payload) => runAction(() => onUpdateUser(userId, payload))}
              onDeleteUser={(userId) => runAction(() => onDeleteUser(userId))}
            />
          )}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Vai trò hiện tại: {roleName ?? "Chưa có"} • Xem tài khoản: {canReadUsers ? "Được phép" : "Không"} • Xem
            vai trò: {canReadRoles ? "Được phép" : "Không"} • Xem danh sách quyền:{" "}
            {canReadPermissions ? "Được phép" : "Không"}
          </div>
        </section>
      ) : null}

      <JobFormModal
        open={jobModal.open}
        mode={jobModal.mode}
        initialJob={jobModal.target}
        companies={companies}
        skills={skills}
        submitting={loadingAction}
        onClose={() => setJobModal({ open: false, mode: "create", target: null })}
        onSubmit={submitJob}
      />

      <CompanyFormModal
        open={companyModal.open}
        mode={companyModal.mode}
        initialCompany={companyModal.target}
        submitting={loadingAction}
        onClose={() => setCompanyModal({ open: false, mode: "create", target: null })}
        onUploadLogo={onUploadCompanyLogo}
        onSubmit={submitCompany}
      />

      <SkillFormModal
        open={skillModal.open}
        mode={skillModal.mode}
        initialSkill={skillModal.target}
        submitting={loadingAction}
        onClose={() => setSkillModal({ open: false, mode: "create", target: null })}
        onSubmit={submitSkill}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Xác nhận xóa"
        message={
          confirmTarget
            ? `Bạn chắc chắn muốn xóa ${ENTITY_LABEL[confirmTarget.entity]}: ${confirmTarget.name}?`
            : ""
        }
        confirmText="Xóa ngay"
        loading={confirming}
        onClose={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
