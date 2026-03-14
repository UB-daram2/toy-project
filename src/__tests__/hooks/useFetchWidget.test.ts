/**
 * useFetchWidget 훅 테스트
 * 마운트 시 자동 fetch, 성공/실패 상태 전환, retry() 재실행을 검증한다.
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useFetchWidget } from "@/hooks/useFetchWidget";

describe("useFetchWidget", () => {
  it("마운트 시 isLoading이 true이다", () => {
    // 절대 resolve되지 않는 Promise로 로딩 중 상태를 유지
    const fetcher = jest.fn(() => new Promise<string>(() => {}));
    const { result } = renderHook(() => useFetchWidget(fetcher));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it("fetch 성공 시 data를 반환하고 isLoading이 false가 된다", async () => {
    const fetcher = jest.fn().mockResolvedValue({ value: 42 });
    const { result } = renderHook(() => useFetchWidget(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBe(false);
  });

  it("fetch 실패 시 error가 true이고 data는 null이다", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useFetchWidget(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("마운트 시 fetcher를 1회 호출한다", async () => {
    const fetcher = jest.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useFetchWidget(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retry() 호출 시 fetcher를 재실행한다", async () => {
    const fetcher = jest.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useFetchWidget(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("retry() 호출 시 isLoading이 다시 true로 설정된다", async () => {
    // 첫 번째 fetch: 즉시 resolve, 두 번째: 즉시 resolve
    const fetcher = jest.fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValue("second");

    const { result } = renderHook(() => useFetchWidget(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe("first");

    // retry 직후에는 isLoading이 true로 전환된다
    act(() => {
      result.current.retry();
    });
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe("second");
  });

  it("에러 후 retry() 성공 시 error가 false로 초기화된다", async () => {
    const fetcher = jest.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("recovered");

    const { result } = renderHook(() => useFetchWidget(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(true);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.data).toBe("recovered");
  });
});
