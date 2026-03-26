/**
 * useKnowledgeStructure 훅 테스트
 * - 초기 상태: loading
 * - 성공: success + sections 반환
 * - 실패 후 재시도: retrying 상태 → 성공
 * - 모든 재시도 실패: error 상태
 * - 수동 retry: 상태 초기화 후 재시도
 */

import { renderHook, act } from "@testing-library/react";
import { useKnowledgeStructure } from "@/hooks/useKnowledgeStructure";

const mockSections = [
  {
    id: "how-to-process",
    title: "처리방법이 궁금해요",
    description: "안내",
    icon: "BookOpen",
    colorKey: "blue" as const,
    categories: [
      {
        id: "upharm-system",
        title: "유팜시스템",
        links: [{ id: "link-1", title: "처방조제", url: "https://u-pham.notion.site/xxx" }],
      },
    ],
  },
];

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useKnowledgeStructure", () => {
  it("초기 상태는 loading이다", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useKnowledgeStructure());
    expect(result.current.status).toBe("loading");
    expect(result.current.sections).toEqual([]);
  });

  it("fetch 성공 시 success 상태와 섹션 목록을 반환한다", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSections),
    });

    const { result } = renderHook(() => useKnowledgeStructure());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.status).toBe("success");
    expect(result.current.sections).toEqual(mockSections);
  });

  it("fetch 실패 후 재시도 중 성공하면 success 상태를 반환한다", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("네트워크 오류"))
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSections),
      });

    const { result } = renderHook(() => useKnowledgeStructure());
    await act(async () => { await Promise.resolve(); });

    expect(result.current.status).toBe("retrying");
    expect(result.current.retryAttempt).toBe(1);

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("success");
    expect(result.current.sections).toEqual(mockSections);
  });

  it("모든 재시도 실패 시 error 상태를 반환한다", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("영구 실패"));
    const { result } = renderHook(() => useKnowledgeStructure());

    await act(async () => { await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(2000); await Promise.resolve(); });

    expect(result.current.status).toBe("error");
  });

  it("503 응답은 실패로 처리한다", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const { result } = renderHook(() => useKnowledgeStructure());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.status).toBe("retrying");
  });

  it("retry 호출 시 loading 상태로 초기화하고 재시도한다", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("실패"));
    const { result } = renderHook(() => useKnowledgeStructure());

    await act(async () => { await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(2000); await Promise.resolve(); });
    expect(result.current.status).toBe("error");

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSections),
    });

    await act(async () => {
      result.current.retry();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("success");
    expect(result.current.sections).toEqual(mockSections);
  });

  it("maxRetries는 MAX_ATTEMPTS - 1 값이다", () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useKnowledgeStructure());
    expect(result.current.maxRetries).toBe(2);
  });
});
