import { resolveWorkspaceKind, workspacePath } from "./workspace";

export function resolveSafeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;
  return value;
}

export function getPostLoginRedirect(
  roleName: string | null | undefined,
  canAccessManagement: boolean,
  fallback = "/"
): string {
  const safeFallback = resolveSafeNextPath(fallback, "/");
  const isFallbackPublicPortal = safeFallback === "/" || safeFallback.startsWith("/jobs/") || safeFallback === "/chatbot";

  if (isFallbackPublicPortal) {
    return safeFallback;
  }

  const workspace = resolveWorkspaceKind(roleName, canAccessManagement);
  return workspacePath(workspace);
}
