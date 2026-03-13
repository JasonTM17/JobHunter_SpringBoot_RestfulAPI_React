import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  fetchAuthCapabilities,
  fetchCurrentAccount,
  loginWithPassword,
  logoutCurrentSession
} from "../services/auth-rbac-api";
import { AuthUser, RoleOption } from "../types/models";
import { hasPermissionKey } from "../utils/permissions";

type SessionStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: SessionStatus;
  currentUser: AuthUser | null;
  permissionKeys: string[];
  canAccessManagement: boolean;
  assignableRoles: RoleOption[];
  roleName: string | null;
  lastAuthError: string | null;
  login: (username: string, password: string) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  can: (apiPath: string, method: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [canAccessManagement, setCanAccessManagement] = useState(false);
  const [assignableRoles, setAssignableRoles] = useState<RoleOption[]>([]);
  const [lastAuthError, setLastAuthError] = useState<string | null>(null);

  async function hydrateAccount(): Promise<AuthUser | null> {
    const [account, capabilities] = await Promise.all([
      fetchCurrentAccount(),
      fetchAuthCapabilities()
    ]);

    const user = account?.user ?? null;
    setCurrentUser(user);

    const capabilityKeys = Array.isArray(capabilities?.actionKeys) ? capabilities.actionKeys : [];
    setPermissionKeys(capabilityKeys);
    setCanAccessManagement(Boolean(capabilities?.canAccessManagement));

    const roleOptions = Array.isArray(capabilities?.assignableRoles) ? capabilities.assignableRoles : [];
    setAssignableRoles(roleOptions);
    return user;
  }

  useEffect(() => {
    void (async () => {
      try {
        await hydrateAccount();
        setStatus("authenticated");
        setLastAuthError(null);
      } catch (error) {
        setCurrentUser(null);
        setPermissionKeys([]);
        setCanAccessManagement(false);
        setAssignableRoles([]);
        setStatus("anonymous");
        setLastAuthError((error as Error).message);
      }
    })();
  }, []);

  async function login(username: string, password: string): Promise<AuthUser | null> {
    const response = await loginWithPassword(username, password);
    setStatus("loading");
    try {
      const user = await hydrateAccount();
      setStatus("authenticated");
      setLastAuthError(null);
      return user;
    } catch (error) {
      const fallbackUser = response.user ?? null;
      setCurrentUser(fallbackUser);
      setPermissionKeys([]);
      setCanAccessManagement(false);
      setAssignableRoles([]);
      setStatus("authenticated");
      setLastAuthError((error as Error).message);
      return fallbackUser;
    }
  }

  async function logout() {
    try {
      await logoutCurrentSession();
    } catch {
      // Bỏ qua lỗi gọi logout và vẫn dọn trạng thái local.
    }
    setCurrentUser(null);
    setPermissionKeys([]);
    setCanAccessManagement(false);
    setAssignableRoles([]);
    setLastAuthError(null);
    setStatus("anonymous");
  }

  async function refreshAccount() {
    await hydrateAccount();
    setStatus("authenticated");
  }

  function can(apiPath: string, method: string): boolean {
    return hasPermissionKey(permissionKeys, apiPath, method);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      currentUser,
      permissionKeys,
      canAccessManagement,
      assignableRoles,
      roleName: currentUser?.role?.name ?? null,
      lastAuthError,
      login,
      logout,
      refreshAccount,
      can
    }),
    [status, currentUser, permissionKeys, canAccessManagement, assignableRoles, lastAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
