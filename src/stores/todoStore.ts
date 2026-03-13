/**
 * 투두 리스트 전역 상태 스토어 (Zustand)
 * localStorage에 투두 목록을 영속화하고 전역으로 접근 가능하게 한다.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 투두 항목 타입 */
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

/** 투두 스토어 최대 저장 개수 */
export const MAX_TODO_COUNT = 30;

/** 투두 스토어 상태 및 액션 타입 */
interface TodoState {
  /** 투두 목록 (최신순) */
  todos: Todo[];
  /** 투두를 추가한다 (최대 30개) */
  addTodo: (text: string) => void;
  /** 완료 상태를 토글한다 */
  toggleTodo: (id: string) => void;
  /** 투두를 삭제한다 */
  removeTodo: (id: string) => void;
}

/**
 * 투두 스토어
 * zustand/persist 미들웨어로 localStorage에 자동 저장된다.
 */
export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],

      addTodo: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((state) => ({
          todos: [
            { id: `${Date.now()}`, text: trimmed, completed: false, createdAt: Date.now() },
            ...state.todos,
          ].slice(0, MAX_TODO_COUNT),
        }));
      },

      toggleTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      },

      removeTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        }));
      },
    }),
    { name: "upharm_todos" }
  )
);
