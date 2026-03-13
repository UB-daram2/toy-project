/**
 * 게시물 열람 수 추적 유틸리티 (localStorage 기반)
 * 모달이 열릴 때마다 해당 페이지의 열람 수를 1 증가시키고 제목/URL을 저장한다.
 */

const STORAGE_KEY = "upharm_view_counts";

interface ViewEntry {
  count: number;
  title: string;
  url: string;
}

type ViewStore = Record<string, ViewEntry>;

/** localStorage에서 전체 열람 데이터를 읽는다 */
function readStore(): ViewStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as ViewStore;
  } catch {
    return {};
  }
}

/** localStorage에 전체 열람 데이터를 저장한다 */
function writeStore(store: ViewStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * 페이지 열람 수를 1 증가시키고 제목/URL을 최신 값으로 갱신한다.
 * 서버 환경(SSR)에서는 아무 동작도 하지 않는다.
 */
export function recordPageView(pageId: string, title: string, url: string): void {
  const store = readStore();
  const current = store[pageId] ?? { count: 0, title, url };
  store[pageId] = { count: current.count + 1, title, url };
  writeStore(store);
}

/**
 * 열람 수 기준 상위 limit개 항목을 내림차순으로 반환한다.
 * localStorage가 비어 있으면 빈 배열을 반환한다.
 */
export function getTopViewed(
  limit: number
): Array<{ pageId: string; title: string; url: string; count: number }> {
  const store = readStore();
  return Object.entries(store)
    .map(([pageId, entry]) => ({ pageId, ...entry }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
