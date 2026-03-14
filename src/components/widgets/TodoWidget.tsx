"use client";

/**
 * Todo 위젯
 * 할 일 추가·완료 토글·삭제 기능 제공. 상태는 Zustand useTodoStore(persist)가 관리한다.
 * Enter 키 또는 추가 버튼으로 항목을 추가하며 최대 30개까지 저장한다.
 */

import { useRef, useState } from "react";
import { ListTodo, Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodoStore } from "@/stores/todoStore";
import { WidgetCard } from "./WidgetCard";

export function TodoWidget() {
  // 투두 상태는 Zustand 스토어가 관리한다 (persist 미들웨어로 localStorage 자동 영속화)
  const { todos, addTodo: storeAddTodo, toggleTodo, removeTodo } = useTodoStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTodo = () => {
    storeAddTodo(input);
    setInput("");
    inputRef.current?.focus();
  };

  // 미완료/완료 개수 집계
  const pending = todos.filter((t) => !t.completed).length;
  const done = todos.filter((t) => t.completed).length;

  return (
    <WidgetCard
      icon={<ListTodo className="h-4 w-4 text-white" />}
      title="Todo"
      accentGradient="from-teal-400 to-emerald-500"
    >
      {/* 입력창 */}
      <div className="mb-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTodo(); }}
          placeholder="할 일을 입력하세요..."
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <button
          onClick={addTodo}
          aria-label="투두 추가"
          className="flex-shrink-0 rounded-lg bg-teal-500 p-1.5 text-white transition-colors hover:bg-teal-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 미완료/완료 개수 */}
      {todos.length > 0 && (
        <p className="mb-2 text-xs text-gray-400 dark:text-zinc-500">
          {pending}개 남음 · {done}개 완료
        </p>
      )}

      {/* 투두 목록 */}
      {todos.length === 0 ? (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          할 일이 없습니다
        </p>
      ) : (
        <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800"
            >
              {/* 체크 버튼: 완료 토글 */}
              <button
                onClick={() => toggleTodo(todo.id)}
                aria-label={todo.completed ? "완료 취소" : "완료 표시"}
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  todo.completed
                    ? "border-teal-500 bg-teal-500"
                    : "border-gray-300 dark:border-zinc-600"
                )}
              >
                {todo.completed && <Check className="h-3 w-3 text-white" />}
              </button>
              <p className={cn(
                "flex-1 break-all text-sm",
                todo.completed
                  ? "text-gray-400 line-through dark:text-zinc-500"
                  : "text-gray-700 dark:text-zinc-300"
              )}>
                {todo.text}
              </p>
              <button
                onClick={() => removeTodo(todo.id)}
                aria-label="삭제"
                className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
