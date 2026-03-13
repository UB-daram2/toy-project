/**
 * 북마크 위젯 전역 상태 스토어 (Zustand)
 * localStorage에 북마크 목록을 영속화하고 전역으로 접근 가능하게 한다.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 북마크 항목 타입 */
export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

/** 북마크 스토어 상태 및 액션 타입 */
interface BookmarkState {
  /** 북마크 목록 */
  bookmarks: BookmarkItem[];
  /** 북마크를 추가한다 (https:// 자동 추가) */
  addBookmark: (title: string, url: string) => void;
  /** 북마크를 삭제한다 */
  removeBookmark: (id: string) => void;
}

/**
 * 북마크 스토어
 * zustand/persist 미들웨어로 localStorage에 자동 저장된다.
 */
export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set) => ({
      bookmarks: [],

      addBookmark: (title, url) => {
        const trimmedTitle = title.trim();
        const trimmedUrl = url.trim();
        if (!trimmedTitle || !trimmedUrl) return;
        // 프로토콜이 없으면 https:// 를 자동으로 붙인다
        const href = trimmedUrl.startsWith("http")
          ? trimmedUrl
          : `https://${trimmedUrl}`;
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            { id: `${Date.now()}`, title: trimmedTitle, url: href },
          ],
        }));
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },
    }),
    { name: "upharm_bookmarks" }
  )
);
