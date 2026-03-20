"use client";

/**
 * 환율 위젯
 * Frankfurter API에서 1 USD 기준 KRW·EUR·JPY·CNY 환율을 가져온다.
 * 인증 불필요, CORS 지원, 유럽중앙은행 기준 환율.
 * useFetchWidget으로 data/isLoading/error/retry 상태를 추상화한다.
 */

import { DollarSign, RefreshCw } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import { useFetchWidget } from "@/hooks/useFetchWidget";

/** 환율 데이터 타입 */
interface ExchangeRate {
  currency: string;
  label: string;
  rate: number;
  flag: string;
}

/** API 응답을 위젯 표시용 데이터로 변환한다 */
interface ExchangeData {
  rates: ExchangeRate[];
  updatedAt: string;
}

async function fetchExchangeRates(): Promise<ExchangeData> {
  const res = await fetch(
    "https://api.frankfurter.app/latest?from=USD&to=KRW,EUR,JPY,CNY"
  );
  const data = await res.json();
  const r = data.rates as Record<string, number>;
  return {
    rates: [
      { currency: "KRW", label: "원화", rate: r.KRW, flag: "🇰🇷" },
      { currency: "EUR", label: "유로", rate: r.EUR, flag: "🇪🇺" },
      { currency: "JPY", label: "엔화", rate: r.JPY, flag: "🇯🇵" },
      { currency: "CNY", label: "위안화", rate: r.CNY, flag: "🇨🇳" },
    ],
    updatedAt: data.date as string,
  };
}

export function ExchangeRateWidget() {
  const { data, isLoading, error, retry } = useFetchWidget(fetchExchangeRates);

  return (
    <WidgetCard
      icon={<DollarSign className="h-4 w-4 text-white" />}
      title="환율 (1 USD 기준)"
      accentGradient="from-amber-500 to-orange-500"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <div className="text-center">
          <p className="text-xs text-gray-400">환율 정보를 불러올 수 없습니다</p>
          <button onClick={retry} className="mt-2 text-xs text-amber-500 hover:underline">
            다시 시도
          </button>
        </div>
      )}
      {!isLoading && !error && data && (
        <div className="flex flex-col gap-2">
          {data.rates.map(({ currency, label, rate, flag }) => (
            <div key={currency} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-zinc-400">
                <span>{flag}</span>
                <span>{label}</span>
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                {currency === "KRW"
                  ? rate.toLocaleString("ko-KR") + " ₩"
                  : rate.toFixed(4)}
              </span>
            </div>
          ))}
          {data.updatedAt && (
            <p className="mt-1 text-right text-xs text-gray-400 dark:text-zinc-600">
              기준일: {data.updatedAt}
            </p>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
