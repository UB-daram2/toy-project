"use client";

/**
 * 많이 본 게시물 Top 5 위젯
 * localStorage에 기록된 열람 수를 마운트 시 1회 읽어 상위 5개를 표시한다.
 * MostViewedWidget의 localStorage 직접 접근 예외: CategoryCard가 기록하는 열람 수를
 * 단방향으로 읽는 구조이므로 Zustand 스토어화하지 않는다 (CLAUDE.md 참고).
 */

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { getTopViewed } from "@/lib/view-tracker";
import { WidgetCard } from "./WidgetCard";

interface MostViewedWidgetProps {
  onOpenModal: (url: string, title: string) => void;
}

export function MostViewedWidget({ onOpenModal }: MostViewedWidgetProps) {
  const [topViewed, setTopViewed] = useState<
    Array<{ pageId: string; title: string; url: string; count: number }>
  >([]);

  // 클라이언트에서만 localStorage를 읽는다
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTopViewed(getTopViewed(5)); // localStorage는 클라이언트 전용 — 마운트 후 1회만 읽음
  }, []);

  return (
    <WidgetCard
      icon={<TrendingUp className="h-4 w-4 text-white" />}
      title="많이 본 게시물 Top 5"
      accentGradient="from-violet-500 to-purple-600"
    >
      {topViewed.length === 0 ? (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          아직 열람 기록이 없습니다
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {topViewed.map((item, i) => (
            <li key={item.pageId} className="group flex items-center gap-3">
              <span className="w-4 flex-shrink-0 text-right text-xs font-bold text-gray-300 dark:text-zinc-600">
                {i + 1}
              </span>
              <button
                onClick={() => onOpenModal(item.url, item.title)}
                className="flex-1 truncate text-left text-sm text-gray-700 transition-colors hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400"
              >
                {item.title}
              </button>
              <span className="flex-shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                {item.count}회
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
