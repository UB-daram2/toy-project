"use client";

/**
 * 위젯 공통 피드백 컴포넌트
 * WeatherWidget, WeeklyWeatherWidget, StockWidget, ExchangeRateWidget 등
 * useFetchWidget 기반 위젯에서 반복되는 로딩/에러 UI를 추출한 것이다.
 */

import { RefreshCw } from "lucide-react";

/** 데이터 로딩 중임을 나타내는 인라인 스피너 */
export function WidgetLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-4">
      <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
    </div>
  );
}

/** fetch 실패 시 에러 메시지와 재시도 버튼 */
export function WidgetError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400">{message}</p>
      <button onClick={onRetry} className="mt-2 text-xs text-indigo-500 hover:underline">
        다시 시도
      </button>
    </div>
  );
}
