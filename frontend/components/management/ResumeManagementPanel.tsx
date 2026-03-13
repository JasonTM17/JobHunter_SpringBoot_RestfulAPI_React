import { useMemo, useState } from "react";
import { ResumeItem, ResumeStatus } from "../../types/models";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";

interface ResumeManagementPanelProps {
  resumes: ResumeItem[];
  loadingAction: boolean;
  canReadResumes: boolean;
  canUpdateResume: boolean;
  canDeleteResume: boolean;
  onUpdateResumeStatus: (resume: ResumeItem, nextStatus: ResumeStatus | string) => Promise<void>;
  onDeleteResume: (resumeId: number) => Promise<void>;
}

const STATUS_OPTIONS: Array<{ value: ResumeStatus; label: string }> = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "REVIEWING", label: "Đang xem xét" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" }
];

function statusLabel(value: ResumeStatus | string): string {
  const match = STATUS_OPTIONS.find((item) => item.value === value);
  return match?.label ?? value;
}

export default function ResumeManagementPanel({
  resumes,
  loadingAction,
  canReadResumes,
  canUpdateResume,
  canDeleteResume,
  onUpdateResumeStatus,
  onDeleteResume
}: ResumeManagementPanelProps) {
  const noPermissionTitle = "Bạn không có quyền thực hiện thao tác này.";
  const [statusDraft, setStatusDraft] = useState<Record<number, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<ResumeItem | null>(null);

  const sortedResumes = useMemo(
    () =>
      [...resumes].sort((a, b) => {
        const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
        return bTime - aTime;
      }),
    [resumes]
  );

  function getDraftStatus(resume: ResumeItem): string {
    return statusDraft[resume.id] ?? String(resume.status || "PENDING");
  }

  async function submitStatus(resume: ResumeItem) {
    const nextStatus = getDraftStatus(resume);
    await onUpdateResumeStatus(resume, nextStatus);
    setStatusDraft((prev) => ({ ...prev, [resume.id]: nextStatus }));
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
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {`Cập nhật trạng thái: ${canUpdateResume ? "Được phép" : "Không được phép"} • `}
            {`Xóa hồ sơ: ${canDeleteResume ? "Được phép" : "Không được phép"}`}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
              {sortedResumes.map((resume) => {
                const draft = getDraftStatus(resume);
                const statusChanged = draft !== String(resume.status || "PENDING");

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
                        <button
                          type="button"
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
