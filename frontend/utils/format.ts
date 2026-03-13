import { STORAGE_BASE_URL } from "../services/api-client";

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatCurrencyVnd(value?: number | null): string {
  if (!value || Number.isNaN(value)) return "Thỏa thuận";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDateVi(value?: string | null): string {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";
  return date.toLocaleDateString("vi-VN");
}

export function formatLevelLabel(value?: string | null): string {
  if (!value) return "Chưa cập nhật";
  const normalized = value.trim().toUpperCase();
  if (normalized === "CHUA_CAP_NHAT" || normalized === "N/A") return "Chưa cập nhật";
  if (normalized === "INTERN") return "Thực tập";
  if (normalized === "FRESHER") return "Mới đi làm";
  if (normalized === "JUNIOR") return "Junior";
  if (normalized === "MIDDLE") return "Middle";
  if (normalized === "SENIOR") return "Senior";
  return value;
}

export function formatLocationLabel(value?: string | null): string {
  if (!value) return "Chưa cập nhật";
  const normalized = value.trim().toUpperCase();
  if (normalized === "REMOTE") return "Làm việc từ xa";
  if (normalized === "HANOI") return "Hà Nội";
  if (normalized === "HOCHIMINH" || normalized === "HCM" || normalized === "TPHCM") return "TP. Hồ Chí Minh";
  if (normalized === "DANANG") return "Đà Nẵng";
  return value;
}

const PERMISSION_ENTITY_LABELS: Record<string, string> = {
  company: "công ty",
  companies: "công ty",
  job: "việc làm",
  jobs: "việc làm",
  permission: "quyền truy cập",
  permissions: "quyền truy cập",
  resume: "hồ sơ ứng tuyển",
  resumes: "hồ sơ ứng tuyển",
  role: "vai trò",
  roles: "vai trò",
  user: "tài khoản",
  users: "tài khoản",
  subscriber: "đăng ký nhận tin",
  subscribers: "đăng ký nhận tin",
  file: "tệp",
  files: "tệp",
  skill: "kỹ năng",
  skills: "kỹ năng"
};

function normalizeEntityName(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  if (PERMISSION_ENTITY_LABELS[normalized]) return PERMISSION_ENTITY_LABELS[normalized];
  if (normalized.endsWith("s")) {
    const singular = normalized.slice(0, -1);
    if (PERMISSION_ENTITY_LABELS[singular]) return PERMISSION_ENTITY_LABELS[singular];
  }
  return raw.trim();
}

export function formatPermissionName(value?: string | null): string {
  if (!value?.trim()) return "Quyền truy cập chưa cập nhật";
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();

  let match = normalized.match(/^create a (.+)$/);
  if (match?.[1]) return `Tạo ${normalizeEntityName(match[1])}`;

  match = normalized.match(/^update a (.+)$/);
  if (match?.[1]) return `Cập nhật ${normalizeEntityName(match[1])}`;

  match = normalized.match(/^delete a (.+)$/);
  if (match?.[1]) return `Xóa ${normalizeEntityName(match[1])}`;

  match = normalized.match(/^get a (.+) by id$/);
  if (match?.[1]) return `Xem chi tiết ${normalizeEntityName(match[1])}`;

  match = normalized.match(/^get (.+) with pagination$/);
  if (match?.[1]) return `Xem danh sách ${normalizeEntityName(match[1])}`;

  if (normalized === "get resumes by current user") return "Xem hồ sơ ứng tuyển của tôi";
  if (normalized === "upload a file") return "Tải tệp lên";
  if (normalized === "download a file") return "Tải tệp về";

  return trimmed;
}

export function formatModuleName(value?: string | null): string {
  if (!value?.trim()) return "Khác";
  const normalized = value.trim().toUpperCase();
  if (normalized === "USERS") return "Tài khoản";
  if (normalized === "ROLES") return "Vai trò";
  if (normalized === "PERMISSIONS") return "Quyền truy cập";
  if (normalized === "JOBS") return "Việc làm";
  if (normalized === "COMPANIES") return "Công ty";
  if (normalized === "SKILLS") return "Kỹ năng";
  if (normalized === "RESUMES") return "Hồ sơ ứng tuyển";
  if (normalized === "SUBSCRIBERS") return "Đăng ký nhận tin";
  if (normalized === "FILES") return "Tệp";
  return value;
}

export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function toIsoDate(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function stripHtml(input?: string | null): string {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function shortText(value: string, length: number): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}...`;
}

export function sanitizeRichText(input?: string | null): string {
  if (!input) return "";
  let safe = input;
  safe = safe.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  safe = safe.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  safe = safe.replace(/\son[a-z]+="[^"]*"/gi, "");
  safe = safe.replace(/\son[a-z]+='[^']*'/gi, "");
  safe = safe.replace(/javascript:/gi, "");
  return safe;
}

function normalizeHeading(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sectionTypeByHeading(heading: string): "description" | "requirements" | "benefits" | "other" {
  const normalized = normalizeHeading(heading);
  if (normalized.includes("mo ta") || normalized.includes("description")) return "description";
  if (normalized.includes("yeu cau") || normalized.includes("requirement")) return "requirements";
  if (normalized.includes("quyen loi") || normalized.includes("benefit")) return "benefits";
  return "other";
}

export function splitDescriptionSections(html?: string | null): {
  description: string;
  requirements: string;
  benefits: string;
} {
  const safeHtml = sanitizeRichText(html);
  if (!safeHtml) {
    return { description: "", requirements: "", benefits: "" };
  }

  const regex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>([\s\S]*?)(?=<h[1-6][^>]*>|$)/gi;
  const matches = Array.from(safeHtml.matchAll(regex));

  if (matches.length === 0) {
    return { description: safeHtml, requirements: "", benefits: "" };
  }

  let description = "";
  let requirements = "";
  let benefits = "";

  matches.forEach((match) => {
    const heading = stripHtml(match[1]);
    const content = match[2] ?? "";
    const sectionType = sectionTypeByHeading(heading);
    if (sectionType === "description") description += content;
    if (sectionType === "requirements") requirements += content;
    if (sectionType === "benefits") benefits += content;
  });

  if (!description) description = safeHtml;
  return { description, requirements, benefits };
}

export function resolveCompanyLogo(logo?: string | null): string | null {
  if (!logo) return null;
  if (logo.startsWith("blob:") || logo.startsWith("data:")) return logo;
  if (/^https?:\/\//i.test(logo)) return logo;
  if (logo.startsWith("/storage/")) return `${STORAGE_BASE_URL}${logo}`;
  if (logo.startsWith("storage/")) return `${STORAGE_BASE_URL}/${logo}`;
  return `${STORAGE_BASE_URL}/storage/company/${logo}`;
}

export function getInitials(name?: string | null): string {
  const safeName = name?.trim() || "JT";
  return safeName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
