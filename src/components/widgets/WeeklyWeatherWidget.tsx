"use client";

/**
 * 주간 날씨 예보 위젯
 * Open-Meteo에서 7일 일별 예보(최고·최저기온, 날씨 코드, 강수량)를 가져온다.
 * 인증 불필요. 브라우저 위치 정보 사용 → 실패 시 서울 기본값.
 */

import { useCallback, useEffect, useRef } from "react";
import { Cloud, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFetchWidget } from "@/hooks/useFetchWidget";
import { WidgetCard } from "./WidgetCard";
import { WEATHER_LABEL } from "./WeatherWidget";

/** 주간 예보 1일치 데이터 타입 */
interface DailyForecast {
  date: string; // YYYY-MM-DD
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipSum: number;
}

/** Open-Meteo에서 7일 일별 예보를 가져온다 */
async function fetchWeeklyForecast(lat: number, lon: number): Promise<DailyForecast[]> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=Asia%2FSeoul&forecast_days=7`
  );
  const data = await res.json() as {
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
    };
  };
  return data.daily.time.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    tempMax: Math.round(data.daily.temperature_2m_max[i]),
    tempMin: Math.round(data.daily.temperature_2m_min[i]),
    precipSum: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
  }));
}

/** 한국어 요일 레이블 (일~토) */
const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function WeeklyWeatherWidget() {
  // 지오로케이션 결과를 ref에 저장 — 서울 기본값으로 초기화
  const coordsRef = useRef({ lat: 37.5665, lon: 126.978 });

  // fetcher는 항상 coordsRef를 읽으므로 재생성 없이 최신 좌표를 사용한다
  const fetcher = useCallback(
    () => fetchWeeklyForecast(coordsRef.current.lat, coordsRef.current.lon),
    []
  );

  const { data, isLoading, error, retry } = useFetchWidget<DailyForecast[]>(fetcher);
  const forecasts = data ?? [];

  useEffect(() => {
    // 브라우저 위치 정보 요청 → 성공 시 실제 좌표로 재조회
    // 실패 시: 마운트에서 서울 기본값으로 이미 조회됨 → 추가 액션 불필요
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        coordsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        retry();
      });
    }
  }, [retry]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <WidgetCard
      icon={<Cloud className="h-4 w-4 text-white" />}
      title="주간 날씨 예보"
      accentGradient="from-cyan-500 to-sky-500"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <div className="text-center">
          <p className="text-xs text-gray-400">날씨 정보를 불러올 수 없습니다</p>
          <button
            onClick={() => { coordsRef.current = { lat: 37.5665, lon: 126.978 }; retry(); }}
            className="mt-2 text-xs text-cyan-500 hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}
      {!isLoading && !error && forecasts.length > 0 && (
        <div className="grid grid-cols-7 gap-1">
          {forecasts.map((day) => {
            const d = new Date(`${day.date}T00:00:00`);
            const weekday = WEEKDAY_KO[d.getDay()];
            const isToday = day.date === todayStr;
            const { emoji } = WEATHER_LABEL[day.weatherCode] ?? { emoji: "🌡️" };
            return (
              <div
                key={day.date}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-2",
                  isToday
                    ? "bg-cyan-50 dark:bg-cyan-500/10"
                    : "bg-gray-50 dark:bg-zinc-800"
                )}
              >
                <span className={cn(
                  "text-xs font-medium",
                  isToday ? "text-cyan-600 dark:text-cyan-400" : "text-gray-500 dark:text-zinc-400"
                )}>
                  {weekday}
                </span>
                <span className="text-base leading-none">{emoji}</span>
                <span className="text-xs font-semibold text-red-500">{day.tempMax}°</span>
                <span className="text-xs text-blue-500">{day.tempMin}°</span>
                {day.precipSum > 0 && (
                  <span className="text-xs text-blue-400 dark:text-blue-500">
                    {day.precipSum}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
