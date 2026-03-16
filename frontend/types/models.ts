export type Level = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE" | "SENIOR";

export interface ApiEnvelope<T> {
  statusCode: number;
  error: string | null;
  message: string | string[] | null;
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface PaginatedData<T> {
  meta?: PaginationMeta;
  result?: T[];
}

export interface BaseAudit {
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
}

export interface Skill extends BaseAudit {
  id: number;
  name: string;
}

export interface Permission extends BaseAudit {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

export interface Role extends BaseAudit {
  id: number;
  name: string;
  description?: string | null;
  active?: boolean;
  permissions?: Permission[] | null;
}

export interface RoleOption {
  id: number;
  name: string;
}

export interface Company extends BaseAudit {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  logo?: string | null;
}

export interface Job extends BaseAudit {
  id: number;
  name: string;
  location: string;
  salary: number;
  quantity: number;
  level?: Level | string | null;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  company?: Company | null;
  skills?: Skill[] | null;
}

export interface UploadFileResponse {
  fileName: string;
  folder: string;
  fileUrl: string;
  contentType?: string | null;
  size: number;
  uploadedAt: string;
}

export interface UserCompanyRef {
  id: number;
  name: string;
}

export interface UserRoleRef {
  id: number;
  name: string;
}

export interface UserListItem {
  id: number;
  name: string;
  age: number;
  email: string;
  address?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  createdDate?: string | null;
  company?: UserCompanyRef | null;
  role?: UserRoleRef | null;
}

export interface UserUpdatePayload {
  name: string;
  age: number;
  address: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  company?: { id: number } | null;
  role?: { id: number } | null;
}

export interface UserCreatePayload extends UserUpdatePayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  age?: number;
  address?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role?: AuthRole | null;
  weeklyJobRecommendationEnabled?: boolean;
}

export interface AuthRole {
  name: string;
}

export interface AuthLoginResponse {
  user?: AuthUser;
}

export interface AuthAccountResponse {
  user?: AuthUser;
}

export interface EmailPreferenceSetting {
  weeklyJobRecommendationEnabled: boolean;
}

export interface AuthCapabilityResponse {
  actionKeys: string[];
  canAccessManagement: boolean;
  assignableRoles: RoleOption[];
}

export interface UserActionCapability {
  targetUserId: number;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssignRole: boolean;
  assignableRoles: RoleOption[];
}

export type ResumeStatus = "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";

export interface ResumeUserRef {
  id: number;
  name: string;
}

export interface ResumeJobRef {
  id: number;
  name: string;
}

export interface ResumeItem extends BaseAudit {
  id: number;
  email: string;
  url: string;
  status: ResumeStatus;
  companyName?: string | null;
  user?: ResumeUserRef | null;
  job?: ResumeJobRef | null;
}

export interface ResumeCreatePayload {
  email: string;
  url: string;
  status: ResumeStatus;
  user: { id: number };
  job: { id: number };
}

export interface ResumeUpdatePayload {
  id: number;
  email: string;
  url: string;
  status: ResumeStatus | string;
  user?: { id: number } | null;
  job?: { id: number } | null;
}

export interface JobUpsertPayload {
  id?: number;
  name: string;
  location: string;
  salary: number;
  quantity: number;
  level: Level;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  description: string;
  company: { id: number };
  skills: Array<{ id: number }>;
}

export interface CompanyUpsertPayload {
  id: number;
  name: string;
  address: string;
  description: string;
  logo: string;
}

export interface SkillUpsertPayload {
  id?: number;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
}

export interface ChatResponsePayload {
  reply?: string;
  model?: string;
}

export interface AiAvailabilityResponse {
  available: boolean;
  message?: string | null;
}
