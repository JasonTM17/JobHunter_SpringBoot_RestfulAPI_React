import { resolveWorkspaceKind, workspacePath } from "./workspace";

export function resolveSafeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;
  return value;
}

function canAccessPathByWorkspace(path: string, kind: "admin" | "recruiter" | "candidate"): boolean {
  const url = new URL(path, "http://localhost");
  const pathname = url.pathname;
  const manageTab = url.searchParams.get("tab");

  if (pathname === "/" && manageTab !== "manage") return true;
  if (pathname.startsWith("/jobs/")) return true;
  if (pathname === "/chatbot") return true;
  if (pathname === "/account") return true;

  if (pathname === "/admin") return kind === "admin";
  if (pathname === "/recruiter") return kind === "recruiter";
  if (pathname === "/candidate") return kind === "candidate";
  if (pathname === "/" && manageTab === "manage") return kind === "admin" || kind === "recruiter";

  return false;
}

export function getPostLoginRedirect(
  roleName: string | null | undefined,
  canAccessManagement: boolean,
  fallback = "/"
): string {
  const workspace = resolveWorkspaceKind(roleName, canAccessManagement);
  const workspaceDefault = workspacePath(workspace);
  const safeFallback = resolveSafeNextPath(fallback, "/");

  if (safeFallback === "/") {
    return workspaceDefault;
  }

  if (canAccessPathByWorkspace(safeFallback, workspace)) {
    return safeFallback;
  }

  return workspaceDefault;
}
