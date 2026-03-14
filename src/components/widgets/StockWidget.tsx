"use client";

/**
 * 국내 증시 위젯
 * /api/market (Yahoo Finance 서버 프록시)를 통해 KOSPI·KOSDAQ 지수를 가져온다.
 * 서버 프록시를 사용하여 클라이언트 IP 노출 및 CORS 문제를 차단한다.
 * useFetchWidget 훅으로 isLoading·error·data 공통 상태를 관리한다.
 */

import { BarChart2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";
import { useFetchWidget } from "@/hooks/useFetchWidget";

/** 증시 지수 데이터 타입 */
interface StockIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/** Next.js API Route를 통해 Yahoo Finance 비공식 API를 호출 (KOSPI·KOSDAQ) */
async function fetchMarket(): Promise<StockIndex[]> {
  const res = await fetch("/api/market");
  const data = await res.json() as { indices: StockIndex[] };
  return data.indices;
}

export function StockWidget() {
  // useFetchWidget으로 isLoading·error·data 3종 상태를 공통 패턴으로 관리
  const { data: indices, isLoading, error, retry } = useFetchWidget<StockIndex[]>(fetchMarket);

  return (
    <WidgetCard
      icon={<BarChart2 className="h-4 w-4 text-white" />}
      title="국내 증시"
      accentGradient="from-indigo-500 to-blue-600"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <div className="text-center">
          <p className="text-xs text-gray-400">증시 정보를 불러올 수 없습니다</p>
          <button onClick={retry} className="mt-2 text-xs text-indigo-500 hover:underline">
            다시 시도
          </button>
        </div>
      )}
      {!isLoading && !error && (!indices || indices.length === 0) && (
        <p className="text-center text-xs text-gray-400">데이터가 없습니다</p>
      )}
      {!isLoading && !error && indices && indices.length > 0 && (
        <div className="flex flex-col gap-3">
          {indices.map((idx) => {
            const isUp = idx.change >= 0;
            const color = isUp ? "text-red-500" : "text-blue-500";
            const sign = isUp ? "+" : "";
            return (
              <div key={idx.symbol} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    {idx.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{idx.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                    {idx.price.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}
                  </p>
                  <p className={cn("text-xs font-medium", color)}>
                    {sign}{idx.change.toFixed(2)} ({sign}{idx.changePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            );
          })}
          <p className="text-right text-xs text-gray-400 dark:text-zinc-600">
            Yahoo Finance 기준
          </p>
        </div>
      )}
    </WidgetCard>
  );
}
