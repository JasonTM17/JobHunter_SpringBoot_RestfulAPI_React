export type WorkspaceKind = "admin" | "recruiter" | "candidate";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);
const RECRUITER_ROLES = new Set(["HR", "RECRUITER", "MANAGER", "EMPLOYER"]);

function normalizeRole(value?: string | null): string {
  return (value ?? "").trim().toUpperCase();
}

export function resolveWorkspaceKind(
  roleName?: string | null,
  canAccessManagement = false
): WorkspaceKind {
  const normalizedRole = normalizeRole(roleName);

  if (ADMIN_ROLES.has(normalizedRole)) return "admin";
  if (RECRUITER_ROLES.has(normalizedRole)) return "recruiter";
  if (canAccessManagement) return "admin";
  return "candidate";
}

export function workspacePath(kind: WorkspaceKind): string {
  if (kind === "admin") return "/admin";
  if (kind === "recruiter") return "/recruiter";
  return "/candidate";
}

export function canAccessAdminWorkspace(roleName?: string | null, canAccessManagement = false): boolean {
  const normalizedRole = normalizeRole(roleName);
  if (ADMIN_ROLES.has(normalizedRole)) return true;
  if (normalizedRole) return false;
  return canAccessManagement;
}

export function canAccessRecruiterWorkspace(roleName?: string | null): boolean {
  return RECRUITER_ROLES.has(normalizeRole(roleName));
}

export function canAccessCandidateWorkspace(roleName?: string | null, canAccessManagement = false): boolean {
  const kind = resolveWorkspaceKind(roleName, canAccessManagement);
  return kind === "candidate";
}
