"use client";

/**
 * 디지털 시계 위젯
 * 1초마다 갱신되는 한국어 날짜·시각을 표시한다.
 * SSR 하이드레이션 불일치 방지: 마운트 후에만 시각을 표시한다.
 */

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { WidgetCard } from "./WidgetCard";

export function ClockWidget() {
  // SSR 하이드레이션 불일치 방지: 마운트 후에만 시각을 표시한다
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // setInterval 콜백은 effect 내부 직접 호출이 아니므로 lint 규칙 적용 제외
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "--:--:--";
  const dateStr = now
    ? now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
    : "";

  return (
    <WidgetCard
      icon={<Clock className="h-4 w-4 text-white" />}
      title="디지털 시계"
      accentGradient="from-violet-500 to-indigo-600"
    >
      <div className="flex flex-col items-center gap-2 py-4">
        <p className="font-mono text-4xl font-bold tabular-nums text-gray-900 dark:text-zinc-100">
          {timeStr}
        </p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">{dateStr}</p>
      </div>
    </WidgetCard>
  );
}
