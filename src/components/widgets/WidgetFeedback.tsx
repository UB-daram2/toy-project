"use client";

/**
 * 위젯 공통 피드백 컴포넌트
 * WeatherWidget, WeeklyWeatherWidget, CalendarWidget 등
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

/** 위젯 빈 상태 안내 문구 */
export function WidgetEmptyState({ message }: { message: string }) {
  return (
    <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
      {message}
    </p>
  );
}

/** 추가/취소 폼 버튼 쌍 */
export function FormActionButtons({
  onConfirm,
  onCancel,
  confirmColor = "bg-sky-500 hover:bg-sky-600",
}: {
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onConfirm}
        className={`flex-1 rounded-lg py-1.5 text-xs font-medium text-white ${confirmColor}`}
      >
        추가
      </button>
      <button
        onClick={onCancel}
        className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400"
      >
        취소
      </button>
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
