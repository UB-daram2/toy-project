"use client";

/**
 * 개별 카테고리 카드 컴포넌트
 * 카테고리 제목과 소속 링크 목록을 카드 형태로 표시한다.
 * 링크가 많을 경우 일부만 미리보기로 표시하고 "더 보기" 버튼으로 확장한다.
 * 링크 텍스트 클릭 → Notion 내용을 모달로 표시
 * 외부 링크 아이콘 클릭 → 새 탭에서 Notion 페이지 직접 오픈
 */

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { KnowledgeCategory } from "@/data/knowledge-base";
import { cn, getSectionColorClasses, extractPageIdFromUrl } from "@/lib/utils";
import { NotionModal } from "./NotionModal";
import { recordPageView } from "@/lib/view-tracker";

/** 더 보기 없이 표시할 링크 최대 개수 */
const PREVIEW_COUNT = 6;

interface CategoryCardProps {
  category: KnowledgeCategory;
  colorKey: "blue" | "violet" | "emerald";
}

export function CategoryCard({ category, colorKey }: CategoryCardProps) {
  const colorClasses = getSectionColorClasses(colorKey);

  // 모달에 표시할 링크 (null이면 닫힘)
  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // 더 보기 확장 여부
  const [expanded, setExpanded] = useState(false);

  const hasMore = category.links.length > PREVIEW_COUNT;
  const visibleLinks = expanded
    ? category.links
    : category.links.slice(0, PREVIEW_COUNT);
  const hiddenCount = category.links.length - PREVIEW_COUNT;

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        {/* 카드 헤더: 색상 인디케이터 + 제목 + 링크 수 배지 */}
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
          <div
            className={cn("h-4 w-1 flex-shrink-0 rounded-full", colorClasses.accent)}
          />
          <h3 className="flex-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
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
        <ul className="flex flex-col py-1">
          {visibleLinks.map((link) => (
            <li key={link.id} className="group flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/60">
              {/* 링크 제목: 클릭 시 Notion 내용 모달 표시 */}
              <button
                onClick={() => {
                  // 열람 수 기록: 모달 열릴 때마다 카운트 증가
                  const pageId = extractPageIdFromUrl(link.url);
                  if (pageId) recordPageView(pageId, link.title, link.url);
                  setActiveModal({ url: link.url, title: link.title });
                }}
                className={cn(
                  "flex-1 truncate text-left text-sm",
                  "text-gray-600 transition-colors hover:text-gray-900",
                  "dark:text-zinc-400 dark:hover:text-zinc-100"
                )}
              >
                {link.title}
              </button>

              {/* 외부 링크 아이콘: 호버 시 표시 */}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.title} Notion에서 열기`}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:text-gray-600 dark:text-zinc-600 dark:hover:text-zinc-300"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>

        {/* 더 보기 / 접기 버튼 */}
        {hasMore && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className={cn(
              "mx-3 mb-3 mt-1 flex items-center justify-center gap-1 rounded-lg",
              "border border-dashed border-gray-200 py-1.5 text-xs",
              "text-gray-400 transition-colors",
              "hover:border-gray-300 hover:text-gray-600",
              "dark:border-zinc-700 dark:text-zinc-500",
              "dark:hover:border-zinc-600 dark:hover:text-zinc-400"
            )}
          >
            {expanded ? (
              <>
                접기
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                {hiddenCount}개 더 보기
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* 모달: activeModal이 있을 때만 렌더링 */}
      {activeModal && (
        <NotionModal
          pageUrl={activeModal.url}
          pageTitle={activeModal.title}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}
