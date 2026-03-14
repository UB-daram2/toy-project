"use client";

/**
 * 날씨 & 미세먼지 위젯
 * Open-Meteo API에서 현재 날씨(WMO 코드)와 대기질(PM2.5, PM10)을 가져온다.
 * 인증 불필요. 브라우저 위치 정보 사용 → 실패 시 서울 기본값.
 */

import { useEffect, useState } from "react";
import { Cloud, Wind, Droplets, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";

/** WMO 날씨 코드 → 한국어 레이블 + 이모지 */
export const WEATHER_LABEL: Record<number, { label: string; emoji: string }> = {
  0: { label: "맑음", emoji: "☀️" },
  1: { label: "대체로 맑음", emoji: "🌤️" },
  2: { label: "구름 많음", emoji: "⛅" },
  3: { label: "흐림", emoji: "☁️" },
  45: { label: "안개", emoji: "🌫️" },
  48: { label: "안개", emoji: "🌫️" },
  51: { label: "이슬비", emoji: "🌦️" },
  53: { label: "이슬비", emoji: "🌦️" },
  55: { label: "이슬비", emoji: "🌦️" },
  61: { label: "비", emoji: "🌧️" },
  63: { label: "비", emoji: "🌧️" },
  65: { label: "강한 비", emoji: "🌧️" },
  71: { label: "눈", emoji: "🌨️" },
  73: { label: "눈", emoji: "🌨️" },
  75: { label: "강한 눈", emoji: "❄️" },
  80: { label: "소나기", emoji: "🌦️" },
  81: { label: "소나기", emoji: "🌦️" },
  82: { label: "강한 소나기", emoji: "⛈️" },
  95: { label: "뇌우", emoji: "⛈️" },
};

/** PM2.5 농도(μg/m³) → 등급 레이블과 색상 */
export function getPm25Level(value: number): { label: string; color: string } {
  if (value <= 15) return { label: "좋음", color: "text-emerald-500" };
  if (value <= 35) return { label: "보통", color: "text-blue-500" };
  if (value <= 75) return { label: "나쁨", color: "text-orange-500" };
  return { label: "매우 나쁨", color: "text-red-500" };
}

/** PM10 농도(μg/m³) → 등급 레이블과 색상 */
export function getPm10Level(value: number): { label: string; color: string } {
  if (value <= 30) return { label: "좋음", color: "text-emerald-500" };
  if (value <= 80) return { label: "보통", color: "text-blue-500" };
  if (value <= 150) return { label: "나쁨", color: "text-orange-500" };
  return { label: "매우 나쁨", color: "text-red-500" };
}

/** 날씨 & 미세먼지 데이터 타입 */
export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  pm25: number;
  pm10: number;
  locationName: string;
}

/** Open-Meteo에서 날씨 + 대기질 데이터를 가져온다 (인증 불필요) */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const [weatherRes, airRes] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FSeoul`
    ),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=Asia%2FSeoul`
    ),
  ]);
  const [weatherData, airData] = await Promise.all([
    weatherRes.json(),
    airRes.json(),
  ]);
  return {
    temperature: Math.round(weatherData.current.temperature_2m),
    weatherCode: weatherData.current.weather_code,
    windSpeed: Math.round(weatherData.current.wind_speed_10m * 10) / 10,
    pm25: Math.round(airData.current.pm2_5),
    pm10: Math.round(airData.current.pm10),
    locationName: "현재 위치",
  };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = (lat: number, lon: number, name: string) =>
    fetchWeather(lat, lon)
      .then((d) => setWeather({ ...d, locationName: name }))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));

  useEffect(() => {
    // 브라우저 위치 정보 요청 → 실패 시 서울 기본값
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude, "현재 위치"),
        () => load(37.5665, 126.978, "서울")
      );
    } else {
      load(37.5665, 126.978, "서울");
    }
  }, []);

  const refresh = () => {
    setIsLoading(true);
    setError(false);
    load(37.5665, 126.978, "서울");
  };

  return (
    <WidgetCard
      icon={<Cloud className="h-4 w-4 text-white" />}
      title="날씨 & 미세먼지"
      accentGradient="from-emerald-500 to-teal-600"
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
            onClick={refresh}
            className="mt-2 text-xs text-emerald-500 hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}
      {weather && !isLoading && (
        <div className="flex flex-col gap-4">
          {/* 온도 + 날씨 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
                {weather.temperature}°C
              </p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">
                {WEATHER_LABEL[weather.weatherCode]?.emoji}{" "}
                {WEATHER_LABEL[weather.weatherCode]?.label ?? "알 수 없음"}
              </p>
            </div>
            <span className="text-4xl">
              {WEATHER_LABEL[weather.weatherCode]?.emoji ?? "🌡️"}
            </span>
          </div>

          {/* 바람 + 미세먼지 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-gray-50 px-2 py-2 text-center dark:bg-zinc-800">
              <div className="flex items-center justify-center gap-1 text-gray-400">
                <Wind className="h-3 w-3" />
                <span className="text-xs">바람</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-zinc-200">
                {weather.windSpeed}m/s
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 px-2 py-2 text-center dark:bg-zinc-800">
              <div className="flex items-center justify-center gap-1 text-gray-400">
                <Droplets className="h-3 w-3" />
                <span className="text-xs">PM2.5</span>
              </div>
              <p className={cn("mt-1 text-sm font-semibold", getPm25Level(weather.pm25).color)}>
                {getPm25Level(weather.pm25).label}
              </p>
              <p className="text-xs text-gray-400">{weather.pm25}μg</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-2 py-2 text-center dark:bg-zinc-800">
              <div className="flex items-center justify-center gap-1 text-gray-400">
                <Droplets className="h-3 w-3" />
                <span className="text-xs">PM10</span>
              </div>
              <p className={cn("mt-1 text-sm font-semibold", getPm10Level(weather.pm10).color)}>
                {getPm10Level(weather.pm10).label}
              </p>
              <p className="text-xs text-gray-400">{weather.pm10}μg</p>
            </div>
          </div>

          <p className="text-right text-xs text-gray-400 dark:text-zinc-600">
            {weather.locationName} 기준
          </p>
        </div>
      )}
    </WidgetCard>
  );
}
