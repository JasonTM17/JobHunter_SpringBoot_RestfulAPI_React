import { useEffect, useMemo, useState } from "react";
import { ResumeItem, ResumeStatus, ResumeStatusAudit } from "../../types/models";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";

interface ResumeManagementPanelProps {
  resumes: ResumeItem[];
  loadingAction: boolean;
  canReadResumes: boolean;
  canUpdateResume: boolean;
  canDeleteResume: boolean;
  auditsByResumeId?: Record<number, ResumeStatusAudit[]>;
  onUpdateResumeStatus: (resume: ResumeItem, nextStatus: ResumeStatus | string, note?: string) => Promise<void>;
  onDeleteResume: (resumeId: number) => Promise<void>;
}

const STATUS_OPTIONS: Array<{ value: ResumeStatus; label: string }> = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "REVIEWING", label: "Đang xem xét" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" }
];

const RESUME_PAGE_SIZE = 8;

function statusLabel(value: ResumeStatus | string): string {
  const match = STATUS_OPTIONS.find((item) => item.value === value);
  return match?.label ?? value;
}

function formatAuditTime(value?: string | null): string {
  if (!value) return "Chưa cập nhật";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(parsed);
}

function auditSummary(audit: ResumeStatusAudit): string {
  const from = audit.previousStatus ? statusLabel(audit.previousStatus) : "Mới";
  const to = statusLabel(audit.nextStatus);
  return `${from} → ${to}`;
}

export default function ResumeManagementPanel({
  resumes,
  loadingAction,
  canReadResumes,
  canUpdateResume,
  canDeleteResume,
  auditsByResumeId = {},
  onUpdateResumeStatus,
  onDeleteResume
}: ResumeManagementPanelProps) {
  const noPermissionTitle = "Bạn không có quyền thực hiện thao tác này.";
  const [statusDraft, setStatusDraft] = useState<Record<number, string>>({});
  const [statusNoteDraft, setStatusNoteDraft] = useState<Record<number, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<ResumeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResumeStatus | "ALL">("ALL");
  const [resumePage, setResumePage] = useState(1);

  const sortedResumes = useMemo(
    () =>
      [...resumes].sort((a, b) => {
        const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
        return bTime - aTime;
      }),
    [resumes]
  );

  const filteredResumes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortedResumes.filter((resume) => {
      if (statusFilter !== "ALL" && String(resume.status || "PENDING") !== statusFilter) {
        return false;
      }
      if (!query) return true;

      const haystack = [
        String(resume.id),
        resume.email,
        resume.user?.name,
        resume.job?.name,
        resume.companyName,
        resume.lastModifiedBy
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [sortedResumes, searchQuery, statusFilter]);

  const resumeTotalPages = Math.max(1, Math.ceil(filteredResumes.length / RESUME_PAGE_SIZE));
  const pagedResumes = useMemo(() => {
    const start = (resumePage - 1) * RESUME_PAGE_SIZE;
    return filteredResumes.slice(start, start + RESUME_PAGE_SIZE);
  }, [filteredResumes, resumePage]);

  useEffect(() => {
    setResumePage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setResumePage((current) => Math.min(current, resumeTotalPages));
  }, [resumeTotalPages]);

  function getDraftStatus(resume: ResumeItem): string {
    return statusDraft[resume.id] ?? String(resume.status || "PENDING");
  }

  async function submitStatus(resume: ResumeItem) {
    const nextStatus = getDraftStatus(resume);
    const note = statusNoteDraft[resume.id]?.trim();
    await onUpdateResumeStatus(resume, nextStatus, note || undefined);
    setStatusDraft((prev) => ({ ...prev, [resume.id]: nextStatus }));
    setStatusNoteDraft((prev) => ({ ...prev, [resume.id]: "" }));
  }

  return (
    <section className="mt-4">
      {!canReadResumes ? (
        <EmptyState
          title="Không đủ quyền xem hồ sơ ứng tuyển"
          description="Tài khoản hiện tại chưa được cấp quyền xem hồ sơ ứng tuyển."
        />
      ) : resumes.length === 0 ? (
        <EmptyState title="Chưa có hồ sơ ứng tuyển" description="Hiện chưa có dữ liệu ứng tuyển phù hợp." />
      ) : (
        <div className="grid gap-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {`Cập nhật trạng thái: ${canUpdateResume ? "Được phép" : "Không được phép"} • `}
            {`Xóa hồ sơ: ${canDeleteResume ? "Được phép" : "Không được phép"}`}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              aria-label="Tìm hồ sơ"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo ứng viên, job, email..."
              className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            <select
              aria-label="Lọc trạng thái hồ sơ"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ResumeStatus | "ALL")}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {filteredResumes.length} hồ sơ
            </span>
          </div>
          {filteredResumes.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
              Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-slate-700">Ứng viên</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">Việc làm</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">CV</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">Trạng thái</th>
                <th className="px-3 py-2 text-left font-bold text-slate-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedResumes.map((resume) => {
                const draft = getDraftStatus(resume);
                const statusChanged = draft !== String(resume.status || "PENDING");
                const audits = auditsByResumeId[resume.id] ?? [];
                const latestAudit = audits[0];

                return (
                  <tr key={resume.id}>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900">{resume.user?.name ?? "Chưa cập nhật"}</p>
                      <p className="text-xs text-slate-500">{resume.email || "Chưa có email"}</p>
                      <p className="text-xs text-slate-500">{resume.companyName || "Chưa có công ty"}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-800">{resume.job?.name ?? "Chưa cập nhật"}</p>
                      <p className="text-xs text-slate-500">Mã hồ sơ: #{resume.id}</p>
                      <p className="text-xs text-slate-500">Cập nhật: {formatAuditTime(resume.lastModifiedDate ?? resume.createdDate)}</p>
                      <p className="text-xs text-slate-500">Người xử lý gần nhất: {resume.lastModifiedBy || "Hệ thống"}</p>
                      {latestAudit ? (
                        <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Audit gần nhất</p>
                          <p className="mt-1 text-xs font-semibold text-slate-700">{auditSummary(latestAudit)}</p>
                          <p className="text-xs text-slate-500">
                            {latestAudit.actorEmail || "Hệ thống"} • {formatAuditTime(latestAudit.createdAt)}
                          </p>
                          {latestAudit.note ? (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-600">{latestAudit.note}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      {resume.url ? (
                        <a
                          href={resume.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Mở CV
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Chưa có URL</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        data-testid={`resume-status-select-${resume.id}`}
                        disabled={!canUpdateResume || loadingAction}
                        title={canUpdateResume ? "Cập nhật trạng thái hồ sơ" : noPermissionTitle}
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:bg-slate-100"
                        value={draft}
                        onChange={(event) =>
                          setStatusDraft((prev) => ({ ...prev, [resume.id]: event.target.value }))
                        }
                      >
                        {STATUS_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                        {!STATUS_OPTIONS.some((item) => item.value === draft) ? (
                          <option value={draft}>{statusLabel(draft)}</option>
                        ) : null}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <input
                          value={statusNoteDraft[resume.id] ?? ""}
                          onChange={(event) =>
                            setStatusNoteDraft((prev) => ({ ...prev, [resume.id]: event.target.value }))
                          }
                          maxLength={500}
                          disabled={!canUpdateResume || loadingAction}
                          placeholder="Ghi chú audit"
                          className="min-w-[160px] rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 outline-none focus:border-rose-400 disabled:bg-slate-100"
                        />
                        <button
                          type="button"
                          data-testid={`resume-status-save-${resume.id}`}
                          disabled={!canUpdateResume || !statusChanged || loadingAction}
                          title={
                            !canUpdateResume
                              ? noPermissionTitle
                              : !statusChanged
                                ? "Không có thay đổi trạng thái."
                                : "Lưu trạng thái mới"
                          }
                          onClick={() => void submitStatus(resume)}
                          className="rounded border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Lưu trạng thái
                        </button>
                        <button
                          type="button"
                          disabled={!canDeleteResume || loadingAction}
                          title={canDeleteResume ? "Xóa hồ sơ ứng tuyển" : noPermissionTitle}
                          onClick={() => setConfirmDelete(resume)}
                          className="rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
          )}
          {filteredResumes.length > RESUME_PAGE_SIZE ? (
            <nav className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Hiển thị {(resumePage - 1) * RESUME_PAGE_SIZE + 1}-{Math.min(filteredResumes.length, resumePage * RESUME_PAGE_SIZE)} / {filteredResumes.length} hồ sơ
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setResumePage((current) => Math.max(1, current - 1))}
                  disabled={resumePage <= 1}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                  {resumePage}/{resumeTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setResumePage((current) => Math.min(resumeTotalPages, current + 1))}
                  disabled={resumePage >= resumeTotalPages}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </nav>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Xác nhận xóa hồ sơ"
        message={
          confirmDelete
            ? `Bạn chắc chắn muốn xóa hồ sơ #${confirmDelete.id} của ${confirmDelete.email}?`
            : ""
        }
        confirmText="Xóa hồ sơ"
        loading={loadingAction}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await onDeleteResume(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </section>
  );
}
