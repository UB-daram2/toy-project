"use client";

/**
 * 한국어 IME(Input Method Editor) 조합 상태를 추적하는 공통 훅
 *
 * 문제: React controlled input은 value prop을 매 렌더마다 DOM에 강제 반영한다.
 *       IME 조합 중(ㅊ→처→처방) 이 강제 반영이 발생하면 조합이 끊겨 "처ㅇ" 같은 오입력이 생긴다.
 *
 * 해결:
 *   - localValue: 입력창 표시값을 독립 상태로 관리 (React가 IME 값을 덮어쓰지 않음)
 *   - isComposingRef: 조합 중 여부를 ref로 추적해 onChange 중 부모 상태 갱신 차단
 *   - useEffect: 부모 value가 외부(지우기 버튼 등)에서 변경될 때 localValue와 동기화
 *              단, 조합 중에는 동기화하지 않아 IME 세션을 보호한다
 *
 * 사용:
 *   const { localValue, inputProps } = useIMEInput({ value: searchQuery, onChange: setSearchQuery });
 *   <input value={localValue} {...inputProps} />
 */

import { useEffect, useRef, useState } from "react";

interface UseIMEInputOptions {
  /** 부모가 관리하는 현재 값 (controlled) */
  value: string;
  /** 값이 확정되었을 때(비조합 onChange 또는 compositionEnd) 부모에 알리는 콜백 */
  onChange: (value: string) => void;
}

export interface UseIMEInputResult {
  /** 입력창에 실제로 표시되는 로컬값 (value prop에 전달) */
  localValue: string;
  /** input 요소에 스프레드할 이벤트 핸들러 묶음 */
  inputProps: {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCompositionStart: () => void;
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void;
  };
}

export function useIMEInput({ value, onChange }: UseIMEInputOptions): UseIMEInputResult {
  // 입력창 로컬 표시값 — IME 조합 중에는 부모 value와 분리하여 관리한다
  const [localValue, setLocalValue] = useState(value);

  // 조합 중 여부를 ref로 추적 — 조합 중 onChange 호출을 차단하는 게이트 역할
  const isComposingRef = useRef(false);

  // 부모 value가 외부(지우기 버튼, 섹션 이동 후 복귀 등)에서 변경될 때 로컬값에 반영한다
  // 단, IME 조합 중에는 동기화하지 않아 조합 세션이 끊기는 것을 방지한다
  useEffect(() => {
    if (!isComposingRef.current) setLocalValue(value);
  }, [value]);

  const inputProps: UseIMEInputResult["inputProps"] = {
    onChange(e) {
      const v = e.target.value;
      setLocalValue(v);
      // IME 조합 중에는 부모 상태 업데이트를 건너뛴다 (조합 완료 후 한 번에 반영)
      if (!isComposingRef.current) onChange(v);
    },

    onCompositionStart() {
      isComposingRef.current = true;
    },

    onCompositionEnd(e) {
      isComposingRef.current = false;
      // 조합 완료 후 최종값으로 로컬 및 부모 상태를 동시에 갱신한다
      const v = (e.currentTarget as HTMLInputElement).value;
      setLocalValue(v);
      onChange(v);
    },
  };

  return { localValue, inputProps };
}
