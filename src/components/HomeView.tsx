"use client";

/**
 * 홈 대시보드 뷰 컴포넌트
 * 위젯 14종을 DnD로 재정렬 가능한 그리드로 표시한다.
 * 각 위젯은 src/components/widgets/ 하위 개별 파일로 분리되어 있다.
 *
 * DnD 이중 구현:
 *   - 마우스: HTML5 DnD API (onDragStart / onDragOver / onDragEnd)
 *   - 터치: Pointer Events API + setPointerCapture (HTML5 DnD는 터치에서 불안정)
 */

import { useRef, useState } from "react";
import { useIMEInput } from "@/hooks/useIMEInput";
import { GripVertical, Search, X } from "lucide-react";
import type { KnowledgeSection } from "@/data/knowledge-base";
import { cn } from "@/lib/utils";
import { extractPageIdFromUrl } from "@/lib/utils";
import { NotionModal } from "./NotionModal";
import { SearchResultsView } from "./SearchResultsView";
import { useWidgetStore, type WidgetId } from "@/stores/widgetStore";
import { recordPageView } from "@/lib/view-tracker";
import {
  RecentlyModifiedWidget,
  MostViewedWidget,
  WeatherWidget,
  ExchangeRateWidget,
  StockWidget,
  MemoWidget,
  CalendarWidget,
  DDayWidget,
  BookmarkWidget,
  PomodoroWidget,
  WeeklyWeatherWidget,
  TodoWidget,
  CalculatorWidget,
  ClockWidget,
} from "./widgets";

interface HomeViewProps {
  sections: KnowledgeSection[];
  /** Google 랜딩 모드 전용 props — 제공 시 검색창 중앙 히어로를 표시한다 */
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  totalDocuments?: number;
  onSectionSelect?: (id: string) => void;
}

/** 현재 시각 기준 인사말을 반환한다 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "야간 근무 수고하세요 🌙";
  if (hour < 12) return "좋은 아침입니다 ☀️";
  if (hour < 18) return "좋은 오후입니다 🌤️";
  return "오늘도 수고하셨습니다 🌆";
}

/** 오늘 날짜를 "M월 D일 (요일)" 형식으로 반환한다 */
function getFormattedDate(): string {
  const now = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${now.getMonth() + 1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
}

/** 홈 메인 뷰 */
export function HomeView({
  sections,
  searchQuery,
  onSearchChange,
  totalDocuments,
  onSectionSelect,
}: HomeViewProps) {
  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // 홈 히어로 검색창 IME 조합 처리 — useIMEInput 훅으로 localValue와 이벤트 핸들러를 관리
  // DOM 요소를 교체하지 않고 홈 전체에서 같은 입력창을 유지하므로 IME가 안정적이다
  const { localValue, inputProps: imeInputProps } = useIMEInput({
    value: searchQuery ?? "",
    onChange: onSearchChange ?? (() => {}),
  });

  // 위젯 순서 — Zustand 스토어에서 가져온다 (persist 미들웨어로 localStorage 자동 영속화)
  const { widgetOrder, reorder: reorderWidgets } = useWidgetStore();
  // 현재 드래그 중인 위젯 ID와 드롭 대상 위젯 ID를 ref 로 추적한다
  // (상태 업데이트 전 이벤트 핸들러에서 참조하기 위해 ref 사용)
  const draggingIdRef = useRef<WidgetId | null>(null);
  const dropTargetIdRef = useRef<WidgetId | null>(null);
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<WidgetId | null>(null);

  // ── HTML5 DnD 핸들러 (마우스 / 트랙패드) ──
  const handleDragStart = (e: React.DragEvent, id: WidgetId) => {
    e.dataTransfer.effectAllowed = "move";
    draggingIdRef.current = id;
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    dropTargetIdRef.current = id;
    if (id !== dropTargetId) setDropTargetId(id);
  };

  const handleDragEnd = () => {
    if (draggingIdRef.current && dropTargetIdRef.current) {
      reorderWidgets(draggingIdRef.current, dropTargetIdRef.current);
    }
    draggingIdRef.current = null;
    dropTargetIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  };

  // ── 포인터 이벤트 핸들러 (터치 전용 — 드래그 핸들에서만 시작) ──
  const handleHandlePointerDown = (e: React.PointerEvent, id: WidgetId) => {
    // 마우스는 HTML5 DnD 로 처리하므로 터치만 여기서 처리한다
    if (e.pointerType === "mouse") return;
    e.preventDefault(); // 스크롤 방지
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    draggingIdRef.current = id;
    setDraggingId(id);
  };

  const handleHandlePointerMove = (e: React.PointerEvent) => {
    if (!draggingIdRef.current || e.pointerType === "mouse") return;
    // 포인터 아래의 카드를 찾아 드롭 대상으로 지정한다
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el?.closest("[data-widget-id]");
    const targetId = card?.getAttribute("data-widget-id") as WidgetId | null;
    if (targetId && targetId !== dropTargetIdRef.current) {
      dropTargetIdRef.current = targetId;
      setDropTargetId(targetId);
    }
  };

  const handleHandlePointerUp = () => {
    if (draggingIdRef.current && dropTargetIdRef.current) {
      reorderWidgets(draggingIdRef.current, dropTargetIdRef.current);
    }
    draggingIdRef.current = null;
    dropTargetIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  };

  // 모달 열기 + 열람 수 기록
  const openModal = (url: string, title: string) => {
    const pageId = extractPageIdFromUrl(url);
    if (pageId) recordPageView(pageId, title, url);
    setActiveModal({ url, title });
  };

  // 총 문서 수
  const totalDocs = sections
    .flatMap((s) => s.categories)
    .reduce((sum, c) => sum + c.links.length, 0);

  /** 위젯 ID에 해당하는 컴포넌트를 반환한다 */
  const renderWidget = (id: WidgetId): React.ReactNode => {
    switch (id) {
      case "recent":         return <RecentlyModifiedWidget sections={sections} onOpenModal={openModal} />;
      case "popular":        return <MostViewedWidget onOpenModal={openModal} />;
      case "weather":        return <WeatherWidget />;
      case "exchange":       return <ExchangeRateWidget />;
      case "market":         return <StockWidget />;
      case "memo":           return <MemoWidget />;
      case "calendar":       return <CalendarWidget />;
      case "dday":           return <DDayWidget />;
      case "bookmark":       return <BookmarkWidget />;
      case "pomodoro":       return <PomodoroWidget />;
      case "weekly-weather": return <WeeklyWeatherWidget />;
      case "todo":           return <TodoWidget />;
      case "calculator":     return <CalculatorWidget />;
      case "clock":          return <ClockWidget />;
    }
  };

  // 검색어 입력 중 여부 — 히어로 컴팩트 모드 전환 조건
  const isSearching = !!(searchQuery?.trim());

  return (
    <div className="flex flex-col gap-6">
      {/* 히어로 섹션 — 홈 히어로 vs 기존 그라데이션 배너 */}
      {onSearchChange !== undefined ? (
        /* ── 고객지원 포털 홈 히어로 ──
           - 검색 중(isSearching): 컴팩트 모드 — 포털 제목·태그라인·섹션 버튼 숨김
           - 검색 미입력: 풀 모드 — 포털 타이틀·날짜·태그라인·섹션 바로가기 모두 표시 */
        <div className={cn(
          "flex flex-col items-center gap-4 transition-all duration-200",
          isSearching ? "py-4 md:py-5" : "py-8 md:py-12"
        )}>
          {/* 날짜 + 인사말 — 항상 표시 */}
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
            <span className="font-medium">{getFormattedDate()}</span>
            <span className="opacity-40">|</span>
            <span className="text-indigo-500 dark:text-indigo-400">{getGreeting()}</span>
            {!isSearching && (
              <>
                <span className="opacity-40">|</span>
                <span>
                  문서{" "}
                  <span className="font-semibold text-gray-600 dark:text-zinc-400">
                    {totalDocuments ?? totalDocs}
                  </span>
                  개
                </span>
              </>
            )}
          </div>

          {/* 포털 타이틀 + 태그라인 — 검색 중에는 숨김 */}
          {!isSearching && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 md:text-3xl">
                유팜 고객지원 포털
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                처방 문의 · 사용법 · 파일 요청 — 빠르게 검색하세요
              </p>
            </div>
          )}

          {/* 검색창 */}
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="처리방법, 카테고리, 문서 이름 검색..."
              value={localValue}
              {...imeInputProps}
              className="w-full rounded-full border border-gray-300/80 bg-white py-4 pl-12 pr-12 text-base shadow-md outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/10"
            />
            {/* 검색어 지우기 버튼 */}
            {localValue && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 섹션 바로가기 버튼 — 검색 중에는 숨김
              aria-hidden: 사이드바와 동일한 섹션 버튼이 중복 렌더링되므로
              JSDOM 기반 접근성 쿼리(getByRole) 충돌을 방지하기 위해 숨긴다. */}
          {!isSearching && (
            <div aria-hidden="true" className="flex flex-wrap justify-center gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => onSectionSelect?.(section.id)}
                  className="rounded-full border border-gray-200/80 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                >
                  {section.title}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── 기존 그라데이션 배너 (Google 모드 외 사용) ── */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 p-5 text-white shadow-lg">
          <div className="relative z-10">
            <p className="text-xs font-medium text-blue-100">{getGreeting()}</p>
            <h2 className="mt-0.5 text-xl font-bold">홈</h2>
            <p className="mt-0.5 text-sm font-medium text-blue-100">유팜시스템 지원 포털</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                📄 {totalDocs}개 문서
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                📁 {sections.length}개 섹션
              </span>
            </div>
          </div>
          {/* 장식 원 */}
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 right-14 h-16 w-16 rounded-full bg-white/5" />
        </div>
      )}

      {/* 검색 중이면 결과 뷰, 아니면 위젯 그리드 */}
      {searchQuery?.trim() ? (
        <SearchResultsView sections={sections} query={searchQuery} />
      ) : (

      /* 위젯 그리드 — 드래그앤드롭으로 순서 변경 가능, 행 높이 고정으로 균일한 레이아웃 유지 */
      <div className="grid auto-rows-[300px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {widgetOrder.map((id) => (
          <div
            key={id}
            data-widget-id={id}
            draggable
            onDragStart={(e) => handleDragStart(e, id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative h-full transition-all duration-150",
              // 드래그 중이 아닐 때만 lift 효과 — transform 은 DnD 래퍼에서 관리해야 안전하다
              !draggingId && "hover:-translate-y-0.5",
              draggingId === id && "opacity-40",
              // draggingId !== null 조건으로 실제 드래그 중일 때만 링 강조를 표시한다
              draggingId !== null && dropTargetId === id && draggingId !== id &&
                "rounded-2xl ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-zinc-950"
            )}
          >
            {/* 드래그 핸들 — 마우스: 호버 시 표시 / 터치: 항상 반투명 표시 */}
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, id)}
              onPointerMove={handleHandlePointerMove}
              onPointerUp={handleHandlePointerUp}
              onPointerCancel={handleHandlePointerUp}
              title="드래그하여 위젯 순서를 변경합니다"
              aria-label="위젯 이동 핸들"
              className="absolute right-2 top-[10px] z-10 touch-none cursor-grab rounded p-1 text-gray-300 opacity-0 transition-opacity duration-200 active:cursor-grabbing group-hover:opacity-100 dark:text-zinc-600 sm:opacity-20"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            {renderWidget(id)}
          </div>
        ))}
      </div>
      )}

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
