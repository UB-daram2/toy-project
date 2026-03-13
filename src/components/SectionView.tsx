"use client";

/**
 * 활성 섹션의 전체 콘텐츠를 표시하는 컴포넌트
 * 섹션 제목, 설명, 통계 배지, 카테고리 카드 그리드를 렌더링한다.
 */

import { BookOpen, HelpCircle, Download } from "lucide-react";
import { KnowledgeSection } from "@/data/knowledge-base";
import { getSectionColorClasses, cn } from "@/lib/utils";
import { CategoryCard } from "./CategoryCard";

interface SectionViewProps {
  section: KnowledgeSection;
  /** 검색어가 있을 때 검색 결과임을 표시 */
  isSearchResult?: boolean;
}

/** 아이콘 이름 → Lucide 컴포넌트 매핑 */
const ICON_MAP = {
  BookOpen,
  HelpCircle,
  Download,
} as const;

type IconName = keyof typeof ICON_MAP;

export function SectionView({ section, isSearchResult = false }: SectionViewProps) {
  const colorClasses = getSectionColorClasses(section.colorKey);
  const IconComponent = ICON_MAP[section.icon as IconName] ?? BookOpen;

  // 해당 섹션의 전체 링크 수를 계산
  const totalLinks = section.categories.reduce(
    (sum, category) => sum + category.links.length,
    0
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 섹션 헤더: 아이콘 + 제목 + 설명 + 통계 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* 색상 강조된 아이콘 컨테이너 */}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              `${colorClasses.badge} ring-1 ring-inset ${colorClasses.border}`
            )}
          >
            <IconComponent className={cn("h-5 w-5", colorClasses.text)} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">
              {section.title}
              {/* 검색 결과임을 나타내는 레이블 */}
              {isSearchResult && (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  (검색 결과)
                </span>
              )}
            </h2>
            <p className="text-sm text-zinc-500">{section.description}</p>
          </div>
        </div>

        {/* 통계 배지: 카테고리 수 / 문서 수 */}
        <div className="hidden sm:flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            <span className="text-zinc-500">카테고리</span>
            <span className="font-medium text-zinc-100">{section.categories.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            <span className="text-zinc-500">문서</span>
            <span className={cn("font-medium", colorClasses.text)}>{totalLinks}</span>
          </div>
        </div>
      </div>

      {/* 카테고리 카드 그리드 */}
      {section.categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {section.categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              colorKey={section.colorKey}
            />
          ))}
        </div>
      ) : (
        /* 검색 결과 없음 표시 */
        <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 py-12 text-sm text-zinc-500">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
