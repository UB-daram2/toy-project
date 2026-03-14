"use client";

/**
 * 주간 날씨 예보 위젯
 * Open-Meteo에서 7일 일별 예보(최고·최저기온, 날씨 코드, 강수량)를 가져온다.
 * 인증 불필요. 브라우저 위치 정보 사용 → 실패 시 서울 기본값.
 */

import { useEffect, useState } from "react";
import { Cloud, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [forecasts, setForecasts] = useState<DailyForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = (lat: number, lon: number) =>
    fetchWeeklyForecast(lat, lon)
      .then((data) => setForecasts(data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));

  useEffect(() => {
    // 브라우저 위치 정보 요청 → 실패 시 서울 기본값
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => load(37.5665, 126.978)
      );
    } else {
      load(37.5665, 126.978);
    }
  }, []);

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
            onClick={() => { setIsLoading(true); setError(false); load(37.5665, 126.978); }}
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
