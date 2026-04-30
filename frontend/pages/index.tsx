import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import FloatingChatWidget from "../components/chat/FloatingChatWidget";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";
import ToastViewport, { ToastItem, ToastType } from "../components/common/ToastViewport";
import AboutSection from "../components/home/AboutSection";
import HomeContentHub from "../components/home/HomeContentHub";
import HomeHero from "../components/home/HomeHero";
import JobsBoard from "../components/home/JobsBoard";
import SubscriberSection from "../components/home/SubscriberSection";
import FeaturedEmployersStrip from "../components/jobs/FeaturedEmployersStrip";
import ManagementPanel from "../components/management/ManagementPanel";
import { useAuth } from "../contexts/auth-context";
import {
  createUserWithAuth,
  deleteResumeWithAuth,
  deleteUserWithAuth,
  fetchPermissionsWithAuth,
  fetchResumeAuditsWithAuth,
  fetchResumesWithAuth,
  fetchRolesWithAuth,
  fetchUserActionCapabilityWithAuth,
  fetchUsersWithAuth,
  updateResumeWithAuth,
  updateUserWithAuth
} from "../services/auth-rbac-api";
import {
  createCompany,
  createJob,
  createSkill,
  createSubscriber,
  deleteCompany,
  deleteJob,
  deleteSkill,
  fetchAllCompanies,
  fetchAllJobs,
  fetchAllSkills,
  fetchPublicJobs,
  fetchSavedJobsWithAuth,
  saveJobWithAuth,
  unsaveJobWithAuth,
  updateCompany,
  updateJob,
  updateSkill,
  uploadCompanyLogo
} from "../services/jobhunter-api";
import {
  Company,
  CompanyUpsertPayload,
  Job,
  JobUpsertPayload,
  Permission,
  ResumeItem,
  ResumeStatusAudit,
  Role,
  Skill,
  SkillUpsertPayload,
  UserActionCapability,
  UserCreatePayload,
  UserListItem,
  UserUpdatePayload
} from "../types/models";
import { addBookmark, bookmarkScopeFromAccount, getBookmarks, removeBookmark, saveBookmarks } from "../utils/bookmarks";
import { toUserErrorMessage } from "../utils/error-message";
import { createId, formatLocationLabel } from "../utils/format";
import { resolveWorkspaceKind, workspacePath } from "../utils/workspace";

type MainTab = "browse" | "manage";
type ManageModule = "jobs" | "companies" | "skills" | "resumes" | "users" | "roles" | "permissions";
const UNKNOWN_LEVEL = "CHUA_CAP_NHAT";
const JOBS_PER_PAGE = 12;
const FEATURED_EMPLOYERS_LIMIT = 6;
const SECONDARY_EMPLOYERS_LIMIT = 12;
const FILTER_QUERY_KEYS = new Set(["q", "location", "level", "skill", "salaryMin", "salaryMax", "sort", "page"]);
const DEFAULT_JOB_SORT = "latest";
const SUPPORTED_JOB_SORTS = new Set([DEFAULT_JOB_SORT, "salary_desc", "deadline_asc"]);
const CITY_HUBS = [
  { label: "TP. Hồ Chí Minh", value: "HOCHIMINH" },
  { label: "Hà Nội", value: "HANOI" },
  { label: "Đà Nẵng", value: "DANANG" },
  { label: "Remote", value: "REMOTE" }
];
const CAMPAIGN_TILES = [
  {
    title: "Upload CV và ứng tuyển nhanh",
    description: "Ứng viên dùng file CV hiện có, theo dõi trạng thái hồ sơ và tránh nộp trùng.",
    action: "Mở tài khoản",
    href: "/account"
  },
  {
    title: "Review JD trước khi apply",
    description: "Trợ lý AI giúp bóc tách kỹ năng, seniority, lương và điểm cần chuẩn bị.",
    action: "Hỏi trợ lý AI",
    href: "/chatbot"
  },
  {
    title: "Recruiter pipeline",
    description: "Nhà tuyển dụng lọc resume theo job, trạng thái, ngày nộp trong cùng workspace.",
    action: "Vào recruiter",
    href: "/recruiter"
  }
];
const FEATURED_ARTICLES = [
  {
    label: "Career guide",
    title: "Checklist CV developer trước khi nộp job IT",
    description: "Cách trình bày kỹ năng, dự án, thành tựu và link portfolio để recruiter quét nhanh.",
    keyword: "CV developer"
  },
  {
    label: "Salary report",
    title: "Đọc khoảng lương IT theo level và city",
    description: "Gợi ý cách so sánh offer theo gross, net, benefits, remote policy và runway học hỏi.",
    keyword: "salary"
  },
  {
    label: "Interview prep",
    title: "Từ JD đến kế hoạch ôn phỏng vấn trong 30 phút",
    description: "Phân loại requirement bắt buộc, nice-to-have và câu hỏi nên chuẩn bị trước vòng technical.",
    keyword: "interview"
  }
];
const EXPERTISE_GROUPS = [
  { title: "Backend", skills: ["Java", "Spring", "NodeJS", "Microservices"], focus: "API, scale, data consistency" },
  { title: "Frontend", skills: ["ReactJS", "TypeScript", "Next.js", "UI"], focus: "Product UI, performance, accessibility" },
  { title: "Data & AI", skills: ["Python", "Data", "AI", "Machine Learning"], focus: "Analytics, recommendation, automation" },
  { title: "Cloud & DevOps", skills: ["AWS", "DevOps", "Docker", "Kubernetes"], focus: "CI/CD, observability, platform reliability" },
  { title: "Mobile", skills: ["React Native", "Flutter", "iOS", "Android"], focus: "Consumer apps, release quality, UX" },
  { title: "QA & Automation", skills: ["QA", "Automation", "Testing", "Selenium"], focus: "Test strategy, regression, release confidence" }
];

interface HomePageProps {
  initialJobs: Job[];
  initialBrowseJobs: Job[];
  initialBrowseTotalItems: number;
  initialBrowseTotalPages: number;
  initialCompanies: Company[];
  initialSkills: Skill[];
  initialError: string;
}

export default function HomePage({
  initialJobs,
  initialBrowseJobs,
  initialBrowseTotalItems,
  initialBrowseTotalPages,
  initialCompanies,
  initialSkills,
  initialError
}: HomePageProps) {
  const router = useRouter();
  const {
    status: authStatus,
    can,
    currentUser,
    assignableRoles,
    permissionKeys,
    canAccessManagement,
    roleName,
    refreshAccount
  } = useAuth();

  const [tab, setTab] = useState<MainTab>("browse");
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [browseJobs, setBrowseJobs] = useState<Job[]>(initialBrowseJobs);
  const [browseTotalItems, setBrowseTotalItems] = useState(initialBrowseTotalItems);
  const [browseTotalPages, setBrowseTotalPages] = useState(initialBrowseTotalPages);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userCapabilities, setUserCapabilities] = useState<Record<number, UserActionCapability>>({});

  const [loading, setLoading] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [rbacLoading, setRbacLoading] = useState(false);
  const [rbacLoaded, setRbacLoaded] = useState(false);
  const [rbacError, setRbacError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [skill, setSkill] = useState("ALL");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [sortMode, setSortMode] = useState(DEFAULT_JOB_SORT);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [savingJobIds, setSavingJobIds] = useState<number[]>([]);
  const [resumeAuditsById, setResumeAuditsById] = useState<Record<number, ResumeStatusAudit[]>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberSkillIds, setSubscriberSkillIds] = useState<number[]>([]);
  const [subscriberSubmitting, setSubscriberSubmitting] = useState(false);
  const [subscriberMessage, setSubscriberMessage] = useState("");
  const [subscriberError, setSubscriberError] = useState("");

  const companiesSectionRef = useRef<HTMLElement>(null);
  const jobsSectionRef = useRef<HTMLElement>(null);
  const secondaryCompaniesScrollRef = useRef<HTMLDivElement>(null);
  const [secondaryScrollLeft, setSecondaryScrollLeft] = useState(false);
  const [secondaryScrollRight, setSecondaryScrollRight] = useState(false);

  const deferredKeyword = useDeferredValue(keyword.trim().toLowerCase());
  const workspace = useMemo(
    () => resolveWorkspaceKind(roleName, canAccessManagement),
    [roleName, canAccessManagement]
  );
  const workspaceHref = useMemo(() => workspacePath(workspace), [workspace]);
  const bookmarkScope = useMemo(() => bookmarkScopeFromAccount(currentUser), [currentUser]);
  const workspaceLabel = useMemo(() => {
    if (workspace === "admin") return "Bảng điều hành quản trị";
    if (workspace === "recruiter") return "Bảng tuyển dụng";
    return "Không gian ứng viên";
  }, [workspace]);

  function renderPublicStat(value: number): string {
    if (loading && value === 0) return "Đang tải...";
    if (error && value === 0) return "Đang cập nhật";
    return String(value);
  }

  function queryWithoutTab(currentQuery: typeof router.query): Record<string, string> {
    const nextQuery: Record<string, string> = {};
    Object.entries(currentQuery).forEach(([key, value]) => {
      if (key === "tab" || key === "module") return;
      if (Array.isArray(value)) {
        if (value[0]) nextQuery[key] = value[0];
      } else if (value) {
        nextQuery[key] = value;
      }
    });
    return nextQuery;
  }

  function queryValue(key: string): string {
    const raw = router.query[key];
    return Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  }

  function queryWithoutFilters(currentQuery: typeof router.query): Record<string, string> {
    const nextQuery = queryWithoutTab(currentQuery);
    FILTER_QUERY_KEYS.forEach((key) => {
      delete nextQuery[key];
    });
    return nextQuery;
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }

  function addToast(type: ToastType, message: string) {
    const safeMessage = type === "error" ? toUserErrorMessage(message) : message.trim();
    if (!safeMessage) return;

    let createdToastId = "";
    setToasts((prev) => {
      const duplicated = prev.some((item) => item.type === type && item.message === safeMessage);
      if (duplicated) {
        return prev;
      }

      createdToastId = createId("toast");
      return [...prev, { id: createdToastId, type, message: safeMessage }];
    });

    if (createdToastId && typeof window !== "undefined") {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== createdToastId));
      }, 4200);
    }
  }

  async function loadPublicData() {
    setLoading(true);
    setError("");
    const messages: string[] = [];
    const [jobsResult, companiesResult, skillsResult] = await Promise.allSettled([
      fetchAllJobs(),
      fetchAllCompanies(),
      fetchAllSkills()
    ]);

    if (jobsResult.status === "fulfilled") {
      const nextJobs = jobsResult.value;
      const sortedJobs = [...nextJobs].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        const aDate = a.endDate ? new Date(a.endDate).getTime() : 0;
        const bDate = b.endDate ? new Date(b.endDate).getTime() : 0;
        return bDate - aDate;
      });
      setJobs(sortedJobs);
    } else {
      setJobs([]);
      messages.push(toUserErrorMessage(jobsResult.reason, "Không thể tải metadata việc làm."));
    }

    if (companiesResult.status === "fulfilled") {
      const nextCompanies = companiesResult.value;
      const sortedCompanies = [...nextCompanies].sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(sortedCompanies);
    } else {
      setCompanies([]);
      messages.push(toUserErrorMessage(companiesResult.reason, "Không thể tải danh sách công ty."));
    }

    if (skillsResult.status === "fulfilled") {
      const nextSkills = skillsResult.value;
      const sortedSkills = [...nextSkills].sort((a, b) => a.name.localeCompare(b.name));
      setSkills(sortedSkills);
    } else {
      setSkills([]);
      messages.push(toUserErrorMessage(skillsResult.reason, "Không thể tải danh sách kỹ năng."));
    }

    setError(messages.join(" "));
    setLoading(false);
  }

  async function loadBrowseJobs() {
    if (salaryRangeInvalid) {
      setBrowseJobs([]);
      setBrowseTotalItems(0);
      setBrowseTotalPages(1);
      return;
    }

    setBrowseLoading(true);
    try {
      const result = await fetchPublicJobs({
        page: currentPage - 1,
        size: JOBS_PER_PAGE,
        q: keyword.trim() || undefined,
        location: location !== "ALL" ? location : undefined,
        level: level !== "ALL" ? level : undefined,
        skill: skill !== "ALL" ? skill : undefined,
        salaryMin: salaryMin || undefined,
        salaryMax: salaryMax || undefined,
        sort: sortMode
      });
      setBrowseJobs(result.items);
      setBrowseTotalItems(result.totalItems);
      setBrowseTotalPages(Math.max(1, result.totalPages));
    } catch (loadError) {
      setBrowseJobs([]);
      setBrowseTotalItems(0);
      setBrowseTotalPages(1);
      addToast("error", toUserErrorMessage(loadError, "Không thể tải danh sách việc làm lúc này."));
    } finally {
      setBrowseLoading(false);
    }
  }

  async function loadSavedJobIds() {
    if (authStatus !== "authenticated") {
      setSavedJobIds(getBookmarks(bookmarkScope));
      return;
    }

    try {
      const savedJobs = await fetchSavedJobsWithAuth();
      const nextIds = savedJobs.map((job) => job.id);
      setSavedJobIds(nextIds);
      saveBookmarks(nextIds, bookmarkScope);
    } catch (loadError) {
      setSavedJobIds(getBookmarks(bookmarkScope));
      addToast("error", toUserErrorMessage(loadError, "Không thể đồng bộ việc làm đã lưu lúc này."));
    }
  }

  async function loadRbacData() {
    if (authStatus !== "authenticated") {
      setUsers([]);
      setRoles([]);
      setPermissions([]);
      setResumes([]);
      setUserCapabilities({});
      setRbacLoaded(false);
      setRbacError("");
      return;
    }

    setRbacLoaded(false);
    setRbacLoading(true);
    setRbacError("");
    const canReadUsers = can("/api/v1/users", "GET");
    const canReadRoles = can("/api/v1/roles", "GET");
    const canReadPermissions = can("/api/v1/permissions", "GET");
    const canReadResumes = can("/api/v1/resumes", "GET");

    try {
      const messages: string[] = [];

      if (canReadUsers) {
        try {
          const usersResult = await fetchUsersWithAuth();
          setUsers(usersResult);

          const capabilityPairs = await Promise.allSettled(
            usersResult.map(async (user) => {
              const capability = await fetchUserActionCapabilityWithAuth(user.id);
              return [user.id, capability] as const;
            })
          );

          const capabilityMap: Record<number, UserActionCapability> = {};
          capabilityPairs.forEach((item) => {
            if (item.status === "fulfilled") {
              const [id, capability] = item.value;
              capabilityMap[id] = capability;
            }
          });
          setUserCapabilities(capabilityMap);
        } catch (usersError) {
          setUsers([]);
          setUserCapabilities({});
          messages.push(`Người dùng: ${toUserErrorMessage(usersError, "Không thể tải danh sách tài khoản.")}`);
        }
      } else {
        setUsers([]);
        setUserCapabilities({});
      }

      if (canReadRoles) {
        try {
          setRoles(await fetchRolesWithAuth());
        } catch (rolesError) {
          setRoles([]);
          messages.push(`Vai trò: ${toUserErrorMessage(rolesError, "Không thể tải danh sách vai trò.")}`);
        }
      } else {
        setRoles([]);
      }

      if (canReadPermissions) {
        try {
          setPermissions(await fetchPermissionsWithAuth());
        } catch (permError) {
          setPermissions([]);
          messages.push(`Quyền: ${toUserErrorMessage(permError, "Không thể tải danh sách quyền.")}`);
        }
      } else {
        setPermissions([]);
      }

      if (canReadResumes) {
        try {
          const resumeItems = await fetchResumesWithAuth();
          setResumes(resumeItems);
          void loadResumeAudits(resumeItems);
        } catch (resumeError) {
          setResumes([]);
          setResumeAuditsById({});
          messages.push(`Ứng tuyển: ${toUserErrorMessage(resumeError, "Không thể tải hồ sơ ứng tuyển.")}`);
        }
      } else {
        setResumes([]);
        setResumeAuditsById({});
      }

      setRbacError(messages.join(" | "));
    } catch (loadError) {
      setRbacError(toUserErrorMessage(loadError, "Không thể tải dữ liệu quản trị lúc này."));
    } finally {
      setRbacLoading(false);
      setRbacLoaded(true);
    }
  }

  async function reloadRbacData() {
    if (authStatus === "authenticated") {
      try {
        await refreshAccount();
      } catch (refreshError) {
        addToast("error", toUserErrorMessage(refreshError, "Không thể đồng bộ lại quyền truy cập."));
      }
    }
    await loadRbacData();
  }

  async function loadResumeAudits(resumeItems: ResumeItem[]) {
    if (!resumeItems.length) {
      setResumeAuditsById({});
      return;
    }

    const settled = await Promise.allSettled(
      resumeItems.map(async (resume) => {
        const audits = await fetchResumeAuditsWithAuth(resume.id);
        return [resume.id, audits] as const;
      })
    );
    const nextAudits: Record<number, ResumeStatusAudit[]> = {};
    settled.forEach((item) => {
      if (item.status === "fulfilled") {
        const [resumeId, audits] = item.value;
        nextAudits[resumeId] = audits;
      }
    });
    setResumeAuditsById(nextAudits);
  }

  const manageModuleQuery = useMemo(() => {
    const raw = router.query.module;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return null;

    const normalized = value.trim().toLowerCase();
    const supported = new Set(["jobs", "companies", "skills", "resumes", "users", "roles", "permissions"]);
    return supported.has(normalized) ? (normalized as ManageModule) : null;
  }, [router.query.module]);

  const defaultManageModule = useMemo<ManageModule>(() => {
    if (workspace === "admin") return "users";
    if (workspace === "recruiter") return "resumes";
    return "jobs";
  }, [workspace]);
  const manageCtaLabel = useMemo(() => {
    if (workspace === "admin") return "Mở quản trị dữ liệu";
    if (workspace === "recruiter") return "Mở công cụ tuyển dụng";
    return "Mở khu quản lý";
  }, [workspace]);

  useEffect(() => {
    void loadPublicData();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.tab;
    const tabQueryValue = Array.isArray(raw) ? raw[0] : raw;
    const wantsManage = tabQueryValue === "manage" || Boolean(manageModuleQuery);

    if (wantsManage && authStatus === "loading") return;

    if (wantsManage && !canAccessManagement) {
      const nextQuery = queryWithoutTab(router.query);
      setTab("browse");
      void router.replace(
        {
          pathname: router.pathname,
          query: nextQuery
        },
        undefined,
        { shallow: true }
      );
      return;
    }

    const nextTab: MainTab = wantsManage ? "manage" : "browse";
    setTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [router.isReady, router.query.tab, authStatus, canAccessManagement, manageModuleQuery]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setUsers([]);
      setRoles([]);
      setPermissions([]);
      setResumes([]);
      setUserCapabilities({});
      setRbacLoaded(false);
      setRbacError("");
      return;
    }
    void reloadRbacData();
  }, [authStatus]);

  useEffect(() => {
    void loadSavedJobIds();
  }, [authStatus, bookmarkScope]);

  const jobsForMetadata = useMemo(() => (jobs.length ? jobs : browseJobs), [jobs, browseJobs]);

  const locationOptions = useMemo(
    () => Array.from(new Set(jobsForMetadata.map((job) => job.location).filter(Boolean))),
    [jobsForMetadata]
  );

  const levelOptions = useMemo(
    () => Array.from(new Set(jobsForMetadata.map((job) => String(job.level || UNKNOWN_LEVEL)).filter(Boolean))),
    [jobsForMetadata]
  );

  const skillOptions = useMemo(
    () => Array.from(new Set(skills.map((item) => item.name).filter(Boolean))),
    [skills]
  );

  const trendingSkillOptions = useMemo(
    () => skillOptions.slice(0, 8),
    [skillOptions]
  );

  const hubSkillOptions = useMemo(() => {
    const preferred = [
      "Java",
      "ReactJS",
      "NodeJS",
      "Python",
      "DevOps",
      "AWS",
      "TypeScript",
      "Spring",
      "Docker",
      "Kubernetes"
    ];
    const available = preferred.filter((item) => skillOptions.includes(item));
    return [...available, ...skillOptions.filter((item) => !available.includes(item))].slice(0, 12);
  }, [skillOptions]);

  const hubCityOptions = useMemo(() => {
    const dynamic = locationOptions.map((item) => ({
      label: formatLocationLabel(item),
      value: item
    }));
    const merged = [...CITY_HUBS, ...dynamic].filter(
      (item, index, array) => array.findIndex((candidate) => candidate.value === item.value) === index
    );
    return merged.slice(0, 8);
  }, [locationOptions]);

  const activeJobsCount = useMemo(
    () => (jobs.length ? jobs.filter((job) => job.active).length : browseTotalItems),
    [jobs, browseTotalItems]
  );
  const activeJobsByCompanyId = useMemo(() => {
    const countMap = new Map<number, number>();
    jobsForMetadata.forEach((job) => {
      if (!job.active || !job.company?.id) return;
      countMap.set(job.company.id, (countMap.get(job.company.id) ?? 0) + 1);
    });
    return countMap;
  }, [jobsForMetadata]);
  const isFilteringKeyword = keyword.trim().toLowerCase() !== deferredKeyword;
  const salaryRangeInvalid = useMemo(() => {
    if (!salaryMin || !salaryMax) return false;
    return Number(salaryMin) > Number(salaryMax);
  }, [salaryMin, salaryMax]);
  useEffect(() => {
    if (!filtersHydrated || tab !== "browse") return;
    void loadBrowseJobs();
  }, [filtersHydrated, tab, currentPage, deferredKeyword, location, level, skill, salaryMin, salaryMax, sortMode, salaryRangeInvalid]);

  const rankedCompanies = useMemo(
    () =>
      companies
        .map((company) => ({
          company,
          activeJobs: activeJobsByCompanyId.get(company.id) ?? 0
        }))
        .sort((a, b) => {
          const logoDelta = Number(Boolean(b.company.logo)) - Number(Boolean(a.company.logo));
          if (logoDelta !== 0) return logoDelta;
          if (b.activeJobs !== a.activeJobs) return b.activeJobs - a.activeJobs;
          return a.company.name.localeCompare(b.company.name);
        }),
    [companies, activeJobsByCompanyId]
  );

  const featuredCompanies = useMemo(
    () => rankedCompanies.slice(0, FEATURED_EMPLOYERS_LIMIT),
    [rankedCompanies]
  );

  const secondaryCompanies = useMemo(
    () => rankedCompanies.slice(FEATURED_EMPLOYERS_LIMIT, FEATURED_EMPLOYERS_LIMIT + SECONDARY_EMPLOYERS_LIMIT),
    [rankedCompanies]
  );

  useEffect(() => {
    if (!router.isReady) return;
    setKeyword(queryValue("q"));
    setLocation(queryValue("location") || "ALL");
    setLevel(queryValue("level") || "ALL");
    setSkill(queryValue("skill") || "ALL");
    setSalaryMin(queryValue("salaryMin").replace(/[^\d]/g, ""));
    setSalaryMax(queryValue("salaryMax").replace(/[^\d]/g, ""));
    const requestedSort = queryValue("sort");
    setSortMode(SUPPORTED_JOB_SORTS.has(requestedSort) ? requestedSort : DEFAULT_JOB_SORT);
    const nextPage = Number(queryValue("page") || "1");
    setCurrentPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
    setFiltersHydrated(true);
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady || !filtersHydrated || tab !== "browse") return;

    const nextQuery = queryWithoutFilters(router.query);
    if (keyword.trim()) nextQuery.q = keyword.trim();
    if (location !== "ALL") nextQuery.location = location;
    if (level !== "ALL") nextQuery.level = level;
    if (skill !== "ALL") nextQuery.skill = skill;
    if (salaryMin) nextQuery.salaryMin = salaryMin;
    if (salaryMax) nextQuery.salaryMax = salaryMax;
    if (sortMode !== DEFAULT_JOB_SORT) nextQuery.sort = sortMode;
    if (currentPage > 1) nextQuery.page = String(currentPage);

    const currentComparable = JSON.stringify(queryWithoutTab(router.query));
    const nextComparable = JSON.stringify(nextQuery);
    if (currentComparable === nextComparable) return;

    void router.replace(
      {
        pathname: router.pathname,
        query: nextQuery
      },
      undefined,
      { shallow: true }
    );
  }, [router.isReady, filtersHydrated, tab, keyword, location, level, skill, salaryMin, salaryMax, sortMode, currentPage]);

  const totalPages = browseTotalPages;

  const paginationNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const start = Math.min(Math.max(currentPage - 2, 1), totalPages - 4);
    return Array.from({ length: 5 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (keyword.trim()) count += 1;
    if (location !== "ALL") count += 1;
    if (level !== "ALL") count += 1;
    if (skill !== "ALL") count += 1;
    if (salaryMin) count += 1;
    if (salaryMax) count += 1;
    return count;
  }, [keyword, location, level, skill, salaryMin, salaryMax, sortMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, location, level, skill, salaryMin, salaryMax]);

  useEffect(() => {
    setCurrentPage((prev) => (prev > totalPages ? totalPages : prev));
  }, [totalPages]);

  useEffect(() => {
    if (!browseJobs.length) {
      setSelectedJobId(null);
      return;
    }
    const stillExists = browseJobs.some((item) => item.id === selectedJobId);
    if (!stillExists) {
      setSelectedJobId(browseJobs[0].id);
    }
  }, [browseJobs, selectedJobId]);

  const selectedJob = browseJobs.find((job) => job.id === selectedJobId) ?? null;

  function resetFilters() {
    setKeyword("");
    setLocation("ALL");
    setLevel("ALL");
    setSkill("ALL");
    setSalaryMin("");
    setSalaryMax("");
    setSortMode(DEFAULT_JOB_SORT);
    setCurrentPage(1);
  }

  function scrollToJobs(delay = 80) {
    setTimeout(() => jobsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), delay);
  }

  function applyKeywordFilter(value: string) {
    startTransition(() => setKeyword(value));
    setCurrentPage(1);
    scrollToJobs();
  }

  function applySkillFilter(value: string) {
    setSkill(value);
    setCurrentPage(1);
    scrollToJobs();
  }

  function applyCityFilter(value: string) {
    setLocation(value);
    setCurrentPage(1);
    scrollToJobs();
  }

  function handleViewAllCompanies() {
    companiesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSelectCompany(company: Company) {
    applyKeywordFilter(company.name);
  }

  async function handleToggleSavedJob(job: Job, nextBookmarked: boolean) {
    const previousIds = savedJobIds;
    const optimisticIds = nextBookmarked
      ? Array.from(new Set([...savedJobIds, job.id]))
      : savedJobIds.filter((id) => id !== job.id);

    setSavedJobIds(optimisticIds);
    setSavingJobIds((prev) => Array.from(new Set([...prev, job.id])));

    try {
      if (authStatus === "authenticated") {
        const syncedJobs = nextBookmarked ? await saveJobWithAuth(job.id) : await unsaveJobWithAuth(job.id);
        const syncedIds = syncedJobs.map((item) => item.id);
        setSavedJobIds(syncedIds);
        saveBookmarks(syncedIds, bookmarkScope);
      } else {
        if (nextBookmarked) {
          addBookmark(job.id, bookmarkScope);
        } else {
          removeBookmark(job.id, bookmarkScope);
        }
        saveBookmarks(optimisticIds, bookmarkScope);
      }
    } catch (saveError) {
      setSavedJobIds(previousIds);
      addToast("error", toUserErrorMessage(saveError, "Không thể cập nhật việc làm đã lưu lúc này."));
    } finally {
      setSavingJobIds((prev) => prev.filter((id) => id !== job.id));
    }
  }

  function toggleSubscriberSkill(skillId: number) {
    setSubscriberSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  }

  async function submitSubscriber() {
    const cleanName = subscriberName.trim();
    const cleanEmail = subscriberEmail.trim();
    setSubscriberMessage("");
    setSubscriberError("");

    if (!cleanName) {
      setSubscriberError("Vui lòng nhập họ tên để đăng ký nhận việc.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setSubscriberError("Email chưa đúng định dạng.");
      return;
    }

    setSubscriberSubmitting(true);
    try {
      await createSubscriber({
        email: cleanEmail,
        name: cleanName,
        skills: subscriberSkillIds.map((id) => ({ id }))
      });
      setSubscriberMessage("Đăng ký nhận gợi ý việc làm thành công.");
      setSubscriberName("");
      setSubscriberEmail("");
      setSubscriberSkillIds([]);
    } catch (subscriberErrorValue) {
      setSubscriberError(toUserErrorMessage(subscriberErrorValue, "Không thể đăng ký nhận việc lúc này."));
    } finally {
      setSubscriberSubmitting(false);
    }
  }

  const updateSecondaryScrollState = useCallback(() => {
    const el = secondaryCompaniesScrollRef.current;
    if (!el) return;
    setSecondaryScrollLeft(el.scrollLeft > 4);
    setSecondaryScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  function scrollSecondaryBy(direction: -1 | 1) {
    const el = secondaryCompaniesScrollRef.current;
    if (!el) return;
    const cardWidth = 220 + 10; // min-w-[220px] + gap-2.5
    el.scrollBy({ left: cardWidth * 3 * direction, behavior: "smooth" });
    setTimeout(updateSecondaryScrollState, 350);
  }

  useEffect(() => {
    if (secondaryCompanies.length) updateSecondaryScrollState();
  }, [secondaryCompanies.length, updateSecondaryScrollState]);

  function changeMainTab(nextTab: MainTab, module?: ManageModule) {
    if (nextTab === "manage" && !canAccessManagement) {
      addToast("error", "Bạn chưa có quyền truy cập khu vực quản trị.");
      return;
    }

    setTab(nextTab);
    if (!router.isReady) return;

    const nextQuery = queryWithoutTab(router.query);
    if (nextTab === "manage") {
      nextQuery.tab = "manage";
      if (module) {
        nextQuery.module = module;
      }
    }

    void router.replace(
      {
        pathname: router.pathname,
        query: nextQuery
      },
      undefined,
      { shallow: true }
    );
  }

  function syncManageModule(module: ManageModule) {
    if (!canAccessManagement || !router.isReady) return;
    void router.replace(
      {
        pathname: router.pathname,
        query: {
          ...queryWithoutTab(router.query),
          tab: "manage",
          module
        }
      },
      undefined,
      { shallow: true }
    );
  }

  async function runProtectedMutation(action: () => Promise<void>, successMessage: string) {
    if (authStatus !== "authenticated") {
      addToast("error", "Vui lòng đăng nhập để thực hiện thao tác này.");
      throw new Error("Bạn chưa đăng nhập.");
    }
    try {
      await action();
      await Promise.all([loadPublicData(), reloadRbacData()]);
      addToast("success", successMessage);
    } catch (mutationError) {
      addToast("error", toUserErrorMessage(mutationError, "Không thể hoàn tất thao tác lúc này."));
      throw mutationError;
    }
  }

  async function runRbacMutation(action: () => Promise<void>, successMessage: string) {
    if (authStatus !== "authenticated") {
      addToast("error", "Vui lòng đăng nhập để thao tác trên khu vực quản trị.");
      throw new Error("Bạn chưa đăng nhập.");
    }
    try {
      await action();
      await reloadRbacData();
      addToast("success", successMessage);
    } catch (mutationError) {
      addToast("error", toUserErrorMessage(mutationError, "Không thể hoàn tất thao tác lúc này."));
      throw mutationError;
    }
  }

  return (
    <>
      <Head>
        <title>Việc làm IT — Jobhunter</title>
        <meta name="description" content="Tìm việc IT nhanh chóng, ứng tuyển dễ dàng. Khám phá hàng trăm vị trí tuyển dụng từ các công ty công nghệ hàng đầu Việt Nam." />
      </Head>
      <main className="w-full pb-24" data-testid="home-page">
      <ToastViewport toasts={toasts} onDismiss={removeToast} />

      <HomeHero
        activeJobsCountLabel={renderPublicStat(activeJobsCount)}
        keyword={keyword}
        location={location}
        locationOptions={locationOptions}
        trendingSkillOptions={trendingSkillOptions}
        onKeywordChange={(value) => startTransition(() => setKeyword(value))}
        onLocationChange={setLocation}
        onSearch={() => scrollToJobs(0)}
        onSelectSkill={applySkillFilter}
      />

      <div className="mx-auto w-full max-w-[1180px] px-4 pt-4 sm:px-5 xl:px-6">

      {canAccessManagement ? (
        <section className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeMainTab("browse")}
            className={
              tab === "browse"
                ? "rounded-md bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white sm:text-sm"
                : "rounded-md border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm"
            }
          >
            Việc làm
          </button>
          <button
            type="button"
            onClick={() => changeMainTab("manage", manageModuleQuery ?? defaultManageModule)}
            className={
              tab === "manage"
                ? "rounded-md bg-slate-900 px-3.5 py-2 text-[13px] font-semibold text-white sm:text-sm"
                : "rounded-md border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm"
            }
          >
            Quản lý
          </button>
        </section>
      ) : null}

      {tab === "browse" ? (
        <section className="grid grid-cols-1 gap-4">
          {error ? (
            <ErrorState description={error} onRetry={() => void loadPublicData()} />
          ) : null}

          <div id="top-employers" data-testid="top-employers-section">
            <FeaturedEmployersStrip
              items={featuredCompanies}
              totalCompanies={companies.length}
              loading={loading}
              onViewAllCompanies={handleViewAllCompanies}
              onSelectCompany={handleSelectCompany}
            />
          </div>

          <JobsBoard
            keyword={keyword}
            location={location}
            level={level}
            skill={skill}
            salaryMin={salaryMin}
            salaryMax={salaryMax}
            salaryError={salaryRangeInvalid ? "Lương tối thiểu không được lớn hơn lương tối đa." : ""}
            activeFilterCount={activeFilterCount}
            isFilteringKeyword={isFilteringKeyword}
            locationOptions={locationOptions}
            levelOptions={levelOptions}
            skillOptions={skillOptions}
            jobs={browseJobs}
            totalItems={browseTotalItems}
            sortMode={sortMode}
            selectedJobId={selectedJobId}
            selectedJob={selectedJob}
            currentPage={currentPage}
            totalPages={totalPages}
            paginationNumbers={paginationNumbers}
            bookmarkScope={bookmarkScope}
            bookmarkedJobIds={savedJobIds}
            bookmarkBusyJobIds={savingJobIds}
            isLoading={browseLoading}
            jobsSectionRef={jobsSectionRef}
            onKeywordChange={(value) => startTransition(() => setKeyword(value))}
            onLocationChange={setLocation}
            onLevelChange={setLevel}
            onSkillChange={setSkill}
            onSalaryMinChange={setSalaryMin}
            onSalaryMaxChange={setSalaryMax}
            onSortModeChange={setSortMode}
            onToggleSavedJob={handleToggleSavedJob}
            onReset={resetFilters}
            onSelectJob={setSelectedJobId}
            onCurrentPageChange={setCurrentPage}
          />

          {loading ? (
            <LoadingState title="Đang tải dữ liệu công ty và kỹ năng..." rows={3} />
          ) : (
            <HomeContentHub
              campaignTiles={CAMPAIGN_TILES}
              featuredArticles={FEATURED_ARTICLES}
              expertiseGroups={EXPERTISE_GROUPS}
              rankedCompanies={rankedCompanies}
              secondaryCompanies={secondaryCompanies}
              hubSkillOptions={hubSkillOptions}
              hubCityOptions={CITY_HUBS}
              companiesCount={companies.length}
              secondaryScrollLeft={secondaryScrollLeft}
              secondaryScrollRight={secondaryScrollRight}
              companiesSectionRef={companiesSectionRef}
              secondaryCompaniesScrollRef={secondaryCompaniesScrollRef}
              onResetFilters={resetFilters}
              onApplySkillFilter={applySkillFilter}
              onApplyKeywordFilter={applyKeywordFilter}
              onApplyCityFilter={applyCityFilter}
              onSelectCompany={handleSelectCompany}
              onViewAllCompanies={handleViewAllCompanies}
              onScrollSecondaryBy={scrollSecondaryBy}
              onUpdateSecondaryScrollState={updateSecondaryScrollState}
            />
          )}

          <SubscriberSection
            email={subscriberEmail}
            name={subscriberName}
            selectedSkillIds={subscriberSkillIds}
            skills={skills}
            submitting={subscriberSubmitting}
            message={subscriberMessage}
            error={subscriberError}
            onEmailChange={setSubscriberEmail}
            onNameChange={setSubscriberName}
            onToggleSkill={toggleSubscriberSkill}
            onSubmit={submitSubscriber}
          />

          <AboutSection
            activeJobsLabel={renderPublicStat(activeJobsCount)}
            companiesLabel={renderPublicStat(companies.length)}
            skillsLabel={renderPublicStat(skills.length)}
          />
        </section>
      ) : loading ? (
        <LoadingState title="Đang tải dữ liệu tuyển dụng..." rows={6} />
      ) : canAccessManagement ? (
        <section className="grid gap-3">
          <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tài khoản quản lý được</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {rbacLoading ? "..." : can("/api/v1/users", "GET") ? users.length : "Không có quyền"}
              </p>
            </article>
            <article className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Hồ sơ ứng tuyển</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {rbacLoading ? "..." : can("/api/v1/resumes", "GET") ? resumes.length : "Không có quyền"}
              </p>
            </article>
            <article className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Vai trò trong hệ thống</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {rbacLoading ? "..." : can("/api/v1/roles", "GET") ? roles.length : "Không có quyền"}
              </p>
            </article>
            <article className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Quyền khả dụng</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{permissionKeys.length}</p>
            </article>
          </section>

          <ManagementPanel
            jobs={jobs}
            companies={companies}
            skills={skills}
            resumes={resumes}
            users={users}
            roles={roles}
            permissions={permissions}
            resumeAuditsById={resumeAuditsById}
            userCapabilities={userCapabilities}
            createAssignableRoles={assignableRoles}
            rbacLoading={rbacLoading}
            rbacError={rbacError}
            preferredModule={manageModuleQuery}
            onModuleChange={syncManageModule}
            onReloadPublicData={loadPublicData}
            onReloadRbacData={reloadRbacData}
            onCreateJob={(payload) => runProtectedMutation(() => createJob(payload), "Tạo việc làm thành công.")}
            onUpdateJob={(payload) => runProtectedMutation(() => updateJob(payload), "Cập nhật việc làm thành công.")}
            onDeleteJob={(jobId) => runProtectedMutation(() => deleteJob(jobId), "Xóa việc làm thành công.")}
            onCreateCompany={(payload) => runProtectedMutation(() => createCompany(payload), "Tạo công ty thành công.")}
            onUpdateCompany={(payload) => runProtectedMutation(() => updateCompany(payload), "Cập nhật công ty thành công.")}
            onDeleteCompany={(companyId) => runProtectedMutation(() => deleteCompany(companyId), "Xóa công ty thành công.")}
            onCreateSkill={(payload) => runProtectedMutation(() => createSkill(payload), "Tạo kỹ năng thành công.")}
            onUpdateSkill={(payload) => runProtectedMutation(() => updateSkill(payload), "Cập nhật kỹ năng thành công.")}
            onDeleteSkill={(skillId) => runProtectedMutation(() => deleteSkill(skillId), "Xóa kỹ năng thành công.")}
            onUpdateResumeStatus={(resume, nextStatus, note) =>
              runRbacMutation(
                () =>
                  updateResumeWithAuth(resume.id, { status: nextStatus, note }),
                "Cập nhật trạng thái hồ sơ thành công."
              )
            }
            onDeleteResume={(resumeId) => runRbacMutation(() => deleteResumeWithAuth(resumeId), "Xóa hồ sơ thành công.")}
            onUploadCompanyLogo={(file) => uploadCompanyLogo(file)}
            onCreateUser={(payload) => runRbacMutation(() => createUserWithAuth(payload), "Tạo tài khoản thành công.")}
            onUpdateUser={(userId, payload) =>
              runRbacMutation(() => updateUserWithAuth(userId, payload), "Cập nhật tài khoản thành công.")
            }
            onDeleteUser={(userId) => runRbacMutation(() => deleteUserWithAuth(userId), "Xóa tài khoản thành công.")}
          />
        </section>
      ) : (
        <EmptyState
          title="Bạn không có quyền truy cập khu vực này"
          description="Khu vực quản trị chỉ hiển thị cho tài khoản có quyền phù hợp."
          actionLabel="Về danh sách việc làm"
          onAction={() => changeMainTab("browse")}
        />
      )}

      </div>

      {tab === "browse" ? <FloatingChatWidget /> : null}
    </main>
    </>
  );
}

function queryStringValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function queryPositivePage(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(queryStringValue(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeInitialSort(value: string | string[] | undefined): string {
  const requestedSort = queryStringValue(value);
  return SUPPORTED_JOB_SORTS.has(requestedSort) ? requestedSort : DEFAULT_JOB_SORT;
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async ({ query }) => {
  const requestedPage = queryPositivePage(query.page);
  const requestedSort = normalizeInitialSort(query.sort);
  const messages: string[] = [];

  const [browseResult, companiesResult, skillsResult] = await Promise.allSettled([
    fetchPublicJobs({
      page: requestedPage - 1,
      size: JOBS_PER_PAGE,
      q: queryStringValue(query.q) || undefined,
      location: queryStringValue(query.location) || undefined,
      level: queryStringValue(query.level) || undefined,
      skill: queryStringValue(query.skill) || undefined,
      salaryMin: queryStringValue(query.salaryMin) || undefined,
      salaryMax: queryStringValue(query.salaryMax) || undefined,
      sort: requestedSort
    }),
    fetchAllCompanies(),
    fetchAllSkills()
  ]);

  const initialJobs: Job[] = [];

  const initialCompanies =
    companiesResult.status === "fulfilled"
      ? [...companiesResult.value].sort((a, b) => a.name.localeCompare(b.name))
      : [];
  if (companiesResult.status === "rejected") {
    messages.push(toUserErrorMessage(companiesResult.reason, "Không thể tải danh sách công ty."));
  }

  const initialSkills =
    skillsResult.status === "fulfilled"
      ? [...skillsResult.value].sort((a, b) => a.name.localeCompare(b.name))
      : [];
  if (skillsResult.status === "rejected") {
    messages.push(toUserErrorMessage(skillsResult.reason, "Không thể tải danh sách kỹ năng."));
  }

  let initialBrowseJobs: Job[] = [];
  let initialBrowseTotalItems = 0;
  let initialBrowseTotalPages = 1;
  if (browseResult.status === "fulfilled") {
    initialBrowseJobs = browseResult.value.items;
    initialBrowseTotalItems = browseResult.value.totalItems;
    initialBrowseTotalPages = Math.max(1, browseResult.value.totalPages);
  } else {
    messages.push(toUserErrorMessage(browseResult.reason, "Không thể tải danh sách việc làm lúc này."));
  }

  return {
    props: {
      initialJobs,
      initialBrowseJobs,
      initialBrowseTotalItems,
      initialBrowseTotalPages,
      initialCompanies,
      initialSkills,
      initialError: messages.join(" ")
    }
  };
};
