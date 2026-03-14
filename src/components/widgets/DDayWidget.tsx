"use client";

/**
 * D-Day 카운터 위젯
 * 이벤트 이름·날짜를 추가하면 D-Day/D+N 형식으로 표시한다.
 * 상태는 Zustand useDDayStore(persist)가 관리한다.
 */

import { useState } from "react";
import { Flag, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDDayStore } from "@/stores/ddayStore";
import { WidgetCard } from "./WidgetCard";

/** 목표 날짜까지 남은 일수를 계산한다 (양수=미래, 0=당일, 음수=과거) */
function calcDDay(targetDate: string): number {
  const todayMs = new Date(new Date().toDateString()).getTime();
  const targetMs = new Date(targetDate).getTime();
  return Math.round((targetMs - todayMs) / 86_400_000);
}

export function DDayWidget() {
  // D-Day 상태는 Zustand 스토어가 관리한다 (persist 미들웨어로 localStorage 자동 영속화)
  const { ddays, addDDay: storeAddDDay, removeDDay } = useDDayStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const addDDay = () => {
    if (!newTitle.trim() || !newDate) return;
    storeAddDDay(newTitle, newDate);
    setNewTitle("");
    setNewDate("");
    setIsAdding(false);
  };

  return (
    <WidgetCard
      icon={<Flag className="h-4 w-4 text-white" />}
      title="D-Day 카운터"
      accentGradient="from-pink-500 to-rose-600"
    >
      {/* D-Day 목록 */}
      {ddays.length === 0 && !isAdding && (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          D-Day가 없습니다
        </p>
      )}
      {ddays.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {ddays.map((d) => {
            const diff = calcDDay(d.targetDate);
            const label = diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
            const labelColor =
              diff === 0 ? "text-red-500" :
              diff > 0 ? "text-pink-600 dark:text-pink-400" :
              "text-gray-400 dark:text-zinc-500";
            return (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-700 dark:text-zinc-300">{d.title}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{d.targetDate}</p>
                </div>
                <span className={cn("flex-shrink-0 text-sm font-bold tabular-nums", labelColor)}>
                  {label}
                </span>
                <button
                  onClick={() => removeDDay(d.id)}
                  aria-label={`${d.title} 삭제`}
                  className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 추가 폼 */}
      {isAdding ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="이벤트 이름"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <input
            type="date"
            aria-label="목표 날짜"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="flex gap-2">
            <button
              onClick={addDDay}
              className="flex-1 rounded-lg bg-pink-500 py-1.5 text-xs font-medium text-white hover:bg-pink-600"
            >
              추가
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewTitle(""); setNewDate(""); }}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-pink-300 py-1.5 text-xs text-pink-500 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-500/10"
        >
          <Plus className="h-3.5 w-3.5" />
          D-Day 추가
        </button>
      )}
    </WidgetCard>
  );
}
