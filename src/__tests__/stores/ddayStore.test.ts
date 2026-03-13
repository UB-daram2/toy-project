/**
 * useDDayStore (Zustand persist 스토어) 테스트
 */

import { useDDayStore } from "@/stores/ddayStore";

beforeEach(() => {
  useDDayStore.setState({ ddays: [] });
});

describe("ddayStore — 초기 상태", () => {
  it("빈 목록으로 초기화된다", () => {
    expect(useDDayStore.getState().ddays).toEqual([]);
  });
});

describe("ddayStore — addDDay", () => {
  it("D-Day를 추가한다", () => {
    useDDayStore.getState().addDDay("시험일", "2099-01-01");
    const { ddays } = useDDayStore.getState();
    expect(ddays).toHaveLength(1);
    expect(ddays[0].title).toBe("시험일");
    expect(ddays[0].targetDate).toBe("2099-01-01");
  });

  it("제목이 비어있으면 추가하지 않는다", () => {
    useDDayStore.getState().addDDay("   ", "2099-01-01");
    expect(useDDayStore.getState().ddays).toHaveLength(0);
  });

  it("날짜가 비어있으면 추가하지 않는다", () => {
    useDDayStore.getState().addDDay("이벤트", "");
    expect(useDDayStore.getState().ddays).toHaveLength(0);
  });

  it("추가 후 날짜 오름차순으로 정렬된다", () => {
    useDDayStore.getState().addDDay("나중", "2099-12-31");
    useDDayStore.getState().addDDay("먼저", "2099-01-01");
    const { ddays } = useDDayStore.getState();
    expect(ddays[0].title).toBe("먼저");
    expect(ddays[1].title).toBe("나중");
  });
});

describe("ddayStore — removeDDay", () => {
  it("지정한 ID의 D-Day를 삭제한다", () => {
    useDDayStore.setState({
      ddays: [
        { id: "1", title: "이벤트A", targetDate: "2099-01-01" },
        { id: "2", title: "이벤트B", targetDate: "2099-06-01" },
      ],
    });
    useDDayStore.getState().removeDDay("1");
    const { ddays } = useDDayStore.getState();
    expect(ddays).toHaveLength(1);
    expect(ddays[0].id).toBe("2");
  });
});
