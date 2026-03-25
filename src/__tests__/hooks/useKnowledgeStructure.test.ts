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
        links: [{ id: "link-1", title: "처방조제", url: "https://www.notion.so/xxx" }],
      },
    ],
  },
];

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  localStorage.clear();
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

    await act(async () => {
      await Promise.resolve();
    });

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

    // 초기 fetch 실패 처리
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe("retrying");
    expect(result.current.retryAttempt).toBe(1);

    // 재시도 대기 (1초) + 재시도 fetch
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

    // 1차 시도 실패
    await act(async () => {
      await Promise.resolve();
    });

    // 1차 재시도
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // 2차 재시도
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("error");
  });

  it("503 응답은 실패로 처리한다", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    const { result } = renderHook(() => useKnowledgeStructure());

    await act(async () => {
      await Promise.resolve();
    });

    // 503은 실패이므로 재시도 상태
    expect(result.current.status).toBe("retrying");
  });

  it("retry 호출 시 loading 상태로 초기화하고 재시도한다", async () => {
    // 초기 3회 시도는 모두 실패
    global.fetch = jest.fn().mockRejectedValue(new Error("실패"));

    const { result } = renderHook(() => useKnowledgeStructure());

    // 모든 시도 소진
    await act(async () => { await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(2000); await Promise.resolve(); });

    expect(result.current.status).toBe("error");

    // 수동 retry
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

  it("maxRetries는 MAX_ATTEMPTS - 1 값이다", async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useKnowledgeStructure());

    expect(result.current.maxRetries).toBe(2);
  });

  it("fetch 성공 시 localStorage에 섹션 데이터를 캐시한다", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSections),
    });

    renderHook(() => useKnowledgeStructure());

    await act(async () => {
      await Promise.resolve();
    });

    const cached = JSON.parse(localStorage.getItem("upharm_knowledge_structure") ?? "[]");
    expect(cached).toEqual(mockSections);
  });

  it("캐시가 있으면 useEffect 실행 후 캐시 섹션을 반환한다", async () => {
    localStorage.setItem("upharm_knowledge_structure", JSON.stringify(mockSections));
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useKnowledgeStructure());

    // useEffect(load) 실행 후 캐시 데이터가 있어야 한다
    await act(async () => { await Promise.resolve(); });

    expect(result.current.sections).toEqual(mockSections);
  });

  it("fetch 실패 + 캐시 있음 → cached 상태와 캐시 섹션을 반환한다", async () => {
    localStorage.setItem("upharm_knowledge_structure", JSON.stringify(mockSections));
    global.fetch = jest.fn().mockRejectedValue(new Error("실패"));

    const { result } = renderHook(() => useKnowledgeStructure());

    // 1차 시도 실패
    await act(async () => { await Promise.resolve(); });
    // 1차 재시도
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    // 2차 재시도
    await act(async () => { jest.advanceTimersByTime(2000); await Promise.resolve(); });

    expect(result.current.status).toBe("cached");
    expect(result.current.sections).toEqual(mockSections);
  });

  it("fetch 실패 + 캐시 없음 → error 상태를 반환한다", async () => {
    // localStorage.clear()가 beforeEach에서 실행되므로 캐시 없음
    global.fetch = jest.fn().mockRejectedValue(new Error("실패"));

    const { result } = renderHook(() => useKnowledgeStructure());

    await act(async () => { await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(1000); await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(2000); await Promise.resolve(); });

    expect(result.current.status).toBe("error");
  });

  it("localStorage에 잘못된 JSON이 있으면 캐시 없음으로 처리한다", () => {
    localStorage.setItem("upharm_knowledge_structure", "invalid-json{");
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useKnowledgeStructure());

    // 파싱 실패 → 캐시 없음 → 빈 배열 반환
    expect(result.current.sections).toEqual([]);
  });

  it("localStorage에 배열이 아닌 값이 있으면 캐시 없음으로 처리한다", () => {
    localStorage.setItem("upharm_knowledge_structure", JSON.stringify({ not: "array" }));
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useKnowledgeStructure());

    // 배열이 아님 → 캐시 없음 → 빈 배열 반환
    expect(result.current.sections).toEqual([]);
  });
});
