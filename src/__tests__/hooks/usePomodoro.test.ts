/**
 * usePomodoro 커스텀 훅 테스트
 */

import { renderHook, act } from "@testing-library/react";
import { usePomodoro, POMODORO_WORK_SECS, POMODORO_BREAK_SECS } from "@/hooks/usePomodoro";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("usePomodoro — 초기 상태", () => {
  it("work 모드, 25분, 정지 상태로 초기화된다", () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.mode).toBe("work");
    expect(result.current.timeLeft).toBe(POMODORO_WORK_SECS);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.mins).toBe("25");
    expect(result.current.secs).toBe("00");
  });
});

describe("usePomodoro — toggle", () => {
  it("toggle 호출 시 isRunning이 true가 된다", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.toggle());
    expect(result.current.isRunning).toBe(true);
  });

  it("toggle을 두 번 호출하면 isRunning이 false가 된다", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    expect(result.current.isRunning).toBe(false);
  });

  it("실행 중일 때 1초 후 timeLeft가 1 감소한다", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.toggle());
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(POMODORO_WORK_SECS - 1);
  });
});

describe("usePomodoro — reset", () => {
  it("reset 호출 시 현재 모드의 초기 시간으로 복원된다 (work)", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.toggle());
    act(() => jest.advanceTimersByTime(5000));
    act(() => result.current.reset());
    expect(result.current.timeLeft).toBe(POMODORO_WORK_SECS);
    expect(result.current.isRunning).toBe(false);
  });
});

describe("usePomodoro — switchMode", () => {
  it("switchMode('break') 호출 시 break 모드와 5분으로 전환된다", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.switchMode("break"));
    expect(result.current.mode).toBe("break");
    expect(result.current.timeLeft).toBe(POMODORO_BREAK_SECS);
    expect(result.current.isRunning).toBe(false);
  });

  it("break 모드에서 reset하면 5분으로 복원된다", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.switchMode("break"));
    act(() => result.current.toggle());
    act(() => jest.advanceTimersByTime(3000));
    act(() => result.current.reset());
    expect(result.current.timeLeft).toBe(POMODORO_BREAK_SECS);
    expect(result.current.isRunning).toBe(false);
  });
});

describe("usePomodoro — 시간 종료 자동 전환", () => {
  it("work 타이머 종료 시 break 모드로 자동 전환된다", () => {
    const { result } = renderHook(() => usePomodoro());
    act(() => result.current.toggle());
    act(() => jest.advanceTimersByTime(POMODORO_WORK_SECS * 1000));
    expect(result.current.mode).toBe("break");
    expect(result.current.timeLeft).toBe(POMODORO_BREAK_SECS);
    expect(result.current.isRunning).toBe(false);
  });
});
