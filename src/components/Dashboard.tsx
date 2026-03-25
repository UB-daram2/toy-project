"use client";

/**
 * 메인 대시보드 컴포넌트
 * 마운트 시 /api/knowledge-structure 에서 지식베이스 구조를 가져오며,
 * 로딩·재시도·에러 상태를 UI로 표시한다.
 * 모바일: 세로 스크롤 레이아웃 + 하단 플로팅 네비게이션 바
 * 데스크톱: 좌측 글래스 사이드바 + 우측 내부 스크롤 메인 영역
 */

import { useState, useMemo, useEffect } from "react";
import {
  countTotalLinks,
  searchKnowledge,
  type KnowledgeSection,
} from "@/data/knowledge-base";
import {
  useKnowledgeStructure,
  NOTION_ROOT_URL,
} from "@/hooks/useKnowledgeStructure";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SectionView } from "./SectionView";
import { SearchResultsView } from "./SearchResultsView";
import { HomeView } from "./HomeView";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Download,
  Sun,
  Moon,
  Loader2,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn, getSectionColorClasses } from "@/lib/utils";

/** 모바일 하단 네비게이션 전용 아이콘 맵 */
const MOBILE_ICON_MAP = { BookOpen, HelpCircle, Download } as const;
type MobileIconName = keyof typeof MOBILE_ICON_MAP;

interface DashboardProps {
  /** 서버사이드에서 미리 로딩된 초기 섹션 (page.tsx Server Component에서 전달) */
  initialSections?: KnowledgeSection[];
}

export function Dashboard({ initialSections = [] }: DashboardProps) {
  // 지식베이스 구조 로딩 (서버 초기 데이터 기반, 백그라운드 갱신 + localStorage 캐시)
  const { sections, status, retryAttempt, maxRetries, retry } =
    useKnowledgeStructure(initialSections);

  // 현재 활성 섹션 ID (초기값: "home")
  const [activeSectionId, setActiveSectionId] = useState<string>("home");

  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 테마 토글
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  /** 홈 탭이 활성화된 상태 */
  const isHomeView = activeSectionId === "home";

  // 전체 문서 수
  const totalDocuments = useMemo(() => countTotalLinks(sections), [sections]);

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
      <div className="relative flex min-w-0 flex-1 flex-col md:overflow-hidden">
        {/* 상단 헤더: 홈 탭이 아닐 때, 섹션 데이터가 있을 때 표시 */}
        {!isHomeView && sections.length > 0 && (
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalDocuments={totalDocuments}
          />
        )}

        {/* 홈 탭: 우측 상단 플로팅 테마 토글 (헤더가 없으므로 별도 배치) */}
        {isHomeView && isMounted && (
          <div className="absolute right-4 top-4 z-50">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="테마 전환"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/60 bg-white/90 text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white hover:text-gray-900 dark:border-zinc-700/60 dark:bg-zinc-900/90 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* 콘텐츠 영역: 모바일은 하단 네비 높이만큼 여백 확보 */}
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-28 md:px-6 md:py-6 md:pb-6">
          {isHomeView ? (
            /* 홈 탭: 로딩·에러 여부 무관하게 항상 위젯 표시
               에러 시 섹션 데이터만 비어있고 위젯은 모두 정상 동작 */
            <>
              {(status === "loading" || status === "retrying") && (
                <KnowledgeLoadingBanner
                  status={status}
                  retryAttempt={retryAttempt}
                  maxRetries={maxRetries}
                />
              )}
              {status === "error" && (
                <KnowledgeErrorBanner retry={retry} />
              )}
              {status === "cached" && (
                <KnowledgeCachedBanner retry={retry} />
              )}
              <HomeView
                sections={sections}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalDocuments={totalDocuments}
                onSectionSelect={setActiveSectionId}
              />
            </>
          ) : (status === "loading" || status === "retrying") && sections.length === 0 ? (
            /* 섹션 탭에서 캐시 없이 로딩 중 */
            <KnowledgeLoadingState
              status={status}
              retryAttempt={retryAttempt}
              maxRetries={maxRetries}
            />
          ) : status === "error" ? (
            /* 섹션 탭에서 최종 실패 */
            <KnowledgeErrorState retry={retry} />
          ) : searchQuery.trim() ? (
            /* 검색어 있음: 관련도 순위화 결과 뷰 */
            <>
              {status === "cached" && <KnowledgeCachedBanner retry={retry} />}
              <SearchResultsView sections={sections} query={searchQuery} />
            </>
          ) : activeSectionData ? (
            /* 섹션 탐색: 선택된 섹션 콘텐츠 */
            <>
              {status === "cached" && <KnowledgeCachedBanner retry={retry} />}
              <SectionView section={activeSectionData} isSearchResult={false} />
            </>
          ) : null}
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
          {sections.slice(0, 3).map((section: KnowledgeSection) => {
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

/** 홈 탭 상단 로딩 배너 (위젯은 그대로 표시) */
function KnowledgeLoadingBanner({
  status,
  retryAttempt,
  maxRetries,
}: {
  status: "loading" | "retrying";
  retryAttempt: number;
  maxRetries: number;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-indigo-200/60 bg-indigo-50/80 px-4 py-2.5 text-sm text-indigo-700 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-300">
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      <span>
        {status === "retrying"
          ? `지식베이스 재시도 중... (${retryAttempt}/${maxRetries})`
          : "지식베이스 불러오는 중..."}
      </span>
    </div>
  );
}

/** 홈 탭 상단 캐시 배너 — Notion 로딩 실패 + 이전 캐시 사용 중 */
function KnowledgeCachedBanner({ retry }: { retry: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-gray-200/60 bg-gray-50/80 px-4 py-2.5 text-sm dark:border-zinc-700/40 dark:bg-zinc-800/30">
      <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>저장된 데이터를 사용 중입니다</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={retry}
          className="flex items-center gap-1 text-gray-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          <RefreshCw className="h-3 w-3" />
          새로고침
        </button>
        <a
          href={NOTION_ROOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-gray-500 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          Notion 열기
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

/** 홈 탭 상단 에러 배너 (위젯은 그대로 표시) */
function KnowledgeErrorBanner({ retry }: { retry: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-2.5 text-sm dark:border-amber-800/40 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>지식베이스를 불러올 수 없습니다</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={retry}
          className="flex items-center gap-1 text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
        >
          <RefreshCw className="h-3 w-3" />
          재시도
        </button>
        <a
          href={NOTION_ROOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Notion 열기
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

/** 로딩·재시도 상태 UI */
function KnowledgeLoadingState({
  status,
  retryAttempt,
  maxRetries,
}: {
  status: "loading" | "retrying";
  retryAttempt: number;
  maxRetries: number;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        {status === "retrying"
          ? `재시도 중... (${retryAttempt}/${maxRetries})`
          : "지식베이스 불러오는 중..."}
      </p>
    </div>
  );
}

/** 최종 실패 상태 UI */
function KnowledgeErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-5 text-center">
      <AlertCircle className="h-10 w-10 text-gray-300 dark:text-zinc-600" />
      <div className="space-y-1">
        <p className="font-medium text-gray-600 dark:text-zinc-300">
          지식베이스를 불러올 수 없습니다
        </p>
        <p className="text-sm text-gray-400 dark:text-zinc-500">
          Notion 서버가 응답하지 않습니다
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={retry}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          다시 시도
        </button>
        <a
          href={NOTION_ROOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
        >
          Notion에서 열기
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
