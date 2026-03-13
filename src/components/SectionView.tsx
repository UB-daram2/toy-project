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
      {/* 섹션 히어로 배너 — 섹션 테마색 그라데이션 */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-r p-5 text-white shadow-lg",
        colorClasses.gradient
      )}>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* 반투명 아이콘 컨테이너 */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {section.title}
                {/* 검색 결과임을 나타내는 레이블 */}
                {isSearchResult && (
                  <span className="ml-2 text-sm font-normal text-white/70">
                    (검색 결과)
                  </span>
                )}
              </h2>
              <p className="mt-0.5 text-sm text-white/70">{section.description}</p>
            </div>
          </div>

          {/* 통계 배지: 카테고리 수 / 문서 수 */}
          <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <span>카테고리</span>
              <span className="font-bold">{section.categories.length}</span>
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <span>문서</span>
              <span className="font-bold">{totalLinks}</span>
            </span>
          </div>
        </div>
        {/* 장식 원 */}
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 right-14 h-16 w-16 rounded-full bg-white/5" />
      </div>

      {/* 카테고리 카드 그리드 */}
      {section.categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-12 text-sm text-gray-400 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
