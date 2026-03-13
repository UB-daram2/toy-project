"use client";

/**
 * 개별 카테고리 카드 컴포넌트
 * 카테고리 제목과 소속 링크 목록을 카드 형태로 표시한다.
 * 링크 텍스트 클릭 → Notion 내용을 모달로 표시
 * 외부 링크 아이콘 클릭 → 새 탭에서 Notion 페이지 직접 오픈
 */

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { KnowledgeCategory } from "@/data/knowledge-base";
import { cn, getSectionColorClasses } from "@/lib/utils";
import { NotionModal } from "./NotionModal";

interface CategoryCardProps {
  category: KnowledgeCategory;
  /** 부모 섹션의 색상 키 */
  colorKey: "blue" | "violet" | "emerald";
}

export function CategoryCard({ category, colorKey }: CategoryCardProps) {
  const colorClasses = getSectionColorClasses(colorKey);

  // 현재 열려 있는 모달의 링크 정보 (null이면 모달 닫힘)
  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

  return (
    <>
      <div
        className={cn(
          "flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900/50",
          colorClasses.hover
        )}
      >
        {/* 카테고리 헤더: 제목 + 링크 수 배지 */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate dark:text-zinc-100">
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
              <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800">
                {/* 링크 제목 버튼: 클릭 시 Notion 내용 모달 표시 */}
                <button
                  onClick={() =>
                    setActiveModal({ url: link.url, title: link.title })
                  }
                  className="flex-1 truncate text-left text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {link.title}
                </button>

                {/* 외부 링크 아이콘: 호버 시 나타나며 Notion 직접 열기 */}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${link.title} Notion에서 열기`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-100"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </li>
          ))}
        </ul>
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
