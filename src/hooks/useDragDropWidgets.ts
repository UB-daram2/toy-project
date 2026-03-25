"use client";

/**
 * 위젯 그리드 드래그앤드롭 훅
 * HomeView에서 DnD 상태와 이벤트 핸들러를 분리하여 관심사를 단순화한다.
 *
 * 마우스: HTML5 DnD API (onDragStart / onDragOver / onDragEnd)
 * 터치: Pointer Events API + setPointerCapture (HTML5 DnD는 터치에서 불안정)
 */

import { useRef, useState } from "react";
import { useWidgetStore, type WidgetId } from "@/stores/widgetStore";

export interface DragDropHandlers {
  /** 현재 드래그 중인 위젯 ID (스타일 적용에 사용) */
  draggingId: WidgetId | null;
  /** 현재 드롭 대상 위젯 ID (스타일 적용에 사용) */
  dropTargetId: WidgetId | null;
  /** HTML5 DnD — 드래그 시작 */
  handleDragStart: (e: React.DragEvent, id: WidgetId) => void;
  /** HTML5 DnD — 드래그 오버 (드롭 가능 영역 표시) */
  handleDragOver: (e: React.DragEvent, id: WidgetId) => void;
  /** HTML5 DnD — 드래그 종료 (순서 확정) */
  handleDragEnd: () => void;
  /** 포인터 이벤트 — 터치 드래그 시작 (핸들에서만 발동) */
  handleHandlePointerDown: (e: React.PointerEvent, id: WidgetId) => void;
  /** 포인터 이벤트 — 터치 이동 중 드롭 대상 탐지 */
  handleHandlePointerMove: (e: React.PointerEvent) => void;
  /** 포인터 이벤트 — 터치 드래그 종료 (순서 확정) */
  handleHandlePointerUp: () => void;
}

export function useDragDropWidgets(): DragDropHandlers {
  const { reorder: reorderWidgets } = useWidgetStore();

  // 이벤트 핸들러 간 공유가 필요한 임시 값은 ref 로 추적한다
  // (setState 는 핸들러 실행 중 즉시 반영되지 않으므로 ref 필요)
  const draggingIdRef = useRef<WidgetId | null>(null);
  const dropTargetIdRef = useRef<WidgetId | null>(null);

  // 스타일링에 사용할 React 상태 (렌더 사이클 연동)
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<WidgetId | null>(null);

  /** 드래그 종료 후 ref·상태를 모두 초기화한다 */
  function reset() {
    draggingIdRef.current = null;
    dropTargetIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  }

  // ── HTML5 DnD 핸들러 (마우스 / 트랙패드) ──

  function handleDragStart(e: React.DragEvent, id: WidgetId) {
    e.dataTransfer.effectAllowed = "move";
    draggingIdRef.current = id;
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent, id: WidgetId) {
    e.preventDefault();
    dropTargetIdRef.current = id;
    if (id !== dropTargetId) setDropTargetId(id);
  }

  function handleDragEnd() {
    if (draggingIdRef.current && dropTargetIdRef.current) {
      reorderWidgets(draggingIdRef.current, dropTargetIdRef.current);
    }
    reset();
  }

  // ── 포인터 이벤트 핸들러 (터치 전용 — 드래그 핸들에서만 시작) ──

  function handleHandlePointerDown(e: React.PointerEvent, id: WidgetId) {
    // 마우스는 HTML5 DnD 로 처리하므로 터치만 여기서 처리한다
    /* istanbul ignore next -- 터치 전용 분기: jsdom에서 pointerType="touch" 시뮬레이션 불가 */
    if (e.pointerType === "mouse") return;
    e.preventDefault(); // 스크롤 방지
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    draggingIdRef.current = id;
    setDraggingId(id);
  }

  function handleHandlePointerMove(e: React.PointerEvent) {
    /* istanbul ignore next -- 터치 전용 분기: jsdom에서 pointerType="touch" 시뮬레이션 불가 */
    if (!draggingIdRef.current || e.pointerType === "mouse") return;
    // 포인터 아래의 카드를 찾아 드롭 대상으로 지정한다
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el?.closest("[data-widget-id]");
    const targetId = card?.getAttribute("data-widget-id") as WidgetId | null;
    if (targetId && targetId !== dropTargetIdRef.current) {
      dropTargetIdRef.current = targetId;
      setDropTargetId(targetId);
    }
  }

  function handleHandlePointerUp() {
    if (draggingIdRef.current && dropTargetIdRef.current) {
      reorderWidgets(draggingIdRef.current, dropTargetIdRef.current);
    }
    reset();
  }

  return {
    draggingId,
    dropTargetId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleHandlePointerDown,
    handleHandlePointerMove,
    handleHandlePointerUp,
  };
}
