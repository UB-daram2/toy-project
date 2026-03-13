/**
 * useMemoStore (Zustand persist 스토어) 테스트
 */

import { useMemoStore, MAX_MEMO_COUNT } from "@/stores/memoStore";

beforeEach(() => {
  useMemoStore.setState({ memos: [] });
});

describe("memoStore — 초기 상태", () => {
  it("빈 목록으로 초기화된다", () => {
    expect(useMemoStore.getState().memos).toEqual([]);
  });
});

describe("memoStore — addMemo", () => {
  it("메모를 추가한다", () => {
    useMemoStore.getState().addMemo("테스트 메모");
    const { memos } = useMemoStore.getState();
    expect(memos).toHaveLength(1);
    expect(memos[0].text).toBe("테스트 메모");
  });

  it("빈 문자열은 추가하지 않는다", () => {
    useMemoStore.getState().addMemo("   ");
    expect(useMemoStore.getState().memos).toHaveLength(0);
  });

  it("최신 메모가 목록 앞에 삽입된다", () => {
    useMemoStore.getState().addMemo("첫번째");
    useMemoStore.getState().addMemo("두번째");
    const { memos } = useMemoStore.getState();
    expect(memos[0].text).toBe("두번째");
    expect(memos[1].text).toBe("첫번째");
  });

  it(`${MAX_MEMO_COUNT}개를 초과하면 최대 ${MAX_MEMO_COUNT}개만 유지한다`, () => {
    for (let i = 0; i < MAX_MEMO_COUNT + 5; i++) {
      useMemoStore.getState().addMemo(`메모${i}`);
    }
    expect(useMemoStore.getState().memos).toHaveLength(MAX_MEMO_COUNT);
  });
});

describe("memoStore — removeMemo", () => {
  it("지정한 ID의 메모를 삭제한다", () => {
    useMemoStore.setState({
      memos: [
        { id: "1", text: "첫번째", createdAt: 1 },
        { id: "2", text: "두번째", createdAt: 2 },
      ],
    });
    useMemoStore.getState().removeMemo("1");
    const { memos } = useMemoStore.getState();
    expect(memos).toHaveLength(1);
    expect(memos[0].id).toBe("2");
  });
});
