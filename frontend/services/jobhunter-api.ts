import { ApiClientError, apiRequest } from "./api-client";
import {
  AiAvailabilityResponse,
  ChatResponsePayload,
  Company,
  CompanyUpsertPayload,
  Job,
  JobUpsertPayload,
  PaginatedData,
  Skill,
  SkillUpsertPayload,
  UploadFileResponse
} from "../types/models";

const API_PREFIX = "/api/v1";

export interface PaginatedResult<T> {
  items: T[];
  totalPages: number;
  totalItems: number;
}

const CHAT_NOT_CONFIGURED_MESSAGE = "Tính năng AI hiện chưa được cấu hình trên máy chủ. Vui lòng thử lại sau.";
const CHAT_PROVIDER_ERROR_MESSAGE = "Dịch vụ AI đang tạm gián đoạn. Vui lòng thử lại sau.";
const CHAT_GENERIC_ERROR_MESSAGE = "Không thể gửi câu hỏi tới trợ lý AI. Vui lòng thử lại sau.";

function normalizePaginated<T>(data: PaginatedData<T>): PaginatedResult<T> {
  return {
    items: Array.isArray(data?.result) ? data.result : [],
    totalPages: Number(data?.meta?.pages ?? 1),
    totalItems: Number(data?.meta?.total ?? 0)
  };
}

async function fetchPage<T>(
  resourcePath: string,
  page: number,
  size: number
): Promise<PaginatedResult<T>> {
  const data = await apiRequest<PaginatedData<T>>(resourcePath, undefined, { page, size });
  return normalizePaginated(data);
}

async function fetchAllPages<T>(resourcePath: string, pageSize = 48): Promise<T[]> {
  let page = 0;
  let pages = 1;
  const allItems: T[] = [];

  while (page < pages) {
    const current = await fetchPage<T>(resourcePath, page, pageSize);
    allItems.push(...current.items);
    pages = Math.max(1, current.totalPages);
    page += 1;
  }

  return allItems;
}

function readErrorCode(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const value = (payload as { error?: unknown }).error;
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeChatError(error: unknown): Error {
  if (error instanceof ApiClientError) {
    const errorCode = readErrorCode(error.payload);
    if (errorCode === "AI_NOT_CONFIGURED" || error.status === 503) {
      return new Error(CHAT_NOT_CONFIGURED_MESSAGE);
    }
    if (errorCode === "AI_PROVIDER_ERROR" || error.status >= 500) {
      return new Error(CHAT_PROVIDER_ERROR_MESSAGE);
    }
    return new Error(CHAT_GENERIC_ERROR_MESSAGE);
  }

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();
    if (
      normalized.includes("openai_api_key") ||
      normalized.includes("gemini_api_key") ||
      normalized.includes("ai_not_configured")
    ) {
      return new Error(CHAT_NOT_CONFIGURED_MESSAGE);
    }
    if (
      normalized.includes("openai") ||
      normalized.includes("gemini") ||
      normalized.includes("generativelanguage.googleapis.com")
    ) {
      return new Error(CHAT_PROVIDER_ERROR_MESSAGE);
    }
    if (
      normalized.includes("failed to fetch") ||
      normalized.includes("network") ||
      normalized.includes("timeout") ||
      normalized.includes("load failed")
    ) {
      return new Error("Kết nối tạm thời gián đoạn. Bạn hãy thử lại sau ít phút.");
    }
    return new Error(CHAT_GENERIC_ERROR_MESSAGE);
  }

  return new Error(CHAT_GENERIC_ERROR_MESSAGE);
}

export async function fetchAllJobs(): Promise<Job[]> {
  return fetchAllPages<Job>(`${API_PREFIX}/jobs`, 60);
}

export async function fetchAllCompanies(): Promise<Company[]> {
  return fetchAllPages<Company>(`${API_PREFIX}/companies`, 60);
}

export async function fetchAllSkills(): Promise<Skill[]> {
  return fetchAllPages<Skill>(`${API_PREFIX}/skills`, 120);
}

export async function fetchJobDetail(jobId: number): Promise<Job> {
  if (!Number.isFinite(jobId) || jobId <= 0) {
    throw new Error("ID công việc không hợp lệ.");
  }
  return apiRequest<Job>(`${API_PREFIX}/jobs/${jobId}`);
}

export async function createJob(payload: JobUpsertPayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/jobs`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateJob(payload: JobUpsertPayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/jobs`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteJob(jobId: number): Promise<void> {
  await apiRequest(`${API_PREFIX}/jobs/${jobId}`, {
    method: "DELETE"
  });
}

export async function createCompany(payload: Omit<CompanyUpsertPayload, "id">): Promise<void> {
  await apiRequest(`${API_PREFIX}/companies`, {
    method: "POST",
    body: JSON.stringify({ ...payload, id: 0 })
  });
}

export async function updateCompany(payload: CompanyUpsertPayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/companies`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteCompany(companyId: number): Promise<void> {
  await apiRequest(`${API_PREFIX}/companies/${companyId}`, {
    method: "DELETE"
  });
}

export async function createSkill(payload: SkillUpsertPayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/skills`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateSkill(payload: SkillUpsertPayload): Promise<void> {
  await apiRequest(`${API_PREFIX}/skills`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteSkill(skillId: number): Promise<void> {
  await apiRequest(`${API_PREFIX}/skills/${skillId}`, {
    method: "DELETE"
  });
}

export async function uploadCompanyLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", "company");

  const result = await apiRequest<UploadFileResponse>(`${API_PREFIX}/files`, {
    method: "POST",
    body: form
  });
  return result.fileName;
}

export async function sendChat(message: string): Promise<ChatResponsePayload> {
  try {
    return await apiRequest<ChatResponsePayload>(`${API_PREFIX}/ai/chat`, {
      method: "POST",
      body: JSON.stringify({ message })
    });
  } catch (error) {
    throw normalizeChatError(error);
  }
}

export async function fetchAiAvailability(): Promise<AiAvailabilityResponse> {
  return apiRequest<AiAvailabilityResponse>(`${API_PREFIX}/ai/status`, {
    method: "GET"
  });
}
