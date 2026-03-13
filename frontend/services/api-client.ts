import { ApiEnvelope } from "../types/models";

const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const PUBLIC_STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? PUBLIC_API_BASE_URL;
const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL ?? PUBLIC_API_BASE_URL;
const INTERNAL_STORAGE_BASE_URL =
  process.env.INTERNAL_STORAGE_BASE_URL ?? process.env.INTERNAL_API_BASE_URL ?? PUBLIC_STORAGE_BASE_URL;

const isServerRuntime = typeof window === "undefined";

export const API_BASE_URL = (isServerRuntime ? INTERNAL_API_BASE_URL : PUBLIC_API_BASE_URL).replace(/\/+$/, "");
export const STORAGE_BASE_URL = (isServerRuntime ? INTERNAL_STORAGE_BASE_URL : PUBLIC_STORAGE_BASE_URL).replace(
  /\/+$/,
  ""
);
const REFRESH_ENDPOINT = "/api/v1/auth/refresh";

type QueryValue = string | number | boolean | null | undefined;

export class ApiClientError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function localizeCommonMessage(message: string, statusCode: number): string {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return message;

  if (normalized.includes("you do not have permission")) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }
  if (normalized.includes("access token is not valid")) {
    return "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
  }
  if (normalized.includes("refresh token is not valid")) {
    return "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";
  }
  if (normalized.includes("email already exists")) {
    return "Email đã tồn tại trong hệ thống.";
  }
  if (normalized.includes("not found")) {
    return "Không tìm thấy dữ liệu yêu cầu.";
  }
  if (
    normalized.includes("openai_api_key is not configured on backend") ||
    normalized.includes("gemini_api_key") ||
    normalized.includes("ai_not_configured") ||
    normalized.includes("tính năng ai hiện chưa được cấu hình")
  ) {
    return "Tính năng AI hiện chưa được cấu hình trên máy chủ. Vui lòng thử lại sau.";
  }
  if (
    normalized.includes("openai api error") ||
    normalized.includes("cannot connect to openai") ||
    normalized.includes("openai request was interrupted") ||
    normalized.includes("invalid response from openai") ||
    normalized.includes("generativelanguage.googleapis.com") ||
    normalized.includes("gemini") ||
    normalized.includes("ai_provider_error")
  ) {
    return "Dịch vụ AI đang tạm gián đoạn. Vui lòng thử lại sau.";
  }

  if (statusCode === 401) return "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
  if (statusCode === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (statusCode >= 500) return "Máy chủ đang gặp lỗi. Vui lòng thử lại sau.";

  return message;
}

function extractMessage(payload: unknown, fallbackStatus: number): string {
  if (!isObject(payload)) return `Yêu cầu thất bại với mã ${fallbackStatus}`;

  const rawMessage = payload.message;
  const rawError = payload.error;

  if (Array.isArray(rawMessage)) {
    return localizeCommonMessage(rawMessage.join(", "), fallbackStatus);
  }
  if (typeof rawMessage === "string" && rawMessage.trim()) {
    return localizeCommonMessage(rawMessage, fallbackStatus);
  }
  if (typeof rawError === "string" && rawError.trim()) {
    return localizeCommonMessage(rawError, fallbackStatus);
  }
  return `Yêu cầu thất bại với mã ${fallbackStatus}`;
}

function withQuery(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path, API_BASE_URL);
  if (!query) return url.toString();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function shouldSetJsonHeader(body: BodyInit | null | undefined): boolean {
  if (!body) return true;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  return true;
}

async function parsePayload(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (isObject(payload) && "data" in payload) {
    return (payload as unknown as ApiEnvelope<T>).data;
  }
  return payload as T;
}

let refreshingSessionPromise: Promise<boolean> | null = null;

function noRetry(headers: Headers): boolean {
  const marker = headers.get("x-no-retry");
  return marker === "1" || marker?.toLowerCase() === "true";
}

function shouldAttemptRefresh(path: string, status: number, headers: Headers): boolean {
  if (status !== 401) return false;
  if (noRetry(headers)) return false;
  if (path.startsWith("/api/v1/auth/login")) return false;
  if (path.startsWith("/api/v1/auth/register")) return false;
  if (path.startsWith("/api/v1/auth/refresh")) return false;
  return true;
}

async function refreshSession(): Promise<boolean> {
  if (refreshingSessionPromise) return refreshingSessionPromise;

  refreshingSessionPromise = (async () => {
    try {
      const response = await fetch(withQuery(REFRESH_ENDPOINT), {
        method: "GET",
        credentials: "include",
        headers: {
          "x-no-retry": "1"
        }
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshingSessionPromise = null;
    }
  })();

  return refreshingSessionPromise;
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  query?: Record<string, QueryValue>
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (shouldSetJsonHeader(init?.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = withQuery(path, query);

  const requestInit: RequestInit = {
    ...init,
    credentials: "include",
    headers
  };

  let response = await fetch(url, requestInit);

  if (!response.ok && shouldAttemptRefresh(path, response.status, headers)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(url, requestInit);
    }
  }

  const payload = await parsePayload(response);
  if (!response.ok) {
    throw new ApiClientError(extractMessage(payload, response.status), response.status, payload);
  }

  return unwrapEnvelope<T>(payload);
}
