/**
 * 위젯 순서 전역 상태 스토어 (Zustand)
 * localStorage에 위젯 순서를 영속화하고 전역으로 접근 가능하게 한다.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 위젯 ID 타입 */
export type WidgetId =
  | "recent"
  | "popular"
  | "weather"
  | "exchange"
  | "market"
  | "memo"
  | "calendar"
  | "dday"
  | "bookmark"
  | "pomodoro"
  | "weekly-weather";

/** 기본 위젯 순서 */
export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  "recent", "popular", "weather", "exchange", "market",
  "memo", "calendar", "dday", "bookmark", "pomodoro", "weekly-weather",
];

/** 위젯 스토어 상태 및 액션 타입 */
interface WidgetState {
  /** 현재 위젯 표시 순서 */
  widgetOrder: WidgetId[];
  /** 두 위젯의 순서를 교환한다 */
  reorder: (fromId: WidgetId, toId: WidgetId) => void;
  /** 저장된 순서가 유효하지 않을 때 기본 순서로 복원한다 */
  reset: () => void;
}

/**
 * 위젯 순서 스토어
 * zustand/persist 미들웨어로 localStorage에 자동 저장된다.
 */
export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      widgetOrder: DEFAULT_WIDGET_ORDER,

      reorder: (fromId, toId) => {
        if (fromId === toId) return;
        set((state) => {
          const next = [...state.widgetOrder];
          const from = next.indexOf(fromId);
          const to = next.indexOf(toId);
          // 유효하지 않은 인덱스는 무시한다
          if (from < 0 || to < 0) return state;
          next.splice(from, 1);
          next.splice(to, 0, fromId);
          return { widgetOrder: next };
        });
      },

      reset: () => set({ widgetOrder: DEFAULT_WIDGET_ORDER }),
    }),
    {
      name: "upharm_widget_order",
      // 저장된 순서에 모든 기본 위젯이 포함된 경우에만 복원한다
      merge: (persisted, current) => {
        const p = persisted as Partial<WidgetState>;
        if (
          Array.isArray(p.widgetOrder) &&
          DEFAULT_WIDGET_ORDER.every((id) => p.widgetOrder!.includes(id))
        ) {
          return { ...current, widgetOrder: p.widgetOrder! };
        }
        return current;
      },
    }
  )
);
