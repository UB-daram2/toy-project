/**
 * 주가 지수 조회 API Route
 * GET /api/market → Yahoo Finance 비공식 API를 서버사이드에서 호출하여 CORS 문제를 우회한다.
 * KOSPI(^KS11), KOSDAQ(^KQ11) 지수를 반환한다.
 */

import { NextResponse } from "next/server";

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
    if (!res.ok) return null;
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
  return NextResponse.json({ indices });
}
