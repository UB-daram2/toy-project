"use client";

/**
 * 검색 관련도 순위화 결과 뷰
 * searchKnowledgeRanked()로 계산된 점수 순으로 문서를 평탄 목록으로 표시한다.
 * 결과는 섹션별로 그룹화하며, 섹션 그룹은 해당 섹션의 최고 점수 순으로 정렬된다.
 */

import { useState } from "react";
import { ExternalLink, FileText, Search } from "lucide-react";
import {
  type KnowledgeSection,
  type SearchResult,
  searchKnowledgeRanked,
} from "@/data/knowledge-base";
import { cn, getSectionColorClasses, extractPageIdFromUrl } from "@/lib/utils";
import { NotionModal } from "./NotionModal";
import { recordPageView } from "@/lib/view-tracker";

interface SearchResultsViewProps {
  sections: KnowledgeSection[];
  query: string;
}

/** 점수에 따른 관련도 레이블과 스타일을 반환한다 */
function getRelevanceBadge(score: number): { label: string; className: string } {
  if (score >= 90) return { label: "정확 일치", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
  if (score >= 60) return { label: "관련 높음", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" };
  if (score >= 30) return { label: "관련 있음", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400" };
  return { label: "연관", className: "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400" };
}

export function SearchResultsView({ sections, query }: SearchResultsViewProps) {
  // 모달에 표시할 링크 (null이면 닫힘)
  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // 관련도 순으로 정렬된 전체 결과
  const ranked = searchKnowledgeRanked(sections, query);

  /** 링크 클릭 — 열람 수 기록 후 모달 열기 */
  function handleLinkClick(result: SearchResult) {
    const pageId = extractPageIdFromUrl(result.link.url);
    if (pageId) recordPageView(pageId, result.link.title, result.link.url);
    setActiveModal({ url: result.link.url, title: result.link.title });
  }

  // 섹션별로 그룹화 — 각 섹션의 최고 점수 기준으로 섹션 순서 결정
  const sectionGroups = ranked.reduce<
    Map<string, { section: KnowledgeSection; results: SearchResult[]; maxScore: number }>
  >((acc, result) => {
    const existing = acc.get(result.section.id);
    if (existing) {
      existing.results.push(result);
      if (result.score > existing.maxScore) existing.maxScore = result.score;
    } else {
      acc.set(result.section.id, {
        section: result.section,
        results: [result],
        maxScore: result.score,
      });
    }
    return acc;
  }, new Map());

  // 섹션 그룹을 최고 점수 내림차순으로 정렬
  const sortedGroups = [...sectionGroups.values()].sort(
    (a, b) => b.maxScore - a.maxScore
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 검색 결과 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200 dark:shadow-indigo-900/40">
          <Search className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
            &ldquo;{query}&rdquo;
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-zinc-500">
              (검색 결과)
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {ranked.length > 0
              ? `관련도 순으로 ${ranked.length}개 결과`
              : "일치하는 문서가 없습니다"}
          </p>
        </div>
      </div>

      {/* 결과 없음 */}
      {ranked.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900/50">
          <FileText className="h-10 w-10 text-gray-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm font-medium text-gray-400 dark:text-zinc-500">
            검색 결과 없음
          </p>
          <p className="mt-1 text-xs text-gray-300 dark:text-zinc-600">
            &ldquo;{query}&rdquo;에 해당하는 문서를 찾을 수 없습니다.
          </p>
        </div>
      )}

      {/* 섹션별 결과 그룹 */}
      {sortedGroups.map(({ section, results }) => {
        const colorClasses = getSectionColorClasses(section.colorKey);
        return (
          <div key={section.id} className="flex flex-col gap-3">
            {/* 섹션 구분 헤더 */}
            <h3 className={cn("flex items-center gap-2 text-sm font-semibold", colorClasses.text)}>
              <span className={cn("inline-block h-2 w-2 rounded-full bg-current opacity-70")} />
              {section.title}
              <span className="font-normal text-gray-400 dark:text-zinc-500">
                {results.length}개
              </span>
            </h3>

            {/* 결과 카드 목록 */}
            <div className="flex flex-col gap-2">
              {results.map((result) => {
                const badge = getRelevanceBadge(result.score);
                return (
                  <div
                    key={result.link.id}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100/80 bg-white px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/40"
                  >
                    {/* 섹션 색상 좌측 스트라이프 */}
                    <div
                      className={cn(
                        "h-8 w-1 flex-shrink-0 rounded-full bg-gradient-to-b",
                        colorClasses.gradient
                      )}
                    />

                    {/* 링크 본문 — 클릭 시 모달 오픈 */}
                    <button
                      onClick={() => handleLinkClick(result)}
                      className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
                    >
                      <span className="truncate text-sm font-medium text-gray-900 group-hover:text-indigo-700 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                        {result.link.title}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        {result.category.title}
                      </span>
                    </button>

                    {/* 관련도 배지 */}
                    <span
                      className={cn(
                        "hidden flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline-block",
                        badge.className
                      )}
                    >
                      {badge.label}
                    </span>

                    {/* 외부 링크 — Notion 페이지 새 탭 열기 */}
                    <a
                      href={result.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${result.link.title} 새 탭에서 열기`}
                      className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Notion 내용 모달 */}
      {activeModal && (
        <NotionModal
          pageUrl={activeModal.url}
          pageTitle={activeModal.title}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
