/**
 * useIMEInput 훅 테스트
 * 한국어 IME 조합 상태 추적, localValue 관리, 부모 onChange 호출 타이밍을 검증한다.
 */

import { renderHook, act } from "@testing-library/react";
import { useIMEInput } from "@/hooks/useIMEInput";

describe("useIMEInput", () => {
  it("초기 localValue가 value prop과 동일하다", () => {
    const { result } = renderHook(() =>
      useIMEInput({ value: "처방조제", onChange: jest.fn() })
    );
    expect(result.current.localValue).toBe("처방조제");
  });

  it("비조합 onChange 시 localValue와 부모 onChange가 함께 갱신된다", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useIMEInput({ value: "", onChange })
    );

    act(() => {
      result.current.inputProps.onChange({
        target: { value: "hello" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.localValue).toBe("hello");
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("IME 조합 중(onCompositionStart 이후) onChange는 부모를 호출하지 않는다", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useIMEInput({ value: "", onChange })
    );

    act(() => {
      result.current.inputProps.onCompositionStart();
    });
    act(() => {
      result.current.inputProps.onChange({
        target: { value: "처" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // localValue는 갱신되지만 부모 onChange는 호출되지 않는다
    expect(result.current.localValue).toBe("처");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("onCompositionEnd 시 최종값으로 localValue와 부모 onChange가 갱신된다", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useIMEInput({ value: "", onChange })
    );

    act(() => {
      result.current.inputProps.onCompositionStart();
    });
    act(() => {
      result.current.inputProps.onChange({
        target: { value: "처" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    act(() => {
      result.current.inputProps.onCompositionEnd({
        currentTarget: { value: "처방조제" },
      } as React.CompositionEvent<HTMLInputElement>);
    });

    expect(result.current.localValue).toBe("처방조제");
    expect(onChange).toHaveBeenCalledWith("처방조제");
  });

  it("부모 value가 외부에서 변경되면 localValue가 동기화된다", () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useIMEInput({ value, onChange }),
      { initialProps: { value: "" } }
    );

    rerender({ value: "외부변경" });
    expect(result.current.localValue).toBe("외부변경");
  });

  it("IME 조합 중에는 부모 value 변경이 localValue를 덮어쓰지 않는다", () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useIMEInput({ value, onChange }),
      { initialProps: { value: "" } }
    );

    // IME 조합 시작 후 로컬 입력 중
    act(() => {
      result.current.inputProps.onCompositionStart();
    });
    act(() => {
      result.current.inputProps.onChange({
        target: { value: "처" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // 부모가 외부에서 searchQuery를 바꾸더라도 조합 중에는 localValue가 유지된다
    rerender({ value: "외부변경시도" });
    expect(result.current.localValue).toBe("처");
  });
});
