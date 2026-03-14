"use client";

/**
 * 메모 위젯
 * 메모 추가·삭제 기능 제공. 상태는 Zustand useMemoStore(persist)가 관리한다.
 * Enter 키 또는 추가 버튼으로 메모를 추가하며 최대 20개까지 저장한다.
 */

import { useRef, useState } from "react";
import { StickyNote, Plus, Trash2 } from "lucide-react";
import { useMemoStore } from "@/stores/memoStore";
import { WidgetCard } from "./WidgetCard";

export function MemoWidget() {
  // 메모 상태는 Zustand 스토어가 관리한다 (persist 미들웨어로 localStorage 자동 영속화)
  const { memos, addMemo: storAddMemo, removeMemo } = useMemoStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addMemo = () => {
    storAddMemo(input);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <WidgetCard
      icon={<StickyNote className="h-4 w-4 text-white" />}
      title="메모"
      accentGradient="from-rose-500 to-pink-600"
    >
      {/* 입력창 */}
      <div className="mb-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addMemo(); }}
          placeholder="메모를 입력하세요..."
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <button
          onClick={addMemo}
          aria-label="메모 추가"
          className="flex-shrink-0 rounded-lg bg-rose-500 p-1.5 text-white transition-colors hover:bg-rose-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 메모 목록 */}
      {memos.length === 0 ? (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          메모가 없습니다
        </p>
      ) : (
        <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
          {memos.map((memo) => (
            <li
              key={memo.id}
              className="group flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800"
            >
              <p className="flex-1 break-all text-sm text-gray-700 dark:text-zinc-300">
                {memo.text}
              </p>
              <button
                onClick={() => removeMemo(memo.id)}
                aria-label="메모 삭제"
                className="mt-0.5 flex-shrink-0 text-gray-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
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
