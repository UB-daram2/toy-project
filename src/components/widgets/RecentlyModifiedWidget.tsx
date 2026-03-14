"use client";

/**
 * 최근 수정 Top 5 위젯
 * sections props에서 모든 링크를 수집하여 lastEditedTime 기준으로 내림차순 정렬 후 상위 5개를 표시한다.
 */

import { Clock } from "lucide-react";
import type { KnowledgeSection, KnowledgeLink } from "@/data/knowledge-base";
import { WidgetCard } from "./WidgetCard";

/** Unix ms 타임스탬프를 한국어 상대 시간으로 변환한다 */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString("ko-KR");
}

interface RecentlyModifiedWidgetProps {
  sections: KnowledgeSection[];
  onOpenModal: (url: string, title: string) => void;
}

export function RecentlyModifiedWidget({ sections, onOpenModal }: RecentlyModifiedWidgetProps) {
  // 모든 링크를 수집하여 lastEditedTime 기준으로 정렬
  const topLinks: KnowledgeLink[] = sections
    .flatMap((s) => s.categories.flatMap((c) => c.links))
    .filter((l) => l.lastEditedTime != null)
    .sort((a, b) => (b.lastEditedTime ?? 0) - (a.lastEditedTime ?? 0))
    .slice(0, 5);

  return (
    <WidgetCard
      icon={<Clock className="h-4 w-4 text-white" />}
      title="최근 수정 Top 5"
      accentGradient="from-blue-500 to-blue-600"
    >
      {topLinks.length === 0 ? (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          수정 데이터가 없습니다
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {topLinks.map((link, i) => (
            <li key={link.id} className="group flex items-center gap-3">
              <span className="w-4 flex-shrink-0 text-right text-xs font-bold text-gray-300 dark:text-zinc-600">
                {i + 1}
              </span>
              <button
                onClick={() => onOpenModal(link.url, link.title)}
                className="flex-1 truncate text-left text-sm text-gray-700 transition-colors hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
              >
                {link.title}
              </button>
              <span className="flex-shrink-0 text-xs text-gray-400 dark:text-zinc-500">
                {formatRelativeTime(link.lastEditedTime!)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
