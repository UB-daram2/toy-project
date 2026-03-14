"use client";

/**
 * API fetch 위젯을 위한 공통 상태 관리 훅
 * isLoading / error / data 3종 상태를 추상화하여 DRY 원칙을 준수한다.
 * 외부 API 위젯(증시·날씨·환율·캘린더 등)의 반복 fetch 패턴을 제거한다.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface FetchWidgetResult<T> {
  data: T | null;
  isLoading: boolean;
  error: boolean;
  /** fetch를 재실행한다 (에러 후 재시도 버튼에 연결) */
  retry: () => void;
}

/**
 * 비동기 fetcher를 받아 data / isLoading / error / retry를 반환한다.
 * - 마운트 시 1회 자동 실행
 * - retry() 호출로 재시도 (triggerCount 증가 → useEffect 재실행)
 * - fetcherRef를 useEffect에서 동기화하여 React render 중 ref 변경 금지 규칙 준수
 */
export function useFetchWidget<T>(fetcher: () => Promise<T>): FetchWidgetResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  // retry 트리거 카운터: 0에서 시작하여 retry() 호출 시 +1
  const [triggerCount, setTriggerCount] = useState(0);

  // 렌더 이후 최신 fetcher로 ref를 동기화 (render 중 ref 직접 변경 금지)
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  // fetch 실행 함수: isLoading·error 초기화 후 fetcherRef의 최신 fetcher 호출
  const load = useCallback(() => {
    setIsLoading(true);
    setError(false);
    fetcherRef.current()
      .then((d) => setData(d))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []); // fetcherRef는 항상 최신을 참조하는 안정적인 객체이므로 의존성에서 제외

  // triggerCount가 변경될 때마다 load를 실행 (마운트 시 0으로 1회, retry() 시 재실행)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [triggerCount, load]);

  // triggerCount를 증가시켜 useEffect를 재실행 (메모이제이션으로 안정적인 참조 유지)
  const retry = useCallback(() => setTriggerCount((n) => n + 1), []);

  return { data, isLoading, error, retry };
}
