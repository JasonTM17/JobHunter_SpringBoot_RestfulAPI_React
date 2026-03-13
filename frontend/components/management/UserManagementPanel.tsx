import { useEffect, useMemo, useState } from "react";
import {
  Company,
  Permission,
  Role,
  RoleOption,
  UserActionCapability,
  UserCreatePayload,
  UserListItem,
  UserUpdatePayload
} from "../../types/models";
import { formatModuleName, formatPermissionName } from "../../utils/format";
import EmptyState from "../common/EmptyState";
import ConfirmDialog from "../common/ConfirmDialog";
import UserFormModal from "./UserFormModal";

function genderLabel(value: string): string {
  if (value === "MALE") return "Nam";
  if (value === "FEMALE") return "Nữ";
  if (value === "OTHER") return "Khác";
  return value;
}

function roleLabel(value?: string | null): string {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return "Chưa gán";
  if (normalized === "SUPER_ADMIN") return "Quản trị hệ thống";
  if (normalized === "ADMIN") return "Quản trị vận hành";
  if (normalized === "RECRUITER") return "Nhà tuyển dụng";
  if (normalized === "USER") return "Ứng viên";
  return value ?? "Chưa gán";
}

interface UserManagementPanelProps {
  users: UserListItem[];
  roles: Role[];
  permissions: Permission[];
  companies: Company[];
  userCapabilities: Record<number, UserActionCapability>;
  createAssignableRoles: RoleOption[];
  loadingAction: boolean;
  canReadUsers: boolean;
  canCreateUser: boolean;
  canReadRoles: boolean;
  canReadPermissions: boolean;
  preferredMode?: "users" | "roles" | "permissions" | null;
  onModeChange?: (mode: "users" | "roles" | "permissions") => void;
  onCreateUser: (payload: UserCreatePayload) => Promise<void>;
  onUpdateUser: (userId: number, payload: UserUpdatePayload) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
}

export default function UserManagementPanel({
  users,
  roles,
  permissions,
  companies,
  userCapabilities,
  createAssignableRoles,
  loadingAction,
  canReadUsers,
  canCreateUser,
  canReadRoles,
  canReadPermissions,
  preferredMode,
  onModeChange,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}: UserManagementPanelProps) {
  const noPermissionTitle = "Bạn không có quyền thực hiện thao tác này.";
  const [mode, setMode] = useState<"users" | "roles" | "permissions">("users");
  const [formState, setFormState] = useState<{
    open: boolean;
    action: "create" | "edit";
    target: UserListItem | null;
  }>({
    open: false,
    action: "create",
    target: null
  });
  const [confirmDelete, setConfirmDelete] = useState<UserListItem | null>(null);
  const [keyword, setKeyword] = useState("");

  const roleOptions = useMemo(() => [...roles].sort((a, b) => a.name.localeCompare(b.name)), [roles]);
  const filteredUsers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const haystack = [
        user.name,
        user.email,
        user.company?.name ?? "",
        user.role?.name ?? "",
        user.address ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, keyword]);

  const permissionGroups = useMemo(() => {
    const byModule = new Map<string, Permission[]>();
    permissions.forEach((permission) => {
      const module = permission.module || "KHÁC";
      if (!byModule.has(module)) byModule.set(module, []);
      byModule.get(module)?.push(permission);
    });
    return Array.from(byModule.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const editingCapability = formState.target ? userCapabilities[formState.target.id] : undefined;

  useEffect(() => {
    if (!preferredMode) return;
    setMode((prev) => (prev === preferredMode ? prev : preferredMode));
  }, [preferredMode]);

  function changeMode(nextMode: "users" | "roles" | "permissions") {
    setMode(nextMode);
    onModeChange?.(nextMode);
  }

  async function submitUser(payload: UserCreatePayload | UserUpdatePayload) {
    if (formState.action === "create") {
      await onCreateUser(payload as UserCreatePayload);
    } else if (formState.target) {
      await onUpdateUser(formState.target.id, payload as UserUpdatePayload);
    }
    setFormState({ open: false, action: "create", target: null });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-soft sm:p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <h2 className="text-xl font-bold text-slate-900">Quản lý tài khoản và phân quyền</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeMode("users")}
            className={
              mode === "users"
                ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
            }
          >
            Tài khoản
          </button>
          <button
            type="button"
            onClick={() => changeMode("roles")}
            className={
              mode === "roles"
                ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
            }
          >
            Vai trò
          </button>
          <button
            type="button"
            onClick={() => changeMode("permissions")}
            className={
              mode === "permissions"
                ? "rounded-xl bg-slate-900 px-2.5 py-1.5 text-[13px] font-semibold text-white sm:px-3 sm:text-sm"
                : "rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:px-3 sm:text-sm"
            }
          >
            Quyền
          </button>
        </div>
      </header>

      {mode === "users" ? (
        <section className="mt-4">
          {!canReadUsers ? (
            <EmptyState
              title="Không đủ quyền xem tài khoản"
              description="Tài khoản hiện tại chưa được cấp quyền xem danh sách tài khoản."
            />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-slate-500">
                    Từng dòng sẽ tự bật hoặc khóa thao tác theo quyền bạn đang có.
                  </p>
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm theo tên, email, vai trò..."
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  />
                </div>
                <button
                  type="button"
                  disabled={!canCreateUser}
                  title={canCreateUser ? "Tạo tài khoản mới" : noPermissionTitle}
                  onClick={() => setFormState({ open: true, action: "create", target: null })}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  Tạo tài khoản
                </button>
              </div>

              {users.length === 0 ? (
                <EmptyState title="Danh sách tài khoản trống" description="Chưa có tài khoản nào trong hệ thống." />
              ) : filteredUsers.length === 0 ? (
                <EmptyState title="Không có tài khoản phù hợp" description="Thử đổi từ khóa tìm kiếm." />
              ) : (
                <div className="w-full overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Họ tên</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Email</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Công ty</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Vai trò</th>
                        <th className="px-3 py-2 text-left font-bold text-slate-700">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredUsers.map((user) => {
                        const capability = userCapabilities[user.id];
                        const canUpdateRow = Boolean(capability?.canUpdate);
                        const canDeleteRow = Boolean(capability?.canDelete);

                        return (
                          <tr key={user.id}>
                            <td className="px-3 py-2">
                              <p className="font-semibold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">
                                Tuổi: {user.age} • {genderLabel(user.gender)}
                              </p>
                            </td>
                            <td className="px-3 py-2">{user.email}</td>
                            <td className="px-3 py-2">{user.company?.name ?? "Chưa cập nhật"}</td>
                            <td className="px-3 py-2">{roleLabel(user.role?.name)}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  disabled={!canUpdateRow}
                                  title={canUpdateRow ? "Sửa tài khoản" : noPermissionTitle}
                                  onClick={() => setFormState({ open: true, action: "edit", target: user })}
                                  className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  disabled={!canDeleteRow}
                                  title={canDeleteRow ? "Xóa tài khoản" : noPermissionTitle}
                                  onClick={() => setConfirmDelete(user)}
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
            </>
          )}
        </section>
      ) : null}

      {mode === "roles" ? (
        <section className="mt-4">
          {!canReadRoles ? (
            <EmptyState
              title="Không đủ quyền xem vai trò"
              description="Tài khoản hiện tại chưa được cấp quyền xem danh sách vai trò."
            />
          ) : roleOptions.length === 0 ? (
            <EmptyState title="Không có vai trò nào" description="API vai trò không trả dữ liệu." />
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {roleOptions.map((role) => (
                <article key={role.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <h3 className="text-sm font-bold text-slate-900">{roleLabel(role.name)}</h3>
                  <p className="mt-1 text-xs text-slate-500">{role.description || "Chưa có mô tả."}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Mã vai trò: {role.name} • Trạng thái: {role.active ? "Hoạt động" : "Không hoạt động"} • Số quyền:{" "}
                    {Array.isArray(role.permissions) ? role.permissions.length : "Chưa rõ"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {mode === "permissions" ? (
        <section className="mt-4">
          {!canReadPermissions ? (
            <EmptyState
              title="Không đủ quyền xem danh sách quyền"
              description="Tài khoản hiện tại chưa được cấp quyền xem danh sách quyền."
            />
          ) : permissionGroups.length === 0 ? (
            <EmptyState title="Không có quyền nào" description="API quyền không trả dữ liệu." />
          ) : (
            <div className="grid gap-3">
              {permissionGroups.map(([module, modulePermissions]) => (
                <article key={module} className="rounded-xl border border-slate-200 bg-white p-3">
                  <h3 className="text-sm font-bold text-slate-900">{formatModuleName(module)}</h3>
                  <div className="mt-2 grid gap-1">
                    {modulePermissions.map((permission) => (
                      <article key={permission.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                        <p className="text-xs font-semibold text-slate-800">{formatPermissionName(permission.name)}</p>
                        <p className="text-[11px] text-slate-500">
                          {permission.method} • {permission.apiPath}
                        </p>
                      </article>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <UserFormModal
        open={formState.open}
        mode={formState.action}
        initialUser={formState.target}
        companies={companies}
        createAssignableRoles={createAssignableRoles}
        editAssignableRoles={editingCapability?.assignableRoles ?? []}
        allowRoleSelect={formState.action === "create" ? canCreateUser : Boolean(editingCapability?.canAssignRole)}
        submitting={loadingAction}
        onClose={() => setFormState({ open: false, action: "create", target: null })}
        onSubmit={submitUser}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Xác nhận xóa tài khoản"
        message={
          confirmDelete
            ? `Bạn chắc chắn muốn xóa tài khoản ${confirmDelete.name} (${confirmDelete.email})?`
            : ""
        }
        confirmText="Xóa tài khoản"
        loading={loadingAction}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await onDeleteUser(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </section>
  );
}
