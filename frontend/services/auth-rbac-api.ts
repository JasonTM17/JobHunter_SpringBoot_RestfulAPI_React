import { apiRequest } from "./api-client";
import {
  AuthAccountResponse,
  AuthCapabilityResponse,
  AuthLoginResponse,
  CandidateCv,
  CandidateCvPayload,
  EmailPreferenceSetting,
  ForgotPasswordResponse,
  PaginatedData,
  Permission,
  RegisterPayload,
  ResetPasswordResponse,
  ResumeCreatePayload,
  ResumeItem,
  ResumeStatusAudit,
  ResumeStatusUpdatePayload,
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
    body: { username, password }
  });
}

export async function registerAccount(payload: RegisterPayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/auth/register`, {
    method: "POST",
    body: payload
  });
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>(`${API_PREFIX}/auth/forgot-password`, {
    method: "POST",
    body: { email }
  });
}

export async function resetPassword(token: string, password: string): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>(`${API_PREFIX}/auth/reset-password`, {
    method: "POST",
    body: { token, password }
  });
}

export async function fetchCurrentAccount(): Promise<AuthAccountResponse> {
  return apiRequest<AuthAccountResponse>(`${API_PREFIX}/auth/account`, {
    method: "GET"
  });
}

export async function fetchEmailPreferences(): Promise<EmailPreferenceSetting> {
  return apiRequest<EmailPreferenceSetting>(`${API_PREFIX}/auth/preferences/email`, {
    method: "GET"
  });
}

export async function updateEmailPreferences(weeklyJobRecommendationEnabled: boolean): Promise<EmailPreferenceSetting> {
  return apiRequest<EmailPreferenceSetting>(`${API_PREFIX}/auth/preferences/email`, {
    method: "PATCH",
    body: { weeklyJobRecommendationEnabled }
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
    body: payload
  });
}

export async function updateUserWithAuth(userId: number, payload: UserUpdatePayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/users/${userId}`, {
    method: "PUT",
    body: payload
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

export async function fetchResumeAuditsWithAuth(resumeId: number): Promise<ResumeStatusAudit[]> {
  return apiRequest<ResumeStatusAudit[]>(`${API_PREFIX}/resumes/${resumeId}/audits`, {
    method: "GET"
  });
}

export async function createResumeWithAuth(payload: ResumeCreatePayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/resumes`, {
    method: "POST",
    body: payload
  });
}

export async function updateResumeWithAuth(resumeId: number, payload: ResumeStatusUpdatePayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/resumes/${resumeId}/status`, {
    method: "PATCH",
    body: payload
  });
}

export async function deleteResumeWithAuth(resumeId: number): Promise<void> {
  await apiRequest(`${API_PREFIX}/resumes/${resumeId}`, {
    method: "DELETE"
  });
}

export async function fetchCandidateCvsWithAuth(): Promise<CandidateCv[]> {
  return apiRequest<CandidateCv[]>(`${API_PREFIX}/candidate/cvs`, {
    method: "GET"
  });
}

export async function createCandidateCvWithAuth(payload: CandidateCvPayload): Promise<CandidateCv> {
  return apiRequest<CandidateCv>(`${API_PREFIX}/candidate/cvs`, {
    method: "POST",
    body: payload
  });
}

export async function setDefaultCandidateCvWithAuth(cvId: number): Promise<CandidateCv> {
  return apiRequest<CandidateCv>(`${API_PREFIX}/candidate/cvs/${cvId}/default`, {
    method: "PATCH"
  });
}

export async function deleteCandidateCvWithAuth(cvId: number): Promise<void> {
  await apiRequest(`${API_PREFIX}/candidate/cvs/${cvId}`, {
    method: "DELETE"
  });
}
