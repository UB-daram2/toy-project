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
import { GripVertical } from "lucide-react";
import type { KnowledgeSection } from "@/data/knowledge-base";
import { cn } from "@/lib/utils";
import { extractPageIdFromUrl } from "@/lib/utils";
import { NotionModal } from "./NotionModal";
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
}

/** 현재 시각 기준 인사말을 반환한다 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "야간 근무 중이시군요 🌙";
  if (hour < 12) return "좋은 아침입니다 ☀️";
  if (hour < 18) return "좋은 오후입니다 🌤️";
  return "좋은 저녁입니다 🌆";
}

/** 홈 메인 뷰 */
export function HomeView({ sections }: HomeViewProps) {
  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

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

  return (
    <div className="flex flex-col gap-6">
      {/* 히어로 헤더 — 그라데이션 배너 */}
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

      {/* 위젯 그리드 — 드래그앤드롭으로 순서 변경 가능, 행 높이 고정으로 균일한 레이아웃 유지 */}
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
