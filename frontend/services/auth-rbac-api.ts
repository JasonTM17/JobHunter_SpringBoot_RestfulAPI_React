import { apiRequest } from "./api-client";
import {
  AuthAccountResponse,
  AuthCapabilityResponse,
  AuthLoginResponse,
  PaginatedData,
  Permission,
  RegisterPayload,
  ResumeCreatePayload,
  ResumeItem,
  ResumeUpdatePayload,
  Role,
  UserActionCapability,
  UserCreatePayload,
  UserListItem,
  UserUpdatePayload
} from "../types/models";

const API_PREFIX = "/api/v1";

type QueryValue = string | number | boolean | null | undefined;

function normalizePaginated<T>(data: PaginatedData<T>) {
  return {
    items: Array.isArray(data?.result) ? data.result : [],
    totalPages: Number(data?.meta?.pages ?? 1)
  };
}

async function fetchPageWithAuth<T>(
  path: string,
  page: number,
  size: number,
  query?: Record<string, QueryValue>,
  method: "GET" | "POST" = "GET"
) {
  const mergedQuery = { page, size, ...(query ?? {}) };
  const data = await apiRequest<PaginatedData<T>>(path, { method }, mergedQuery);
  return normalizePaginated(data);
}

async function fetchAllPagesWithAuth<T>(
  path: string,
  size = 50,
  query?: Record<string, QueryValue>,
  method: "GET" | "POST" = "GET"
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 0;
  let pages = 1;

  while (page < pages) {
    const current = await fetchPageWithAuth<T>(path, page, size, query, method);
    allItems.push(...current.items);
    pages = Math.max(1, current.totalPages);
    page += 1;
  }

  return allItems;
}

export async function loginWithPassword(username: string, password: string): Promise<AuthLoginResponse> {
  return apiRequest<AuthLoginResponse>(`${API_PREFIX}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function registerAccount(payload: RegisterPayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/auth/register`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchCurrentAccount(): Promise<AuthAccountResponse> {
  return apiRequest<AuthAccountResponse>(`${API_PREFIX}/auth/account`, {
    method: "GET"
  });
}

export async function fetchAuthCapabilities(): Promise<AuthCapabilityResponse> {
  return apiRequest<AuthCapabilityResponse>(`${API_PREFIX}/auth/capabilities`, {
    method: "GET"
  });
}

export async function fetchUserActionCapabilityWithAuth(userId: number): Promise<UserActionCapability> {
  return apiRequest<UserActionCapability>(`${API_PREFIX}/auth/capabilities/users/${userId}`, {
    method: "GET"
  });
}

export async function logoutCurrentSession(): Promise<void> {
  await apiRequest(`${API_PREFIX}/auth/logout`, {
    method: "POST"
  });
}

export async function fetchUsersWithAuth(): Promise<UserListItem[]> {
  return fetchAllPagesWithAuth<UserListItem>(`${API_PREFIX}/users`, 50);
}

export async function createUserWithAuth(payload: UserCreatePayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/users`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateUserWithAuth(userId: number, payload: UserUpdatePayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteUserWithAuth(userId: number): Promise<void> {
  await apiRequest(`${API_PREFIX}/users/${userId}`, {
    method: "DELETE"
  });
}

export async function fetchRolesWithAuth(): Promise<Role[]> {
  return fetchAllPagesWithAuth<Role>(`${API_PREFIX}/roles`, 50);
}

export async function fetchPermissionsWithAuth(): Promise<Permission[]> {
  return fetchAllPagesWithAuth<Permission>(`${API_PREFIX}/permissions`, 80);
}

export async function fetchResumesWithAuth(): Promise<ResumeItem[]> {
  return fetchAllPagesWithAuth<ResumeItem>(`${API_PREFIX}/resumes`, 50);
}

export async function fetchCurrentUserResumesWithAuth(): Promise<ResumeItem[]> {
  return fetchAllPagesWithAuth<ResumeItem>(`${API_PREFIX}/resumes/by-user`, 50, undefined, "POST");
}

export async function createResumeWithAuth(payload: ResumeCreatePayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/resumes`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateResumeWithAuth(payload: ResumeUpdatePayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/resumes`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteResumeWithAuth(resumeId: number): Promise<void> {
  await apiRequest(`${API_PREFIX}/resumes/${resumeId}`, {
    method: "DELETE"
  });
}
