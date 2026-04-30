const STORAGE_KEY = "jh_bookmarks";

function normalizeScope(scope?: string | null): string {
  const trimmed = scope?.trim().toLowerCase();
  if (!trimmed) return "guest";
  return trimmed.replace(/[^a-z0-9@._-]+/g, "-");
}

function scopedStorageKey(scope?: string | null): string {
  return `${STORAGE_KEY}:${normalizeScope(scope)}`;
}

export function bookmarkScopeFromAccount(account?: { id?: number | null; email?: string | null } | null): string {
  if (account?.id) return `user-${account.id}`;
  if (account?.email) return `email-${account.email}`;
  return "guest";
}

export function getBookmarks(scope?: string | null): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(scopedStorageKey(scope));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(ids: number[], scope?: string | null): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(scopedStorageKey(scope), JSON.stringify(ids));
}

export function addBookmark(jobId: number, scope?: string | null): void {
  const ids = getBookmarks(scope);
  if (!ids.includes(jobId)) {
    saveBookmarks([...ids, jobId], scope);
  }
}

export function removeBookmark(jobId: number, scope?: string | null): void {
  saveBookmarks(getBookmarks(scope).filter((id) => id !== jobId), scope);
}

export function isBookmarked(jobId: number, scope?: string | null): boolean {
  return getBookmarks(scope).includes(jobId);
}
