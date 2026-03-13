"use client";

/**
 * 홈 대시보드 뷰 컴포넌트
 * 최근 수정 게시물 Top 5, 많이 본 게시물 Top 5, 날씨 & 미세먼지 위젯을 표시한다.
 */

import { useEffect, useState } from "react";
import { Clock, TrendingUp, Cloud, Wind, Droplets, RefreshCw } from "lucide-react";
import type { KnowledgeSection, KnowledgeLink } from "@/data/knowledge-base";
import { cn } from "@/lib/utils";
import { getTopViewed, recordPageView } from "@/lib/view-tracker";
import { extractPageIdFromUrl } from "@/lib/utils";
import { NotionModal } from "./NotionModal";

interface HomeViewProps {
  sections: KnowledgeSection[];
}

/** Unix ms 타임스탬프를 한국어 상대 시간으로 변환한다 */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString("ko-KR");
}

/** WMO 날씨 코드 → 한국어 레이블 + 이모지 */
const WEATHER_LABEL: Record<number, { label: string; emoji: string }> = {
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
function getPm25Level(value: number): { label: string; color: string } {
  if (value <= 15) return { label: "좋음", color: "text-emerald-500" };
  if (value <= 35) return { label: "보통", color: "text-blue-500" };
  if (value <= 75) return { label: "나쁨", color: "text-orange-500" };
  return { label: "매우 나쁨", color: "text-red-500" };
}

/** PM10 농도(μg/m³) → 등급 레이블과 색상 */
function getPm10Level(value: number): { label: string; color: string } {
  if (value <= 30) return { label: "좋음", color: "text-emerald-500" };
  if (value <= 80) return { label: "보통", color: "text-blue-500" };
  if (value <= 150) return { label: "나쁨", color: "text-orange-500" };
  return { label: "매우 나쁨", color: "text-red-500" };
}

/** 날씨 & 미세먼지 데이터 타입 */
interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  pm25: number;
  pm10: number;
  locationName: string;
}

/** Open-Meteo에서 날씨 + 대기질 데이터를 가져온다 (인증 불필요) */
async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
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

/** ── 위젯 공통 카드 래퍼 ── */
function WidgetCard({
  icon,
  title,
  iconColor,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconColor)}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

/** ── 최근 수정 Top 5 위젯 ── */
function RecentlyModifiedWidget({
  sections,
  onOpenModal,
}: {
  sections: KnowledgeSection[];
  onOpenModal: (url: string, title: string) => void;
}) {
  // 모든 링크를 수집하여 lastEditedTime 기준으로 정렬
  const topLinks: KnowledgeLink[] = sections
    .flatMap((s) => s.categories.flatMap((c) => c.links))
    .filter((l) => l.lastEditedTime != null)
    .sort((a, b) => (b.lastEditedTime ?? 0) - (a.lastEditedTime ?? 0))
    .slice(0, 5);

  return (
    <WidgetCard
      icon={<Clock className="h-4 w-4 text-white" />}
      title="최근 수정 Top 5"
      iconColor="bg-blue-500"
    >
      {topLinks.length === 0 ? (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          수정 데이터가 없습니다
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {topLinks.map((link, i) => (
            <li key={link.id} className="group flex items-center gap-3">
              <span className="w-4 flex-shrink-0 text-right text-xs font-bold text-gray-300 dark:text-zinc-600">
                {i + 1}
              </span>
              <button
                onClick={() => onOpenModal(link.url, link.title)}
                className="flex-1 truncate text-left text-sm text-gray-700 transition-colors hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
              >
                {link.title}
              </button>
              <span className="flex-shrink-0 text-xs text-gray-400 dark:text-zinc-500">
                {formatRelativeTime(link.lastEditedTime!)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

/** ── 많이 본 게시물 Top 5 위젯 ── */
function MostViewedWidget({
  onOpenModal,
}: {
  onOpenModal: (url: string, title: string) => void;
}) {
  const [topViewed, setTopViewed] = useState<
    Array<{ pageId: string; title: string; url: string; count: number }>
  >([]);

  // 클라이언트에서만 localStorage를 읽는다
  useEffect(() => {
    setTopViewed(getTopViewed(5));
  }, []);

  return (
    <WidgetCard
      icon={<TrendingUp className="h-4 w-4 text-white" />}
      title="많이 본 게시물 Top 5"
      iconColor="bg-violet-500"
    >
      {topViewed.length === 0 ? (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          아직 열람 기록이 없습니다
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {topViewed.map((item, i) => (
            <li key={item.pageId} className="group flex items-center gap-3">
              <span className="w-4 flex-shrink-0 text-right text-xs font-bold text-gray-300 dark:text-zinc-600">
                {i + 1}
              </span>
              <button
                onClick={() => onOpenModal(item.url, item.title)}
                className="flex-1 truncate text-left text-sm text-gray-700 transition-colors hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400"
              >
                {item.title}
              </button>
              <span className="flex-shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                {item.count}회
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

/** ── 날씨 & 미세먼지 위젯 ── */
function WeatherWidget() {
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
      iconColor="bg-emerald-500"
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

/** ── 홈 메인 뷰 ── */
export function HomeView({ sections }: HomeViewProps) {
  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // 모달 열기 + 열람 수 기록
  const openModal = (url: string, title: string) => {
    const pageId = extractPageIdFromUrl(url);
    if (pageId) recordPageView(pageId, title, url);
    setActiveModal({ url, title });
  };

  // 총 문서 수
  const totalDocs = sections
    .flatMap((s) => s.categories)
    .reduce((sum, c) => sum + c.links.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">홈</h2>
        <p className="mt-0.5 text-sm text-gray-400 dark:text-zinc-500">
          총 {totalDocs}개 문서 · {sections.length}개 섹션
        </p>
      </div>

      {/* 위젯 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RecentlyModifiedWidget sections={sections} onOpenModal={openModal} />
        <MostViewedWidget onOpenModal={openModal} />
        <WeatherWidget />
      </div>

      {activeModal && (
        <NotionModal
          pageUrl={activeModal.url}
          pageTitle={activeModal.title}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
