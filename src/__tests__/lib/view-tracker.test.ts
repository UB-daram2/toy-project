/**
 * view-tracker.ts 유틸리티 테스트
 * localStorage 기반 열람 수 추적 함수를 검증한다.
 */

import { recordPageView, getTopViewed } from "@/lib/view-tracker";

const STORAGE_KEY = "upharm_view_counts";

/** 각 테스트 전에 localStorage를 초기화한다 */
beforeEach(() => {
  localStorage.clear();
});

describe("recordPageView (열람 수 기록)", () => {
  it("새 페이지를 처음 열람하면 count가 1이 된다", () => {
    recordPageView("page-a", "제목A", "https://notion.so/page-a");
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(raw["page-a"].count).toBe(1);
    expect(raw["page-a"].title).toBe("제목A");
    expect(raw["page-a"].url).toBe("https://notion.so/page-a");
  });

  it("같은 페이지를 여러 번 열람하면 count가 누적된다", () => {
    recordPageView("page-a", "제목A", "https://notion.so/page-a");
    recordPageView("page-a", "제목A", "https://notion.so/page-a");
    recordPageView("page-a", "제목A", "https://notion.so/page-a");
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(raw["page-a"].count).toBe(3);
  });

  it("다른 페이지 열람은 서로 독립적으로 기록된다", () => {
    recordPageView("page-a", "제목A", "https://notion.so/page-a");
    recordPageView("page-b", "제목B", "https://notion.so/page-b");
    recordPageView("page-a", "제목A", "https://notion.so/page-a");
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(raw["page-a"].count).toBe(2);
    expect(raw["page-b"].count).toBe(1);
  });

  it("title과 url을 최신 값으로 갱신한다", () => {
    recordPageView("page-a", "구제목", "https://old.url");
    recordPageView("page-a", "신제목", "https://new.url");
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(raw["page-a"].title).toBe("신제목");
    expect(raw["page-a"].url).toBe("https://new.url");
    expect(raw["page-a"].count).toBe(2);
  });

  it("localStorage가 손상된 상태에서도 오류 없이 기록한다", () => {
    localStorage.setItem(STORAGE_KEY, "invalid json {{{");
    expect(() =>
      recordPageView("page-a", "제목A", "https://notion.so/page-a")
    ).not.toThrow();
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(raw["page-a"].count).toBe(1);
  });
});

describe("getTopViewed (열람 상위 항목 조회)", () => {
  it("열람 기록이 없으면 빈 배열을 반환한다", () => {
    expect(getTopViewed(5)).toEqual([]);
  });

  it("열람 수 내림차순으로 정렬하여 반환한다", () => {
    recordPageView("page-a", "제목A", "https://notion.so/a");
    recordPageView("page-b", "제목B", "https://notion.so/b");
    recordPageView("page-b", "제목B", "https://notion.so/b");
    recordPageView("page-b", "제목B", "https://notion.so/b");
    recordPageView("page-c", "제목C", "https://notion.so/c");
    recordPageView("page-c", "제목C", "https://notion.so/c");

    const result = getTopViewed(3);
    expect(result[0].pageId).toBe("page-b");
    expect(result[0].count).toBe(3);
    expect(result[1].pageId).toBe("page-c");
    expect(result[1].count).toBe(2);
    expect(result[2].pageId).toBe("page-a");
    expect(result[2].count).toBe(1);
  });

  it("limit 개수만큼만 반환한다", () => {
    for (let i = 0; i < 10; i++) {
      recordPageView(`page-${i}`, `제목${i}`, `https://notion.so/${i}`);
    }
    expect(getTopViewed(5)).toHaveLength(5);
    expect(getTopViewed(3)).toHaveLength(3);
  });

  it("전체 기록이 limit보다 적으면 있는 만큼만 반환한다", () => {
    recordPageView("page-a", "제목A", "https://notion.so/a");
    recordPageView("page-b", "제목B", "https://notion.so/b");
    expect(getTopViewed(10)).toHaveLength(2);
  });

  it("반환 항목에 pageId, title, url, count가 모두 포함된다", () => {
    recordPageView("page-a", "제목A", "https://notion.so/a");
    const result = getTopViewed(1);
    expect(result[0]).toMatchObject({
      pageId: "page-a",
      title: "제목A",
      url: "https://notion.so/a",
      count: 1,
    });
  });
});
