const GENERIC_MESSAGE = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
const NETWORK_MESSAGE = "Kết nối tạm thời gián đoạn. Vui lòng thử lại sau ít phút.";
const UNAUTHORIZED_MESSAGE = "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
const NOT_FOUND_MESSAGE = "Không tìm thấy dữ liệu yêu cầu.";
const VALIDATION_MESSAGE = "Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.";

const TECHNICAL_TOKENS = [
  "exception",
  "stack",
  "trace",
  "nullpointer",
  "org.springframework",
  "java.",
  "hibernate",
  "jdbc",
  "sql",
  "openai_api_key",
  "gemini_api_key",
  "authorization",
  "bearer",
  "token",
  "jwt",
  "config",
  "provider"
];

function sanitizeRawMessage(raw: string, fallback: string): string {
  const message = raw.trim();
  if (!message) return fallback;

  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch")
    || normalized.includes("networkerror")
    || normalized.includes("load failed")
    || normalized.includes("timeout")
    || normalized.includes("network")
  ) {
    return NETWORK_MESSAGE;
  }

  if (
    normalized.includes("401")
    || normalized.includes("unauthorized")
    || normalized.includes("token is invalid")
    || normalized.includes("refresh token")
  ) {
    return UNAUTHORIZED_MESSAGE;
  }

  if (
    normalized.includes("403")
    || normalized.includes("forbidden")
    || normalized.includes("permission")
    || normalized.includes("không có quyền")
  ) {
    return FORBIDDEN_MESSAGE;
  }

  if (normalized.includes("404") || normalized.includes("not found")) {
    return NOT_FOUND_MESSAGE;
  }

  if (
    normalized.includes("400")
    || normalized.includes("422")
    || normalized.includes("validation")
    || normalized.includes("bad request")
    || normalized.includes("không hợp lệ")
  ) {
    return VALIDATION_MESSAGE;
  }

  if (normalized.includes("mail_not_configured")) {
    return "Tính năng email hiện chưa sẵn sàng. Vui lòng kiểm tra cấu hình rồi thử lại.";
  }

  if (
    normalized.includes("ai_not_configured")
    || normalized.includes("openai")
    || normalized.includes("gemini")
  ) {
    return "Trợ lý AI hiện chưa sẵn sàng. Vui lòng thử lại sau.";
  }

  if (message.length > 220) {
    return fallback;
  }

  if (TECHNICAL_TOKENS.some((token) => normalized.includes(token))) {
    return fallback;
  }

  return message;
}

export function toUserErrorMessage(error: unknown, fallback = GENERIC_MESSAGE): string {
  if (typeof error === "string") {
    return sanitizeRawMessage(error, fallback);
  }

  if (error instanceof Error) {
    return sanitizeRawMessage(error.message, fallback);
  }

  if (error && typeof error === "object" && "message" in error) {
    const raw = (error as { message?: unknown }).message;
    if (typeof raw === "string") {
      return sanitizeRawMessage(raw, fallback);
    }
  }

  return fallback;
}
