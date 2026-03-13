/**
 * useBookmarkStore (Zustand persist 스토어) 테스트
 */

import { useBookmarkStore } from "@/stores/bookmarkStore";

beforeEach(() => {
  useBookmarkStore.setState({ bookmarks: [] });
});

describe("bookmarkStore — 초기 상태", () => {
  it("빈 목록으로 초기화된다", () => {
    expect(useBookmarkStore.getState().bookmarks).toEqual([]);
  });
});

describe("bookmarkStore — addBookmark", () => {
  it("북마크를 추가한다", () => {
    useBookmarkStore.getState().addBookmark("구글", "https://google.com");
    const { bookmarks } = useBookmarkStore.getState();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].title).toBe("구글");
    expect(bookmarks[0].url).toBe("https://google.com");
  });

  it("https:// 없는 URL에 자동으로 추가한다", () => {
    useBookmarkStore.getState().addBookmark("구글", "google.com");
    expect(useBookmarkStore.getState().bookmarks[0].url).toBe("https://google.com");
  });

  it("http:// 로 시작하는 URL은 그대로 유지한다", () => {
    useBookmarkStore.getState().addBookmark("테스트", "http://example.com");
    expect(useBookmarkStore.getState().bookmarks[0].url).toBe("http://example.com");
  });

  it("제목이 비어있으면 추가하지 않는다", () => {
    useBookmarkStore.getState().addBookmark("  ", "https://example.com");
    expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
  });

  it("URL이 비어있으면 추가하지 않는다", () => {
    useBookmarkStore.getState().addBookmark("이름", "   ");
    expect(useBookmarkStore.getState().bookmarks).toHaveLength(0);
  });
});

describe("bookmarkStore — removeBookmark", () => {
  it("지정한 ID의 북마크를 삭제한다", () => {
    useBookmarkStore.setState({
      bookmarks: [
        { id: "1", title: "구글", url: "https://google.com" },
        { id: "2", title: "네이버", url: "https://naver.com" },
      ],
    });
    useBookmarkStore.getState().removeBookmark("1");
    const { bookmarks } = useBookmarkStore.getState();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].id).toBe("2");
  });
});
