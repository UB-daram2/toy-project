/**
 * 포모도로 타이머 커스텀 훅
 * 집중/휴식 모드 전환, 카운트다운, 리셋 로직을 캡슐화한다.
 */

import { useState, useEffect } from "react";

/** 집중 시간: 25분 */
export const POMODORO_WORK_SECS = 25 * 60;
/** 휴식 시간: 5분 */
export const POMODORO_BREAK_SECS = 5 * 60;

/** 포모도로 모드 */
export type PomodoroMode = "work" | "break";

/** usePomodoro 훅 반환값 */
export interface UsePomodoroResult {
  /** 현재 모드 */
  mode: PomodoroMode;
  /** 남은 시간 (초) */
  timeLeft: number;
  /** 타이머 실행 중 여부 */
  isRunning: boolean;
  /** 진행률 (0~100) */
  progress: number;
  /** 분 문자열 (두 자리, ex: "24") */
  mins: string;
  /** 초 문자열 (두 자리, ex: "59") */
  secs: string;
  /** 타이머 시작/일시정지 토글 */
  toggle: () => void;
  /** 현재 모드의 초기 시간으로 리셋 */
  reset: () => void;
  /** 모드를 변경하고 타이머를 리셋 */
  switchMode: (next: PomodoroMode) => void;
}

/**
 * 포모도로 타이머 상태와 제어 함수를 제공하는 커스텀 훅.
 * 타이머가 0에 도달하면 자동으로 반대 모드로 전환된다.
 */
export function usePomodoro(): UsePomodoroResult {
  const [mode, setMode] = useState<PomodoroMode>("work");
  const [timeLeft, setTimeLeft] = useState(POMODORO_WORK_SECS);
  const [isRunning, setIsRunning] = useState(false);

  // isRunning 상태에서 1초마다 카운트다운한다
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 시간 종료 시 자동으로 반대 모드로 전환한다
          setIsRunning(false);
          setMode((m) => {
            const next: PomodoroMode = m === "work" ? "break" : "work";
            setTimeLeft(next === "work" ? POMODORO_WORK_SECS : POMODORO_BREAK_SECS);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const totalSecs = mode === "work" ? POMODORO_WORK_SECS : POMODORO_BREAK_SECS;
  const progress = ((totalSecs - timeLeft) / totalSecs) * 100;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  const toggle = () => setIsRunning((r) => !r);

  /** 현재 모드의 초기 시간으로 리셋한다 */
  const reset = () => {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? POMODORO_WORK_SECS : POMODORO_BREAK_SECS);
  };

  /** 모드를 전환하고 타이머를 리셋한다 */
  const switchMode = (next: PomodoroMode) => {
    setMode(next);
    setIsRunning(false);
    setTimeLeft(next === "work" ? POMODORO_WORK_SECS : POMODORO_BREAK_SECS);
  };

  return { mode, timeLeft, isRunning, progress, mins, secs, toggle, reset, switchMode };
}
