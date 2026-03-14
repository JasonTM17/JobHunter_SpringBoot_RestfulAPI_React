import { useRouter } from "next/router";
import { useMemo } from "react";
import SystemPageShell from "../components/common/SystemPageShell";
import { useAuth } from "../contexts/auth-context";
import { resolveWorkspaceKind, workspacePath } from "../utils/workspace";

export default function ForbiddenPage() {
  const router = useRouter();
  const { status, roleName, canAccessManagement } = useAuth();

  const preferredPath = useMemo(() => {
    if (status !== "authenticated") return "/";
    const workspace = resolveWorkspaceKind(roleName, canAccessManagement);
    return workspacePath(workspace);
  }, [status, roleName, canAccessManagement]);

  const nextPath = useMemo(() => {
    const raw = router.query.next;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query.next]);

  return (
    <SystemPageShell
      label="Mã lỗi 403"
      code="403"
      title="Bạn không có quyền truy cập khu vực này"
      description="Trang bạn đang mở yêu cầu quyền cao hơn quyền hiện tại của tài khoản. Quay về đúng workspace sẽ an toàn hơn là cố gắng truy cập tiếp vào đường dẫn bị chặn."
      primaryAction={{ href: preferredPath, label: "Về khu vực phù hợp", variant: "primary" }}
      secondaryAction={{ href: "/", label: "Về cổng việc làm", variant: "secondary" }}
      tertiaryAction={
        status !== "authenticated"
          ? { href: `/login?next=${encodeURIComponent(nextPath || "/")}`, label: "Đăng nhập", variant: "accent" }
          : undefined
      }
      panelTitle="Cần làm gì tiếp theo?"
      panelDescription="Jobhunter vẫn giữ nguyên dữ liệu và phiên của bạn. Chỉ có quyền truy cập hiện tại không phù hợp với màn vừa yêu cầu."
      panelItems={[
        "Quay lại workspace đúng vai trò để tiếp tục công việc mà không mất trạng thái.",
        "Nếu vừa đổi vai trò hoặc đăng nhập lại, hãy làm mới phiên trước khi thử truy cập lần nữa.",
        "Nếu bạn cần thêm quyền, hãy liên hệ quản trị viên hoặc chủ tài khoản tuyển dụng."
      ]}
      tone="amber"
      notice={
        nextPath ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Đường dẫn vừa bị chặn: <span className="font-semibold text-slate-700">{nextPath}</span>
          </p>
        ) : null
      }
    />
  );
}
