"use client";

/**
 * 포모도로 타이머 위젯
 * 집중 25분 / 휴식 5분 모드를 지원하는 원형 프로그레스 타이머.
 * 타이머 로직은 usePomodoro 커스텀 훅에서 관리하여 관심사를 분리한다.
 */

import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePomodoro } from "@/hooks/usePomodoro";
import { WidgetCard } from "./WidgetCard";

export function PomodoroWidget() {
  // 포모도로 타이머 로직을 커스텀 훅으로 분리하여 관심사를 분리한다
  const { mode, isRunning, progress, mins, secs, toggle, reset, switchMode } = usePomodoro();
  const circumference = 2 * Math.PI * 44;

  return (
    <WidgetCard
      icon={<Timer className="h-4 w-4 text-white" />}
      title="포모도로 타이머"
      accentGradient="from-orange-500 to-amber-500"
    >
      {/* 모드 탭 */}
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-zinc-800">
        {(["work", "break"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              "flex-1 rounded-md py-1 text-xs font-medium transition-colors",
              mode === m
                ? "bg-white text-orange-600 shadow-sm dark:bg-zinc-700 dark:text-orange-400"
                : "text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {m === "work" ? "집중 25분" : "휴식 5분"}
          </button>
        ))}
      </div>

      {/* 원형 프로그레스 + 시간 표시 */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-28 w-28">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            {/* 배경 원 */}
            <circle
              cx="50" cy="50" r="44" fill="none"
              strokeWidth="8" stroke="currentColor"
              className="text-gray-100 dark:text-zinc-800"
            />
            {/* 진행 원 */}
            <circle
              cx="50" cy="50" r="44" fill="none"
              strokeWidth="8" stroke="currentColor" strokeLinecap="round"
              className={mode === "work" ? "text-orange-500" : "text-emerald-500"}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-zinc-100">
              {mins}:{secs}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              {mode === "work" ? "집중" : "휴식"}
            </span>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={toggle}
            className={cn(
              "rounded-lg px-5 py-1.5 text-sm font-medium text-white transition-colors",
              mode === "work"
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            {isRunning ? "일시정지" : "시작"}
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            초기화
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}
