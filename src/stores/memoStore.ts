/**
 * 메모 위젯 전역 상태 스토어 (Zustand)
 * localStorage에 메모 목록을 영속화하고 전역으로 접근 가능하게 한다.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 메모 항목 타입 */
export interface Memo {
  id: string;
  text: string;
  createdAt: number;
}

/** 메모 스토어 최대 저장 개수 */
export const MAX_MEMO_COUNT = 20;

/** 메모 스토어 상태 및 액션 타입 */
interface MemoState {
  /** 메모 목록 (최신순) */
  memos: Memo[];
  /** 메모를 추가한다 (최대 20개 유지) */
  addMemo: (text: string) => void;
  /** 메모를 삭제한다 */
  removeMemo: (id: string) => void;
}

/**
 * 메모 스토어
 * zustand/persist 미들웨어로 localStorage에 자동 저장된다.
 */
export const useMemoStore = create<MemoState>()(
  persist(
    (set) => ({
      memos: [],

      addMemo: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((state) => ({
          memos: [
            { id: `${Date.now()}`, text: trimmed, createdAt: Date.now() },
            ...state.memos,
          ].slice(0, MAX_MEMO_COUNT),
        }));
      },

      removeMemo: (id) => {
        set((state) => ({
          memos: state.memos.filter((m) => m.id !== id),
        }));
      },
    }),
    { name: "upharm_memos" }
  )
);
