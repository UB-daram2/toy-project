"use client";

/**
 * 위젯 공통 카드 래퍼
 * 상단 컬러 스트라이프 + 아이콘 헤더 + 스크롤 가능한 콘텐츠 영역을 제공한다.
 * 모든 홈 위젯이 이 컴포넌트를 사용하여 일관된 카드 UI를 구성한다.
 */

import { cn } from "@/lib/utils";

interface WidgetCardProps {
  icon: React.ReactNode;
  title: string;
  /** Tailwind gradient 클래스 쌍 — e.g. "from-blue-500 to-blue-600" */
  accentGradient: string;
  children: React.ReactNode;
}

export function WidgetCard({ icon, title, accentGradient, children }: WidgetCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg dark:bg-zinc-900">
      {/* 컬러 액센트 스트라이프 — 위젯 테마색 */}
      <div className={cn("h-1 w-full flex-shrink-0 bg-gradient-to-r", accentGradient)} />
      {/* 위젯 헤더 */}
      <div className="flex flex-shrink-0 items-center gap-2.5 px-4 py-3">
        <span className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
          accentGradient
        )}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  );
}
