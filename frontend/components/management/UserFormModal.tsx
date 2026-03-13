import { FormEvent, useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";
import { Company, RoleOption, UserCreatePayload, UserListItem, UserUpdatePayload } from "../../types/models";

type Gender = "MALE" | "FEMALE" | "OTHER";

interface UserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialUser?: UserListItem | null;
  companies: Company[];
  createAssignableRoles: RoleOption[];
  editAssignableRoles: RoleOption[];
  allowRoleSelect: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: UserCreatePayload | UserUpdatePayload) => Promise<void>;
}

interface UserFormState {
  name: string;
  age: string;
  email: string;
  password: string;
  address: string;
  gender: Gender;
  companyId: string;
  roleId: string;
}

function initState(user?: UserListItem | null): UserFormState {
  return {
    name: user?.name ?? "",
    age: user?.age ? String(user.age) : "22",
    email: user?.email ?? "",
    password: "",
    address: user?.address ?? "",
    gender: (user?.gender as Gender) ?? "MALE",
    companyId: user?.company?.id ? String(user.company.id) : "",
    roleId: user?.role?.id ? String(user.role.id) : ""
  };
}

export default function UserFormModal({
  open,
  mode,
  initialUser,
  companies,
  createAssignableRoles,
  editAssignableRoles,
  allowRoleSelect,
  submitting,
  onClose,
  onSubmit
}: UserFormModalProps) {
  const [state, setState] = useState<UserFormState>(initState(initialUser));
  const [error, setError] = useState("");

  const roleOptions = useMemo(
    () => [...(mode === "create" ? createAssignableRoles : editAssignableRoles)].sort((a, b) => a.name.localeCompare(b.name)),
    [mode, createAssignableRoles, editAssignableRoles]
  );

  useEffect(() => {
    if (!open) return;
    setState(initState(initialUser));
    setError("");
  }, [open, initialUser]);

  function validate(): string | null {
    if (!state.name.trim()) return "Họ tên là bắt buộc.";
    const age = Number(state.age || "0");
    if (!Number.isFinite(age) || age < 0 || age > 150) return "Tuổi phải trong khoảng 0-150.";
    if (mode === "create" && !state.email.trim()) return "Email là bắt buộc khi tạo tài khoản.";
    if (mode === "create" && state.password.length < 6) return "Mật khẩu tối thiểu 6 ký tự.";
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const basePayload = {
      name: state.name.trim(),
      age: Number(state.age),
      address: state.address.trim(),
      gender: state.gender,
      company: state.companyId ? { id: Number(state.companyId) } : null,
      role: allowRoleSelect && state.roleId ? { id: Number(state.roleId) } : null
    };

    if (mode === "create") {
      const payload: UserCreatePayload = {
        ...basePayload,
        email: state.email.trim(),
        password: state.password
      };
      await onSubmit(payload);
      return;
    }

    const payload: UserUpdatePayload = basePayload;
    await onSubmit(payload);
  }

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Tạo tài khoản mới" : "Cập nhật tài khoản"}
      onClose={onClose}
      widthClassName="max-w-3xl"
    >
      <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Họ tên *</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.name}
              onChange={(event) => setState((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Tuổi *</span>
            <input
              inputMode="numeric"
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.age}
              onChange={(event) =>
                setState((prev) => ({ ...prev, age: event.target.value.replace(/[^\d]/g, "") }))
              }
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Email {mode === "create" ? "*" : ""}</span>
            <input
              type="email"
              disabled={mode === "edit"}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:bg-slate-100"
              value={state.email}
              onChange={(event) => setState((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>

          {mode === "create" ? (
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Mật khẩu *</span>
              <input
                type="password"
                className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                value={state.password}
                onChange={(event) => setState((prev) => ({ ...prev, password: event.target.value }))}
              />
            </label>
          ) : null}

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Giới tính</span>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.gender}
              onChange={(event) => setState((prev) => ({ ...prev, gender: event.target.value as Gender }))}
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-700">Công ty</span>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              value={state.companyId}
              onChange={(event) => setState((prev) => ({ ...prev, companyId: event.target.value }))}
            >
              <option value="">Không gán công ty</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-700">Địa chỉ</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            value={state.address}
            onChange={(event) => setState((prev) => ({ ...prev, address: event.target.value }))}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-700">
            Vai trò {allowRoleSelect ? "" : "(không đủ quyền gán vai trò cho đối tượng này)"}
          </span>
          <select
            disabled={!allowRoleSelect}
            className="rounded-xl border border-slate-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:bg-slate-100"
            value={state.roleId}
            onChange={(event) => setState((prev) => ({ ...prev, roleId: event.target.value }))}
          >
            <option value="">Không gán vai trò</option>
            {roleOptions.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang lưu..." : mode === "create" ? "Tạo tài khoản" : "Cập nhật"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
