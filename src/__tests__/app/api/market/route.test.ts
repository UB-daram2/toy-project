/**
 * @jest-environment node
 *
 * Market API Route 테스트
 * GET /api/market → Yahoo Finance 프록시
 * - fetchIndex: 정상 응답, non-OK, 예외, meta 없음, prevClose=0
 * - GET handler: 두 지수 병렬 fetch, 일부 실패, 전체 실패
 */

import { GET } from "@/app/api/market/route";

// fetch 전역 모킹
const mockFetch = jest.fn();
global.fetch = mockFetch;

/** Yahoo Finance 정상 응답 mock 빌더 */
function makeYahooResponse(
  price: number,
  prevClose: number,
  shortName = "INDEX"
) {
  return {
    ok: true,
    json: async () => ({
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: price,
              chartPreviousClose: prevClose,
              shortName,
            },
          },
        ],
      },
    }),
  };
}

beforeEach(() => {
  mockFetch.mockClear();
});

describe("Market Route — GET 정상 응답", () => {
  it("KOSPI·KOSDAQ 두 지수를 반환한다", async () => {
    mockFetch
      .mockResolvedValueOnce(makeYahooResponse(2600, 2500, "KOSPI"))
      .mockResolvedValueOnce(makeYahooResponse(850, 800, "KOSDAQ"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.indices).toHaveLength(2);
    expect(body.indices[0].symbol).toBe("^KS11");
    expect(body.indices[1].symbol).toBe("^KQ11");
  });

  it("price·change·changePercent를 올바르게 계산한다", async () => {
    // KOSPI: 2600 (prev 2500) → change=100, changePercent=4%
    mockFetch
      .mockResolvedValueOnce(makeYahooResponse(2600, 2500, "KOSPI"))
      .mockResolvedValueOnce(makeYahooResponse(850, 800, "KOSDAQ"));

    const res = await GET();
    const body = await res.json();
    const kospi = body.indices[0];

    expect(kospi.price).toBe(2600);
    expect(kospi.change).toBeCloseTo(100);
    expect(kospi.changePercent).toBeCloseTo(4);
  });

  it("shortName을 name 필드로 반환한다", async () => {
    mockFetch
      .mockResolvedValueOnce(makeYahooResponse(2600, 2500, "KOSPI Index"))
      .mockResolvedValueOnce(makeYahooResponse(850, 800, "KOSDAQ Composite"));

    const res = await GET();
    const body = await res.json();
    expect(body.indices[0].name).toBe("KOSPI Index");
    expect(body.indices[1].name).toBe("KOSDAQ Composite");
  });

  it("shortName이 없으면 symbol을 name으로 사용한다", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chart: {
            result: [
              {
                meta: {
                  regularMarketPrice: 2600,
                  chartPreviousClose: 2500,
                  // shortName 없음
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({ ok: false });

    const res = await GET();
    const body = await res.json();
    expect(body.indices[0].name).toBe("^KS11");
  });
});

describe("Market Route — 에러 처리", () => {
  it("KOSPI fetch 실패 시 KOSDAQ만 반환한다", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce(makeYahooResponse(850, 800, "KOSDAQ"));

    const res = await GET();
    const body = await res.json();

    expect(body.indices).toHaveLength(1);
    expect(body.indices[0].symbol).toBe("^KQ11");
  });

  it("모든 fetch 실패 시 빈 배열을 반환한다", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.indices).toHaveLength(0);
  });

  it("fetch 예외 발생 시 해당 지수를 건너뛴다", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("네트워크 오류"))
      .mockResolvedValueOnce(makeYahooResponse(850, 800, "KOSDAQ"));

    const res = await GET();
    const body = await res.json();

    expect(body.indices).toHaveLength(1);
    expect(body.indices[0].symbol).toBe("^KQ11");
  });

  it("chart.result가 null이면 해당 지수를 건너뛴다", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ chart: { result: null } }),
      })
      .mockResolvedValueOnce(makeYahooResponse(850, 800, "KOSDAQ"));

    const res = await GET();
    const body = await res.json();

    expect(body.indices).toHaveLength(1);
  });

  it("meta가 없으면 해당 지수를 건너뛴다", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ chart: { result: [{}] } }),
      })
      .mockResolvedValueOnce({ ok: false });

    const res = await GET();
    const body = await res.json();

    expect(body.indices).toHaveLength(0);
  });
});

describe("Market Route — changePercent 엣지 케이스", () => {
  it("prevClose가 0이면 changePercent는 0이다", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chart: {
            result: [
              {
                meta: {
                  regularMarketPrice: 100,
                  chartPreviousClose: 0,
                  shortName: "TEST",
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({ ok: false });

    const res = await GET();
    const body = await res.json();
    expect(body.indices[0].changePercent).toBe(0);
  });

  it("previousClose fallback을 사용한다", async () => {
    // chartPreviousClose 없고 previousClose만 있는 경우
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chart: {
            result: [
              {
                meta: {
                  regularMarketPrice: 2600,
                  previousClose: 2500, // chartPreviousClose 없음
                  shortName: "KOSPI",
                },
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({ ok: false });

    const res = await GET();
    const body = await res.json();
    expect(body.indices[0].change).toBeCloseTo(100);
  });
});
