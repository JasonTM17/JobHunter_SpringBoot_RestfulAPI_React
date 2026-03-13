import { Permission } from "../types/models";

function normalizePath(path: string): string {
  const clean = path.trim().replace(/\/+$/, "");
  return clean || "/";
}

function normalizeMethod(method: string): string {
  return method.trim().toUpperCase();
}

function normalizePermissionKey(permissionKey: string): string {
  const [method = "", ...rest] = permissionKey.trim().split(/\s+/);
  return `${normalizeMethod(method)} ${normalizePath(rest.join(" "))}`;
}

export function buildPermissionKey(apiPath: string, method: string): string {
  return `${normalizeMethod(method)} ${normalizePath(apiPath)}`;
}

export function hasPermissionKey(
  permissionKeys: string[] | null | undefined,
  apiPath: string,
  method: string
): boolean {
  if (!permissionKeys || permissionKeys.length === 0) return false;
  const target = buildPermissionKey(apiPath, method);
  return permissionKeys.some((key) => normalizePermissionKey(key) === target);
}

export function hasApiPermission(
  permissions: Permission[] | null | undefined,
  apiPath: string,
  method: string
): boolean {
  if (!permissions || permissions.length === 0) return false;
  const targetPath = normalizePath(apiPath);
  const targetMethod = normalizeMethod(method);

  return permissions.some((permission) => {
    return (
      normalizePath(permission.apiPath) === targetPath &&
      normalizeMethod(permission.method) === targetMethod
    );
  });
}

export function hasManagementPermission(permissionKeys: string[] | null | undefined): boolean {
  if (!permissionKeys || permissionKeys.length === 0) return false;

  const checks: Array<{ apiPath: string; method: string }> = [
    { apiPath: "/api/v1/users", method: "GET" },
    { apiPath: "/api/v1/users", method: "POST" },
    { apiPath: "/api/v1/roles", method: "GET" },
    { apiPath: "/api/v1/permissions", method: "GET" },
    { apiPath: "/api/v1/resumes", method: "GET" },
    { apiPath: "/api/v1/resumes", method: "PUT" },
    { apiPath: "/api/v1/resumes/{id}", method: "DELETE" },
    { apiPath: "/api/v1/jobs", method: "POST" },
    { apiPath: "/api/v1/jobs", method: "PUT" },
    { apiPath: "/api/v1/jobs/{id}", method: "DELETE" },
    { apiPath: "/api/v1/companies", method: "POST" },
    { apiPath: "/api/v1/companies", method: "PUT" },
    { apiPath: "/api/v1/companies/{id}", method: "DELETE" },
    { apiPath: "/api/v1/skills", method: "POST" },
    { apiPath: "/api/v1/skills", method: "PUT" },
    { apiPath: "/api/v1/skills/{id}", method: "DELETE" }
  ];

  return checks.some((item) => hasPermissionKey(permissionKeys, item.apiPath, item.method));
}
