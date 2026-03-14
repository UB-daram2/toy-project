/**
 * 주가 지수 조회 API Route
 * GET /api/market → Yahoo Finance 비공식 API를 서버사이드에서 호출하여 CORS 문제를 우회한다.
 * KOSPI(^KS11), KOSDAQ(^KQ11) 지수를 반환한다.
 */

import { NextResponse } from "next/server";
import { CACHE, errorBody, HTTP_STATUS } from "@/lib/api-response";

interface IndexResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/** Yahoo Finance에서 단일 지수 데이터를 가져온다 */
async function fetchIndex(symbol: string): Promise<IndexResult | null> {
  const encodedSymbol = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      // 1분 캐시로 과도한 외부 요청을 방지한다
      next: { revalidate: 60 },
    });
    if (!res.ok) return null; // 개별 지수 실패는 null 반환 → 상위에서 필터링
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price: number = meta.regularMarketPrice ?? 0;
    const prevClose: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return { symbol, name: meta.shortName ?? symbol, price, change, changePercent };
  } catch {
    return null;
  }
}

export async function GET() {
  const [kospi, kosdaq] = await Promise.all([
    fetchIndex("^KS11"),
    fetchIndex("^KQ11"),
  ]);

  const indices = [kospi, kosdaq].filter((v): v is IndexResult => v !== null);

  // 두 지수 모두 실패한 경우 502로 에러 응답 (클라이언트에서 에러 상태 표시)
  if (indices.length === 0) {
    return NextResponse.json(errorBody("증시 데이터를 가져올 수 없습니다"), {
      status: HTTP_STATUS.BAD_GATEWAY,
    });
  }

  // 1분 캐시: 증시 데이터는 빠르게 변하므로 SHORT 프리셋 사용
  return NextResponse.json({ indices }, {
    headers: { "Cache-Control": CACHE.SHORT },
  });
}
