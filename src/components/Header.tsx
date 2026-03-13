"use client";

/**
 * 대시보드 상단 헤더 컴포넌트
 * 검색창과 다크모드 토글 버튼을 포함한다.
 */

import { Search, Sun, Moon } from "lucide-react";
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

  // 서버 사이드 렌더링 시 테마 불일치를 방지하기 위해 마운트 후에만 테마 UI를 렌더링
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /** 다크/라이트 모드를 토글한다 */
  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <header className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-4">
      {/* 검색창 */}
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="처리방법, 카테고리, 문서 이름 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      {/* 전체 문서 수 표시 */}
      <div className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-500">
        <span className="font-medium text-zinc-300">{totalDocuments}</span>
        <span>개 문서</span>
      </div>

      {/* 다크/라이트 모드 토글 버튼 */}
      {isMounted && (
        <button
          onClick={toggleTheme}
          aria-label="테마 전환"
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      )}
    </header>
  );
}
