"use client";

/**
 * 환율 위젯
 * Frankfurter API에서 1 USD 기준 KRW·EUR·JPY·CNY 환율을 가져온다.
 * 인증 불필요, CORS 지원, 유럽중앙은행 기준 환율.
 */

import { useEffect, useState } from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import { WidgetCard } from "./WidgetCard";

/** 환율 데이터 타입 */
interface ExchangeRate {
  currency: string;
  label: string;
  rate: number;
  flag: string;
}

export function ExchangeRateWidget() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setIsLoading(true);
    setError(false);
    // frankfurter.app: 인증 불필요, CORS 지원, 유럽중앙은행 기준 환율
    fetch("https://api.frankfurter.app/latest?from=USD&to=KRW,EUR,JPY,CNY")
      .then((r) => r.json())
      .then((data) => {
        const r = data.rates as Record<string, number>;
        setRates([
          { currency: "KRW", label: "원화", rate: r.KRW, flag: "🇰🇷" },
          { currency: "EUR", label: "유로", rate: r.EUR, flag: "🇪🇺" },
          { currency: "JPY", label: "엔화", rate: r.JPY, flag: "🇯🇵" },
          { currency: "CNY", label: "위안화", rate: r.CNY, flag: "🇨🇳" },
        ]);
        setUpdatedAt(data.date as string);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

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
          <button onClick={load} className="mt-2 text-xs text-amber-500 hover:underline">
            다시 시도
          </button>
        </div>
      )}
      {!isLoading && !error && (
        <div className="flex flex-col gap-2">
          {rates.map(({ currency, label, rate, flag }) => (
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
          {updatedAt && (
            <p className="mt-1 text-right text-xs text-gray-400 dark:text-zinc-600">
              기준일: {updatedAt}
            </p>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
