"use client";

/**
 * 대시보드 좌측 사이드바 컴포넌트
 * 메인 섹션 목록을 표시하고 활성 섹션을 강조한다.
 */

import { BookOpen, HelpCircle, Download } from "lucide-react";
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
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-6">
      {/* 서비스 로고 / 타이틀 */}
      <div className="mb-8 px-3">
        <h1 className="text-lg font-bold text-zinc-100">유팜 지원 포털</h1>
        <p className="mt-1 text-xs text-zinc-500">고객 지원 지식베이스</p>
      </div>

      {/* 섹션 네비게이션 목록 */}
      <nav className="flex flex-col gap-1">
        {sections.map((section) => {
          const isActive = section.id === activeSectionId;
          const colorClasses = getSectionColorClasses(section.colorKey);

          // 아이콘 컴포넌트를 동적으로 선택
          const IconComponent = ICON_MAP[section.icon as IconName] ?? BookOpen;

          // 전체 링크 수 계산
          const totalLinks = section.categories.reduce(
            (sum, category) => sum + category.links.length,
            0
          );

          return (
            <button
              key={section.id}
              onClick={() => onSectionSelect(section.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                isActive
                  ? `bg-zinc-800 ${colorClasses.text}`
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              )}
            >
              {/* 섹션 아이콘 */}
              <IconComponent
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive ? colorClasses.text : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />

              {/* 섹션 타이틀 */}
              <span className="flex-1 truncate text-sm font-medium">
                {section.title}
              </span>

              {/* 링크 수 배지 */}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                  isActive
                    ? colorClasses.badge
                    : "bg-zinc-800 text-zinc-500 ring-zinc-700"
                )}
              >
                {totalLinks}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
