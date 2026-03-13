/**
 * useWidgetStore (Zustand persist 스토어) 테스트
 */

import { useWidgetStore, DEFAULT_WIDGET_ORDER, mergeWidgetState, type WidgetId } from "@/stores/widgetStore";

/** 각 테스트 전에 스토어를 기본 상태로 초기화한다 */
beforeEach(() => {
  useWidgetStore.setState({ widgetOrder: [...DEFAULT_WIDGET_ORDER] });
});

describe("widgetStore — 초기 상태", () => {
  it("기본 위젯 순서가 올바르게 설정된다", () => {
    const { widgetOrder } = useWidgetStore.getState();
    expect(widgetOrder).toEqual(DEFAULT_WIDGET_ORDER);
  });
});

describe("widgetStore — reorder", () => {
  it("두 위젯의 순서를 교환한다", () => {
    const { reorder } = useWidgetStore.getState();
    // popular(0) → recent(1) 위치로 이동: 결과는 [recent, popular, ...]
    reorder("popular", "recent");
    const { widgetOrder } = useWidgetStore.getState();
    expect(widgetOrder[0]).toBe("recent");
    expect(widgetOrder[1]).toBe("popular");
  });

  it("같은 위젯끼리 reorder하면 순서가 변하지 않는다", () => {
    const { reorder } = useWidgetStore.getState();
    reorder("recent", "recent");
    const { widgetOrder } = useWidgetStore.getState();
    expect(widgetOrder).toEqual(DEFAULT_WIDGET_ORDER);
  });

  it("존재하지 않는 위젯 ID로 reorder해도 상태가 변하지 않는다", () => {
    const { reorder } = useWidgetStore.getState();
    reorder("recent", "unknown-widget" as WidgetId);
    const { widgetOrder } = useWidgetStore.getState();
    expect(widgetOrder).toEqual(DEFAULT_WIDGET_ORDER);
  });
});

describe("widgetStore — reset", () => {
  it("reset 호출 시 기본 순서로 복원된다", () => {
    // 먼저 순서를 변경한다 (popular이 1번으로 밀려남)
    useWidgetStore.getState().reorder("popular", "recent");
    expect(useWidgetStore.getState().widgetOrder[0]).toBe("recent");

    // reset 후 기본 순서로 돌아온다
    useWidgetStore.getState().reset();
    expect(useWidgetStore.getState().widgetOrder).toEqual(DEFAULT_WIDGET_ORDER);
  });
});

describe("widgetStore — mergeWidgetState", () => {
  const mockCurrent = {
    widgetOrder: DEFAULT_WIDGET_ORDER,
    reorder: jest.fn(),
    reset: jest.fn(),
  };

  it("모든 기본 위젯이 포함된 유효한 저장 데이터는 저장된 순서로 복원된다", () => {
    const reversedOrder = [...DEFAULT_WIDGET_ORDER].reverse();
    const result = mergeWidgetState({ widgetOrder: reversedOrder }, mockCurrent);
    expect(result.widgetOrder).toEqual(reversedOrder);
  });

  it("일부 위젯이 누락된 저장 데이터는 현재(기본) 상태로 폴백된다", () => {
    const incompleteOrder: WidgetId[] = ["recent", "popular"]; // 나머지 누락
    const result = mergeWidgetState({ widgetOrder: incompleteOrder }, mockCurrent);
    expect(result.widgetOrder).toEqual(DEFAULT_WIDGET_ORDER);
  });

  it("widgetOrder가 배열이 아닌 경우 현재 상태로 폴백된다", () => {
    const result = mergeWidgetState({ widgetOrder: null }, mockCurrent);
    expect(result.widgetOrder).toEqual(DEFAULT_WIDGET_ORDER);
  });

  it("widgetOrder가 없는 경우 현재 상태로 폴백된다", () => {
    const result = mergeWidgetState({}, mockCurrent);
    expect(result.widgetOrder).toEqual(DEFAULT_WIDGET_ORDER);
  });
});
