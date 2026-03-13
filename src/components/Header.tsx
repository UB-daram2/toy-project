"use client";

/**
 * 대시보드 상단 헤더 컴포넌트
 * 모바일: 타이틀 행(로고+테마토글) + 검색 행 (2행 레이아웃)
 * 데스크톱: 검색 + 문서 수 + 테마토글 (1행 레이아웃)
 * 글래스모피즘 sticky 헤더
 */

import { Search, Sun, Moon, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface HeaderProps {
  /** 현재 검색어 */
  searchQuery: string;
  /** 검색어 변경 시 호출되는 콜백 */
  onSearchChange: (query: string) => void;
  /** 전체 문서 수 */
  totalDocuments: number;
}

export function Header({ searchQuery, onSearchChange, totalDocuments }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  // SSR 하이드레이션 불일치 방지: 마운트 후에만 테마 UI를 렌더링
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  /** 다크/라이트 모드를 토글한다 */
  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100/80 bg-white/85 px-4 py-3 backdrop-blur-2xl dark:border-zinc-800/50 dark:bg-zinc-950/85 md:px-6 md:py-4">
      {/* ── 모바일 전용: 타이틀 + 테마 토글 행 ── */}
      <div className="mb-3 flex items-center justify-between md:hidden">
        <div>
          <h1 className="text-base font-bold leading-tight text-gray-900 dark:text-zinc-100">
            유팜 지원 포털
          </h1>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500">
            고객 지원 지식베이스
          </p>
        </div>
        {/* 모바일 테마 토글: aria-label을 "다크 모드 전환"으로 구분하여
            Desktop 테마 토글("테마 전환")과 getByRole 충돌을 방지한다 */}
        {isMounted && (
          <button
            onClick={toggleTheme}
            aria-label="다크 모드 전환"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200/60 bg-gray-50/80 text-gray-500 transition-all hover:border-gray-300 hover:bg-white hover:text-gray-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* ── 검색창 + 데스크톱 전용 우측 도구 행 ── */}
      <div className="flex items-center gap-3">
        {/* 검색 입력창 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="처리방법, 카테고리, 문서 이름 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200/80 bg-gray-50/80 py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:bg-zinc-900 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/10"
          />
          {/* 검색어 지우기 버튼 */}
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 transition-colors hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── 데스크톱 전용: 문서 수 + 테마 토글 ── */}
        <div className="hidden items-center gap-3 md:flex">
          {/* 문서 수 표시 */}
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-100/80 bg-gray-50/80 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <span className="font-semibold text-gray-700 dark:text-zinc-300">
              {totalDocuments}
            </span>
            <span className="text-gray-400 dark:text-zinc-500">개 문서</span>
          </div>

          {/* 데스크톱 테마 토글: aria-label "테마 전환" (테스트 기준값) */}
          {isMounted && (
            <button
              onClick={toggleTheme}
              aria-label="테마 전환"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/60 bg-gray-50/80 text-gray-500 transition-all hover:border-gray-300 hover:bg-white hover:text-gray-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
