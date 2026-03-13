/**
 * D-Day 카운터 위젯 전역 상태 스토어 (Zustand)
 * localStorage에 D-Day 목록을 영속화하고 전역으로 접근 가능하게 한다.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** D-Day 항목 타입 */
export interface DDay {
  id: string;
  title: string;
  /** 목표 날짜 (YYYY-MM-DD) */
  targetDate: string;
}

/** D-Day 스토어 상태 및 액션 타입 */
interface DDayState {
  /** D-Day 목록 (날짜 오름차순) */
  ddays: DDay[];
  /** D-Day를 추가하고 날짜 오름차순으로 정렬한다 */
  addDDay: (title: string, targetDate: string) => void;
  /** D-Day를 삭제한다 */
  removeDDay: (id: string) => void;
}

/**
 * D-Day 스토어
 * zustand/persist 미들웨어로 localStorage에 자동 저장된다.
 */
export const useDDayStore = create<DDayState>()(
  persist(
    (set) => ({
      ddays: [],

      addDDay: (title, targetDate) => {
        const trimmed = title.trim();
        if (!trimmed || !targetDate) return;
        set((state) => ({
          ddays: [
            ...state.ddays,
            { id: `${Date.now()}`, title: trimmed, targetDate },
          ].sort((a, b) => a.targetDate.localeCompare(b.targetDate)),
        }));
      },

      removeDDay: (id) => {
        set((state) => ({
          ddays: state.ddays.filter((d) => d.id !== id),
        }));
      },
    }),
    { name: "upharm_ddays" }
  )
);
