"use client";

/**
 * 메인 대시보드 컴포넌트
 * 섹션 선택 상태와 검색 쿼리를 관리하며 Sidebar, Header, SectionView를 조합한다.
 * 모바일: 세로 스크롤 레이아웃 + 하단 플로팅 네비게이션 바
 * 데스크톱: 좌측 글래스 사이드바 + 우측 내부 스크롤 메인 영역
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
import { LayoutDashboard, BookOpen, HelpCircle, Download } from "lucide-react";
import { cn, getSectionColorClasses } from "@/lib/utils";

interface DashboardProps {
  /** 표시할 지식베이스 섹션 목록. 미전달 시 정적 데이터를 사용한다 */
  sections?: KnowledgeSection[];
}

/** 모바일 하단 네비게이션 전용 아이콘 맵 */
const MOBILE_ICON_MAP = { BookOpen, HelpCircle, Download } as const;
type MobileIconName = keyof typeof MOBILE_ICON_MAP;

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
  const activeSectionData = useMemo(() => {
    if (filteredSections.length === 0) return null;
    return (
      filteredSections.find((s) => s.id === activeSectionId) ??
      filteredSections[0]
    );
  }, [filteredSections, activeSectionId]);

  return (
    // 모바일: flex-col min-h-screen (세로 자연 스크롤)
    // 데스크톱: flex-row h-screen overflow-hidden (사이드바 + 내부 스크롤)
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-violet-50/20 text-gray-900 dark:from-zinc-950 dark:via-zinc-950 dark:to-violet-950/10 dark:text-zinc-100 md:h-screen md:flex-row md:overflow-hidden">
      {/* 좌측 사이드바: 데스크톱 전용 (모바일에서 CSS hidden) */}
      <Sidebar
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionSelect={setActiveSectionId}
      />

      {/* 우측 메인 영역 */}
      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        {/* 상단 헤더: 검색 + 다크모드 토글 */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalDocuments={totalDocuments}
        />

        {/* 콘텐츠 영역: 모바일은 하단 네비 높이만큼 여백 확보 */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-28 md:px-6 md:py-6 md:pb-6">
          {activeSectionId === "home" && !searchQuery.trim() ? (
            <HomeView sections={sections} />
          ) : activeSectionData ? (
            <SectionView
              section={activeSectionData}
              isSearchResult={!!searchQuery.trim()}
            />
          ) : (
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

      {/* 모바일 하단 플로팅 네비게이션 바
          aria-hidden: 사이드바와 동일한 버튼이 중복 렌더링되어 JSDOM 기반
          접근성 쿼리(getByRole)가 중복을 감지하지 않도록 숨긴다.
          실제 브라우저에서는 터치/마우스로 정상 동작한다. */}
      <nav
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 md:hidden"
      >
        {/* 플로팅 pill 컨테이너 */}
        <div className="flex items-center justify-around rounded-2xl border border-gray-200/60 bg-white/90 px-2 py-1.5 shadow-xl shadow-gray-300/30 backdrop-blur-2xl dark:border-zinc-700/40 dark:bg-zinc-900/90 dark:shadow-zinc-900/60">
          {/* 홈 버튼 */}
          <button
            onClick={() => setActiveSectionId("home")}
            className="flex flex-col items-center gap-1 px-4 py-1"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                activeSectionId === "home"
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-300/50 dark:shadow-indigo-800/50"
                  : ""
              )}
            >
              <LayoutDashboard
                className={cn(
                  "h-4 w-4 transition-colors",
                  activeSectionId === "home"
                    ? "text-white"
                    : "text-gray-400 dark:text-zinc-500"
                )}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium leading-none transition-colors",
                activeSectionId === "home"
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400 dark:text-zinc-500"
              )}
            >
              홈
            </span>
          </button>

          {/* 섹션 버튼 (최대 3개) */}
          {sections.slice(0, 3).map((section) => {
            const isActive = section.id === activeSectionId;
            const IconComponent =
              MOBILE_ICON_MAP[section.icon as MobileIconName] ?? BookOpen;
            const colorClasses = getSectionColorClasses(section.colorKey);
            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-300/50 dark:shadow-indigo-800/50"
                      : ""
                  )}
                >
                  <IconComponent
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-white"
                        : colorClasses.text + " opacity-50"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "max-w-[56px] truncate text-[10px] font-medium leading-none transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400 dark:text-zinc-500"
                  )}
                >
                  {section.title}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
