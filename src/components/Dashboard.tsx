"use client";

/**
 * 메인 대시보드 컴포넌트
 * 섹션 선택 상태와 검색 쿼리를 관리하며 Sidebar, Header, SectionView를 조합한다.
 */

import { useState, useMemo } from "react";
import {
  knowledgeSections,
  countTotalLinks,
  searchKnowledge,
  type KnowledgeSection,
} from "@/data/knowledge-base";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SectionView } from "./SectionView";
import { HomeView } from "./HomeView";

interface DashboardProps {
  /** 표시할 지식베이스 섹션 목록. 미전달 시 정적 데이터를 사용한다 */
  sections?: KnowledgeSection[];
}

export function Dashboard({ sections = knowledgeSections }: DashboardProps) {
  // 현재 활성 섹션 ID (초기값: "home")
  const [activeSectionId, setActiveSectionId] = useState<string>("home");

  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 전체 문서 수
  const totalDocuments = useMemo(
    () => countTotalLinks(sections),
    [sections]
  );

  // 검색어에 따라 필터링된 섹션 데이터
  const filteredSections = useMemo(
    () => searchKnowledge(sections, searchQuery),
    [sections, searchQuery]
  );

  // 검색 결과에서 현재 활성 섹션 찾기
  // 검색 결과에 활성 섹션이 없으면 첫 번째 결과 섹션을 표시
  const activeSectionData = useMemo(() => {
    if (filteredSections.length === 0) return null;
    return (
      filteredSections.find((s) => s.id === activeSectionId) ??
      filteredSections[0]
    );
  }, [filteredSections, activeSectionId]);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* 좌측 사이드바: 섹션 네비게이션 */}
      <Sidebar
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionSelect={setActiveSectionId}
      />

      {/* 우측 메인 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 상단 헤더: 검색 + 테마 토글 */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalDocuments={totalDocuments}
        />

        {/* 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 dark:bg-zinc-950">
          {/* 홈 뷰: Top5 위젯 + 날씨 */}
          {activeSectionId === "home" ? (
            <HomeView sections={sections} />
          ) : activeSectionData ? (
            <SectionView
              section={activeSectionData}
              isSearchResult={!!searchQuery.trim()}
            />
          ) : (
            /* 전체 섹션에서 검색 결과 없음 */
            <div className="flex h-full items-center justify-center text-gray-400 dark:text-zinc-500">
              <div className="text-center">
                <p className="text-lg font-medium">검색 결과 없음</p>
                <p className="mt-1 text-sm">
                  &quot;{searchQuery}&quot;에 해당하는 문서를 찾을 수 없습니다.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
