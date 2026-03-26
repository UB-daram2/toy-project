import { useCallback, useRef, useState } from "react";

/**
 * 이스터에그 훅: 타이틀 N번 빠르게 클릭 시 모달을 표시한다.
 * 800ms 이내 추가 클릭이 없으면 카운터가 리셋된다.
 */
export function useEasterEgg(threshold = 5) {
  const clickCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [show, setShow] = useState(false);

  /* istanbul ignore next -- 이스터에그 로직, 테스트 불필요 */
  const handleClick = useCallback(() => {
    clickCountRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (clickCountRef.current >= threshold) {
      clickCountRef.current = 0;
      setShow(true);
    } else {
      timerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 800);
    }
  }, [threshold]);

  const close = useCallback(() => setShow(false), []);

  return { show, handleClick, close };
}
