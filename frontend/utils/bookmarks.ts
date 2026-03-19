const STORAGE_KEY = "jh_bookmarks";

export function getBookmarks(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(ids: number[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function addBookmark(jobId: number): void {
  const ids = getBookmarks();
  if (!ids.includes(jobId)) {
    saveBookmarks([...ids, jobId]);
  }
}

export function removeBookmark(jobId: number): void {
  saveBookmarks(getBookmarks().filter((id) => id !== jobId));
}

export function isBookmarked(jobId: number): boolean {
  return getBookmarks().includes(jobId);
}
