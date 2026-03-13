"use client";

/**
 * 개별 카테고리 카드 컴포넌트
 * 카테고리 제목과 소속 링크 목록을 카드 형태로 표시한다.
 * 링크 클릭 시 새 탭에서 Notion 페이지를 열어준다.
 */

import { ExternalLink } from "lucide-react";
import { KnowledgeCategory } from "@/data/knowledge-base";
import { cn, getSectionColorClasses } from "@/lib/utils";

interface CategoryCardProps {
  category: KnowledgeCategory;
  /** 부모 섹션의 색상 키 */
  colorKey: "blue" | "violet" | "emerald";
}

export function CategoryCard({ category, colorKey }: CategoryCardProps) {
  const colorClasses = getSectionColorClasses(colorKey);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all duration-200",
        colorClasses.hover
      )}
    >
      {/* 카테고리 헤더: 제목 + 링크 수 배지 */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100 truncate">
          {category.title}
        </h3>
        <span
          className={cn(
            "flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            colorClasses.badge
          )}
        >
          {category.links.length}
        </span>
      </div>

      {/* 링크 목록 */}
      <ul className="flex flex-col gap-1">
        {category.links.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              {/* 호버 시 나타나는 외부 링크 아이콘 */}
              <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="truncate">{link.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
