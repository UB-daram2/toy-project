"use client";

/**
 * 대시보드 좌측 사이드바 컴포넌트 (데스크톱 전용)
 * 모바일에서는 CSS hidden으로 숨기고, 하단 플로팅 네비게이션으로 대체된다.
 * 글래스모피즘 스타일 + 인디고-바이올렛 그라디언트 활성 상태 표시
 */

import { BookOpen, HelpCircle, Download, LayoutDashboard } from "lucide-react";
import { KnowledgeSection } from "@/data/knowledge-base";
import { cn, getSectionColorClasses } from "@/lib/utils";

interface SidebarProps {
  sections: KnowledgeSection[];
  /** 현재 활성화된 섹션 ID */
  activeSectionId: string;
  /** 섹션 클릭 시 호출되는 콜백 */
  onSectionSelect: (sectionId: string) => void;
}

/** 섹션 아이콘 이름을 실제 Lucide 컴포넌트로 매핑 */
const ICON_MAP = {
  BookOpen,
  HelpCircle,
  Download,
} as const;

type IconName = keyof typeof ICON_MAP;

export function Sidebar({ sections, activeSectionId, onSectionSelect }: SidebarProps) {
  return (
    // 모바일: hidden / 데스크톱: flex (글래스 효과)
    <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r border-gray-100/80 bg-white/80 px-3 py-6 backdrop-blur-2xl dark:border-zinc-800/50 dark:bg-zinc-900/80 md:flex">
      {/* 서비스 로고 / 타이틀 */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2.5">
          {/* 그라디언트 아이콘 */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200/60 dark:shadow-indigo-900/40">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-gray-900 dark:text-zinc-100">
              유팜 기술지원 포털
            </h1>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
              기술 지원 지식베이스
            </p>
          </div>
        </div>
      </div>

      {/* 섹션 네비게이션 목록 */}
      <nav className="flex flex-col gap-0.5">
        {/* 홈 버튼 */}
        <button
          onClick={() => onSectionSelect("home")}
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
            activeSectionId === "home"
              ? "bg-gradient-to-r from-indigo-50 to-violet-50/80 text-indigo-600 dark:from-indigo-500/10 dark:to-violet-500/10 dark:text-indigo-400"
              : "text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
          )}
        >
          {/* 활성 인디케이터 — 좌측 세로 바 */}
          {activeSectionId === "home" && (
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
          )}
          <LayoutDashboard
            className={cn(
              "h-4 w-4 flex-shrink-0 transition-colors",
              activeSectionId === "home"
                ? "text-indigo-500"
                : "text-gray-400 group-hover:text-gray-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
            )}
          />
          <span className="flex-1 truncate text-sm font-medium">홈</span>
        </button>

        {/* 섹션 구분 레이블 */}
        <div className="my-2 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-300 dark:text-zinc-600">
            섹션
          </p>
        </div>

        {sections.map((section) => {
          const isActive = section.id === activeSectionId;
          const colorClasses = getSectionColorClasses(section.colorKey);
          const IconComponent = ICON_MAP[section.icon as IconName] ?? BookOpen;
          const totalLinks = section.categories.reduce(
            (sum, category) => sum + category.links.length,
            0
          );

          return (
            <button
              key={section.id}
              onClick={() => onSectionSelect(section.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-indigo-50 to-violet-50/80 dark:from-indigo-500/10 dark:to-violet-500/10"
                  : "text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
              )}
            >
              {/* 활성 인디케이터 */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
              )}

              {/* 섹션 아이콘 컨테이너 */}
              <div
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                  isActive ? colorClasses.badge : "bg-gray-100 dark:bg-zinc-800"
                )}
              >
                <IconComponent
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive
                      ? colorClasses.text
                      : "text-gray-400 dark:text-zinc-500"
                  )}
                />
              </div>

              {/* 섹션 타이틀 */}
              <span
                className={cn(
                  "flex-1 truncate text-sm font-medium",
                  isActive ? colorClasses.text : ""
                )}
              >
                {section.title}
              </span>

              {/* 링크 수 배지 */}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive
                    ? `${colorClasses.badge} ${colorClasses.text}`
                    : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
                )}
              >
                {totalLinks}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 하단 브랜드 카드 */}
      <div className="mt-auto px-2 pt-6">
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50/80 p-3 dark:from-indigo-500/10 dark:to-violet-500/10">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            유팜시스템
          </p>
          <p className="mt-0.5 text-[10px] text-indigo-400/70 dark:text-indigo-500/60">
            기술 지원 포털 v1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
