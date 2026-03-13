"use client";

/**
 * 홈 대시보드 뷰 컴포넌트
 * 최근 수정 게시물 Top 5, 많이 본 게시물 Top 5, 날씨 & 미세먼지,
 * 환율, 증시, 메모, 미니 캘린더, D-Day 카운터, 북마크, 포모도로 타이머,
 * 주간 날씨 예보 위젯을 표시한다.
 */

import { useEffect, useRef, useState } from "react";
import {
  Clock, TrendingUp, Cloud, Wind, Droplets, RefreshCw,
  DollarSign, BarChart2, StickyNote, Plus, Trash2,
  Calendar, Bookmark, Timer, ChevronLeft, ChevronRight,
  Flag, ExternalLink, X, GripVertical, ListTodo, Check, Calculator,
} from "lucide-react";
import type { KnowledgeSection, KnowledgeLink } from "@/data/knowledge-base";
import { cn } from "@/lib/utils";
import { getTopViewed, recordPageView } from "@/lib/view-tracker";
import { extractPageIdFromUrl } from "@/lib/utils";
import { NotionModal } from "./NotionModal";
import { useWidgetStore, type WidgetId } from "@/stores/widgetStore";
import { useMemoStore } from "@/stores/memoStore";
import { useTodoStore } from "@/stores/todoStore";
import { useDDayStore } from "@/stores/ddayStore";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { usePomodoro } from "@/hooks/usePomodoro";

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

/** date.nager.at에서 한국 공휴일을 가져온다 (인증 불필요) */
async function fetchHolidays(year: number): Promise<Array<{ date: string; localName: string }>> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
  if (!res.ok) return [];
  return res.json() as Promise<Array<{ date: string; localName: string }>>;
}

/** 한국어 요일 레이블 (일~토) */
const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconColor)}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTopViewed(getTopViewed(5)); // localStorage는 클라이언트 전용 — 마운트 후 1회만 읽음
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

/** ── 환율 위젯 ── */
interface ExchangeRate {
  currency: string;
  label: string;
  rate: number;
  flag: string;
}

function ExchangeRateWidget() {
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
      iconColor="bg-amber-500"
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

/** ── 증시 위젯 ── */
interface StockIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

function StockWidget() {
  const [indices, setIndices] = useState<StockIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setIsLoading(true);
    setError(false);
    // Next.js API Route를 통해 Yahoo Finance 비공식 API를 서버사이드에서 호출 (CORS 우회)
    fetch("/api/market")
      .then((r) => r.json())
      .then((data) => setIndices(data.indices as StockIndex[]))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  return (
    <WidgetCard
      icon={<BarChart2 className="h-4 w-4 text-white" />}
      title="국내 증시"
      iconColor="bg-indigo-500"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <div className="text-center">
          <p className="text-xs text-gray-400">증시 정보를 불러올 수 없습니다</p>
          <button onClick={load} className="mt-2 text-xs text-indigo-500 hover:underline">
            다시 시도
          </button>
        </div>
      )}
      {!isLoading && !error && indices.length === 0 && (
        <p className="text-center text-xs text-gray-400">데이터가 없습니다</p>
      )}
      {!isLoading && !error && indices.length > 0 && (
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

/** ── 메모 위젯 ── */
function MemoWidget() {
  // 메모 상태는 Zustand 스토어가 관리한다 (persist 미들웨어로 localStorage 자동 영속화)
  const { memos, addMemo: storAddMemo, removeMemo } = useMemoStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addMemo = () => {
    storAddMemo(input);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <WidgetCard
      icon={<StickyNote className="h-4 w-4 text-white" />}
      title="메모"
      iconColor="bg-rose-500"
    >
      {/* 입력창 */}
      <div className="mb-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addMemo(); }}
          placeholder="메모를 입력하세요..."
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <button
          onClick={addMemo}
          aria-label="메모 추가"
          className="flex-shrink-0 rounded-lg bg-rose-500 p-1.5 text-white transition-colors hover:bg-rose-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 메모 목록 */}
      {memos.length === 0 ? (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          메모가 없습니다
        </p>
      ) : (
        <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
          {memos.map((memo) => (
            <li
              key={memo.id}
              className="group flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800"
            >
              <p className="flex-1 break-all text-sm text-gray-700 dark:text-zinc-300">
                {memo.text}
              </p>
              <button
                onClick={() => removeMemo(memo.id)}
                aria-label="메모 삭제"
                className="mt-0.5 flex-shrink-0 text-gray-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

/** ── 미니 캘린더 위젯 ── */
function CalendarWidget() {
  const today = new Date();
  // 뷰 날짜: 현재 달의 1일을 기준으로 월 네비게이션한다
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  // date → localName 맵 (date.nager.at 공휴일)
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // 연도가 바뀔 때마다 해당 연도 공휴일을 다시 가져온다
  useEffect(() => {
    fetchHolidays(year)
      .then((list) => {
        const map = new Map<string, string>();
        list.forEach((h) => map.set(h.date, h.localName));
        setHolidays(map);
      })
      .catch(() => { /* 공휴일 로딩 실패 시 빈 맵 유지 */ });
  }, [year]);

  // 달력 셀 생성: 해당 달 1일의 요일만큼 빈 칸 + 날짜
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 7의 배수로 맞추기
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // 이번 달에 해당하는 공휴일만 추출
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthHolidays = [...holidays.entries()].filter(([d]) => d.startsWith(monthPrefix));

  return (
    <WidgetCard
      icon={<Calendar className="h-4 w-4 text-white" />}
      title="미니 캘린더"
      iconColor="bg-teal-500"
    >
      {/* 월 네비게이션 */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={prevMonth}
          aria-label="이전 달"
          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={nextMonth}
          aria-label="다음 달"
          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAY_KO.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-400 dark:text-zinc-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const holiday = holidays.get(dateStr);
          const isSun = i % 7 === 0;
          const isSat = i % 7 === 6;
          return (
            <div
              key={dateStr}
              title={holiday}
              className={cn(
                "flex h-6 w-full items-center justify-center rounded text-xs",
                isToday && "bg-teal-500 font-bold text-white",
                !isToday && holiday && "font-medium text-red-500 dark:text-red-400",
                !isToday && !holiday && isSun && "text-red-400 dark:text-red-500",
                !isToday && !holiday && isSat && "text-blue-400 dark:text-blue-500",
                !isToday && !holiday && !isSun && !isSat && "text-gray-700 dark:text-zinc-300",
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 이번 달 공휴일 목록 */}
      {monthHolidays.length > 0 && (
        <div className="mt-2 flex flex-col gap-0.5 border-t border-gray-100 pt-2 dark:border-zinc-800">
          {monthHolidays.map(([date, name]) => (
            <div key={date} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
              <Flag className="h-3 w-3 flex-shrink-0 text-red-400" />
              <span>{date.slice(8)}일 {name}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}

/** ── D-Day 카운터 위젯 ── */

/** 목표 날짜까지 남은 일수를 계산한다 (양수=미래, 0=당일, 음수=과거) */
function calcDDay(targetDate: string): number {
  const todayMs = new Date(new Date().toDateString()).getTime();
  const targetMs = new Date(targetDate).getTime();
  return Math.round((targetMs - todayMs) / 86_400_000);
}

function DDayWidget() {
  // D-Day 상태는 Zustand 스토어가 관리한다 (persist 미들웨어로 localStorage 자동 영속화)
  const { ddays, addDDay: storeAddDDay, removeDDay } = useDDayStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const addDDay = () => {
    if (!newTitle.trim() || !newDate) return;
    storeAddDDay(newTitle, newDate);
    setNewTitle("");
    setNewDate("");
    setIsAdding(false);
  };

  return (
    <WidgetCard
      icon={<Flag className="h-4 w-4 text-white" />}
      title="D-Day 카운터"
      iconColor="bg-pink-500"
    >
      {/* D-Day 목록 */}
      {ddays.length === 0 && !isAdding && (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          D-Day가 없습니다
        </p>
      )}
      {ddays.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {ddays.map((d) => {
            const diff = calcDDay(d.targetDate);
            const label = diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
            const labelColor =
              diff === 0 ? "text-red-500" :
              diff > 0 ? "text-pink-600 dark:text-pink-400" :
              "text-gray-400 dark:text-zinc-500";
            return (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-700 dark:text-zinc-300">{d.title}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{d.targetDate}</p>
                </div>
                <span className={cn("flex-shrink-0 text-sm font-bold tabular-nums", labelColor)}>
                  {label}
                </span>
                <button
                  onClick={() => removeDDay(d.id)}
                  aria-label={`${d.title} 삭제`}
                  className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 추가 폼 */}
      {isAdding ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="이벤트 이름"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <input
            type="date"
            aria-label="목표 날짜"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="flex gap-2">
            <button
              onClick={addDDay}
              className="flex-1 rounded-lg bg-pink-500 py-1.5 text-xs font-medium text-white hover:bg-pink-600"
            >
              추가
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewTitle(""); setNewDate(""); }}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-pink-300 py-1.5 text-xs text-pink-500 hover:bg-pink-50 dark:border-pink-800 dark:hover:bg-pink-500/10"
        >
          <Plus className="h-3.5 w-3.5" />
          D-Day 추가
        </button>
      )}
    </WidgetCard>
  );
}

/** ── 북마크 위젯 ── */
function BookmarkWidget() {
  // 북마크 상태는 Zustand 스토어가 관리한다 (persist 미들웨어로 localStorage 자동 영속화)
  const { bookmarks, addBookmark: storeAddBookmark, removeBookmark } = useBookmarkStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addBookmark = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    storeAddBookmark(newTitle, newUrl);
    setNewTitle("");
    setNewUrl("");
    setIsAdding(false);
  };

  return (
    <WidgetCard
      icon={<Bookmark className="h-4 w-4 text-white" />}
      title="북마크"
      iconColor="bg-sky-500"
    >
      {/* 북마크 목록 */}
      {bookmarks.length === 0 && !isAdding && (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          저장된 북마크가 없습니다
        </p>
      )}
      {bookmarks.length > 0 && (
        <ul className="mb-2 flex max-h-44 flex-col gap-1.5 overflow-y-auto">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800"
            >
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-gray-700 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{b.title}</span>
              </a>
              <button
                onClick={() => removeBookmark(b.id)}
                aria-label={`${b.title} 삭제`}
                className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 추가 폼 */}
      {isAdding ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="북마크 이름"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <div className="flex gap-2">
            <button
              onClick={addBookmark}
              className="flex-1 rounded-lg bg-sky-500 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
            >
              추가
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewTitle(""); setNewUrl(""); }}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-sky-300 py-1.5 text-xs text-sky-500 hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-500/10"
        >
          <Plus className="h-3.5 w-3.5" />
          북마크 추가
        </button>
      )}
    </WidgetCard>
  );
}

/** ── 포모도로 타이머 위젯 ── */
/** ── 포모도로 타이머 위젯 ── */
function PomodoroWidget() {
  // 포모도로 타이머 로직을 커스텀 훅으로 분리하여 관심사를 분리한다
  const { mode, isRunning, progress, mins, secs, toggle, reset, switchMode } = usePomodoro();
  const circumference = 2 * Math.PI * 44;

  return (
    <WidgetCard
      icon={<Timer className="h-4 w-4 text-white" />}
      title="포모도로 타이머"
      iconColor="bg-orange-500"
    >
      {/* 모드 탭 */}
      <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-zinc-800">
        {(["work", "break"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              "flex-1 rounded-md py-1 text-xs font-medium transition-colors",
              mode === m
                ? "bg-white text-orange-600 shadow-sm dark:bg-zinc-700 dark:text-orange-400"
                : "text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {m === "work" ? "집중 25분" : "휴식 5분"}
          </button>
        ))}
      </div>

      {/* 원형 프로그레스 + 시간 표시 */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-28 w-28">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            {/* 배경 원 */}
            <circle
              cx="50" cy="50" r="44" fill="none"
              strokeWidth="8" stroke="currentColor"
              className="text-gray-100 dark:text-zinc-800"
            />
            {/* 진행 원 */}
            <circle
              cx="50" cy="50" r="44" fill="none"
              strokeWidth="8" stroke="currentColor" strokeLinecap="round"
              className={mode === "work" ? "text-orange-500" : "text-emerald-500"}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-zinc-100">
              {mins}:{secs}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              {mode === "work" ? "집중" : "휴식"}
            </span>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={toggle}
            className={cn(
              "rounded-lg px-5 py-1.5 text-sm font-medium text-white transition-colors",
              mode === "work"
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            {isRunning ? "일시정지" : "시작"}
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            초기화
          </button>
        </div>
      </div>
    </WidgetCard>
  );
}

/** ── 주간 날씨 예보 위젯 ── */
function WeeklyWeatherWidget() {
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
      iconColor="bg-cyan-500"
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

/** ── 투두 리스트 위젯 ── */
function TodoWidget() {
  // 투두 상태는 Zustand 스토어가 관리한다 (persist 미들웨어로 localStorage 자동 영속화)
  const { todos, addTodo: storeAddTodo, toggleTodo, removeTodo } = useTodoStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTodo = () => {
    storeAddTodo(input);
    setInput("");
    inputRef.current?.focus();
  };

  // 미완료/완료 개수 집계
  const pending = todos.filter((t) => !t.completed).length;
  const done = todos.filter((t) => t.completed).length;

  return (
    <WidgetCard
      icon={<ListTodo className="h-4 w-4 text-white" />}
      title="Todo"
      iconColor="bg-teal-500"
    >
      {/* 입력창 */}
      <div className="mb-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTodo(); }}
          placeholder="할 일을 입력하세요..."
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
        <button
          onClick={addTodo}
          aria-label="투두 추가"
          className="flex-shrink-0 rounded-lg bg-teal-500 p-1.5 text-white transition-colors hover:bg-teal-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* 미완료/완료 개수 */}
      {todos.length > 0 && (
        <p className="mb-2 text-xs text-gray-400 dark:text-zinc-500">
          {pending}개 남음 · {done}개 완료
        </p>
      )}

      {/* 투두 목록 */}
      {todos.length === 0 ? (
        <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
          할 일이 없습니다
        </p>
      ) : (
        <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800"
            >
              {/* 체크 버튼: 완료 토글 */}
              <button
                onClick={() => toggleTodo(todo.id)}
                aria-label={todo.completed ? "완료 취소" : "완료 표시"}
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  todo.completed
                    ? "border-teal-500 bg-teal-500"
                    : "border-gray-300 dark:border-zinc-600"
                )}
              >
                {todo.completed && <Check className="h-3 w-3 text-white" />}
              </button>
              <p className={cn(
                "flex-1 break-all text-sm",
                todo.completed
                  ? "text-gray-400 line-through dark:text-zinc-500"
                  : "text-gray-700 dark:text-zinc-300"
              )}>
                {todo.text}
              </p>
              <button
                onClick={() => removeTodo(todo.id)}
                aria-label="삭제"
                className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

/** 계산기가 지원하는 연산자 타입 — switch 완전 검사로 dead code 방지 */
type CalcOp = "+" | "-" | "×" | "÷";

/** ── 계산기 위젯 ── */
function CalculatorWidget() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [operator, setOperator] = useState<CalcOp | null>(null);
  const [prevValue, setPrevValue] = useState<number | null>(null);
  // 다음 입력이 기존 display를 덮어써야 하는지 여부
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // 두 피연산자와 연산자로 결과를 계산한다
  // CalcOp 유니온을 switch로 완전 검사하므로 default 케이스가 불필요하다
  const calculate = (a: number, op: CalcOp, b: number): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : NaN;
    }
  };

  const handleDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) { setDisplay("0."); setWaitingForOperand(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const handleOperator = (op: CalcOp) => {
    const current = parseFloat(display);
    if (prevValue !== null && !waitingForOperand) {
      const result = calculate(prevValue, operator!, current);
      const resultStr = parseFloat(result.toFixed(10)).toString();
      setDisplay(resultStr);
      setPrevValue(parseFloat(resultStr));
      setExpression(`${resultStr} ${op}`);
    } else {
      setPrevValue(current);
      setExpression(`${display} ${op}`);
    }
    setOperator(op);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (prevValue === null || operator === null) return;
    const current = parseFloat(display);
    const result = calculate(prevValue, operator, current);
    const resultStr = Number.isNaN(result) ? "오류" : parseFloat(result.toFixed(10)).toString();
    setExpression(`${prevValue} ${operator} ${display} =`);
    setDisplay(resultStr);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay("0"); setExpression(""); setOperator(null);
    setPrevValue(null); setWaitingForOperand(false);
  };

  const handlePlusMinus = () => {
    if (display !== "0") setDisplay((parseFloat(display) * -1).toString());
  };

  const handlePercent = () => {
    setDisplay((parseFloat(display) / 100).toString());
  };

  // 버튼 공통 스타일
  const btn = "flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-colors active:scale-95";
  const btnNum = `${btn} bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600`;
  const btnOp = `${btn} bg-amber-400 text-white hover:bg-amber-500`;
  const btnFn = `${btn} bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-500`;

  return (
    <WidgetCard
      icon={<Calculator className="h-4 w-4 text-white" />}
      title="계산기"
      iconColor="bg-slate-600"
    >
      {/* 디스플레이 */}
      <div className="mb-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-zinc-800">
        <p className="h-4 text-right text-xs text-gray-400 dark:text-zinc-500">{expression}</p>
        <p className="mt-1 truncate text-right font-mono text-2xl font-bold text-gray-900 dark:text-zinc-100">
          {display}
        </p>
      </div>

      {/* 버튼 그리드 (4열 5행) */}
      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={handleClear} className={btnFn}>C</button>
        <button onClick={handlePlusMinus} className={btnFn}>±</button>
        <button onClick={handlePercent} className={btnFn}>%</button>
        <button onClick={() => handleOperator("÷")} className={btnOp}>÷</button>

        <button onClick={() => handleDigit("7")} className={btnNum}>7</button>
        <button onClick={() => handleDigit("8")} className={btnNum}>8</button>
        <button onClick={() => handleDigit("9")} className={btnNum}>9</button>
        <button onClick={() => handleOperator("×")} className={btnOp}>×</button>

        <button onClick={() => handleDigit("4")} className={btnNum}>4</button>
        <button onClick={() => handleDigit("5")} className={btnNum}>5</button>
        <button onClick={() => handleDigit("6")} className={btnNum}>6</button>
        <button onClick={() => handleOperator("-")} className={btnOp}>-</button>

        <button onClick={() => handleDigit("1")} className={btnNum}>1</button>
        <button onClick={() => handleDigit("2")} className={btnNum}>2</button>
        <button onClick={() => handleDigit("3")} className={btnNum}>3</button>
        <button onClick={() => handleOperator("+")} className={btnOp}>+</button>

        <button onClick={() => handleDigit("0")} className={`${btnNum} col-span-2`}>0</button>
        <button onClick={handleDecimal} className={btnNum}>.</button>
        <button onClick={handleEquals} className={`${btn} bg-teal-500 text-white hover:bg-teal-600`}>=</button>
      </div>
    </WidgetCard>
  );
}

/** ── 디지털 시계 위젯 ── */
function ClockWidget() {
  // SSR 하이드레이션 불일치 방지: 마운트 후에만 시각을 표시한다
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // setInterval 콜백은 effect 내부 직접 호출이 아니므로 lint 규칙 적용 제외
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "--:--:--";
  const dateStr = now
    ? now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
    : "";

  return (
    <WidgetCard
      icon={<Clock className="h-4 w-4 text-white" />}
      title="디지털 시계"
      iconColor="bg-violet-500"
    >
      <div className="flex flex-col items-center gap-2 py-4">
        <p className="font-mono text-4xl font-bold tabular-nums text-gray-900 dark:text-zinc-100">
          {timeStr}
        </p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">{dateStr}</p>
      </div>
    </WidgetCard>
  );
}

/** ── 위젯 순서 관리 — useWidgetStore (Zustand) 로 위임됨 ── */

/** ── 홈 메인 뷰 ── */
export function HomeView({ sections }: HomeViewProps) {
  const [activeModal, setActiveModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // 위젯 순서 — Zustand 스토어에서 가져온다 (persist 미들웨어로 localStorage 자동 영속화)
  const { widgetOrder, reorder: reorderWidgets } = useWidgetStore();
  // 현재 드래그 중인 위젯 ID와 드롭 대상 위젯 ID를 ref 로 추적한다
  // (상태 업데이트 전 이벤트 핸들러에서 참조하기 위해 ref 사용)
  const draggingIdRef = useRef<WidgetId | null>(null);
  const dropTargetIdRef = useRef<WidgetId | null>(null);
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<WidgetId | null>(null);

  // ── HTML5 DnD 핸들러 (마우스 / 트랙패드) ──
  const handleDragStart = (e: React.DragEvent, id: WidgetId) => {
    e.dataTransfer.effectAllowed = "move";
    draggingIdRef.current = id;
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    dropTargetIdRef.current = id;
    if (id !== dropTargetId) setDropTargetId(id);
  };

  const handleDragEnd = () => {
    if (draggingIdRef.current && dropTargetIdRef.current) {
      reorderWidgets(draggingIdRef.current, dropTargetIdRef.current);
    }
    draggingIdRef.current = null;
    dropTargetIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  };

  // ── 포인터 이벤트 핸들러 (터치 전용 — 드래그 핸들에서만 시작) ──
  const handleHandlePointerDown = (e: React.PointerEvent, id: WidgetId) => {
    // 마우스는 HTML5 DnD 로 처리하므로 터치만 여기서 처리한다
    if (e.pointerType === "mouse") return;
    e.preventDefault(); // 스크롤 방지
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    draggingIdRef.current = id;
    setDraggingId(id);
  };

  const handleHandlePointerMove = (e: React.PointerEvent) => {
    if (!draggingIdRef.current || e.pointerType === "mouse") return;
    // 포인터 아래의 카드를 찾아 드롭 대상으로 지정한다
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el?.closest("[data-widget-id]");
    const targetId = card?.getAttribute("data-widget-id") as WidgetId | null;
    if (targetId && targetId !== dropTargetIdRef.current) {
      dropTargetIdRef.current = targetId;
      setDropTargetId(targetId);
    }
  };

  const handleHandlePointerUp = () => {
    if (draggingIdRef.current && dropTargetIdRef.current) {
      reorderWidgets(draggingIdRef.current, dropTargetIdRef.current);
    }
    draggingIdRef.current = null;
    dropTargetIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  };

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

  /** 위젯 ID에 해당하는 컴포넌트를 반환한다 */
  const renderWidget = (id: WidgetId): React.ReactNode => {
    switch (id) {
      case "recent":        return <RecentlyModifiedWidget sections={sections} onOpenModal={openModal} />;
      case "popular":       return <MostViewedWidget onOpenModal={openModal} />;
      case "weather":       return <WeatherWidget />;
      case "exchange":      return <ExchangeRateWidget />;
      case "market":        return <StockWidget />;
      case "memo":          return <MemoWidget />;
      case "calendar":      return <CalendarWidget />;
      case "dday":          return <DDayWidget />;
      case "bookmark":      return <BookmarkWidget />;
      case "pomodoro":      return <PomodoroWidget />;
      case "weekly-weather": return <WeeklyWeatherWidget />;
      case "todo":          return <TodoWidget />;
      case "calculator":    return <CalculatorWidget />;
      case "clock":         return <ClockWidget />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">홈</h2>
        <p className="mt-0.5 text-sm text-gray-400 dark:text-zinc-500">
          총 {totalDocs}개 문서 · {sections.length}개 섹션
        </p>
      </div>

      {/* 위젯 그리드 — 드래그앤드롭으로 순서 변경 가능, 행 높이 고정으로 균일한 레이아웃 유지 */}
      <div className="grid auto-rows-[300px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {widgetOrder.map((id) => (
          <div
            key={id}
            data-widget-id={id}
            draggable
            onDragStart={(e) => handleDragStart(e, id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative h-full transition-opacity duration-150",
              draggingId === id && "opacity-40",
              // draggingId !== null 조건으로 실제 드래그 중일 때만 링 강조를 표시한다
              draggingId !== null && dropTargetId === id && draggingId !== id &&
                "rounded-xl ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-zinc-950"
            )}
          >
            {/* 드래그 핸들 — 마우스: 호버 시 표시 / 터치: 항상 반투명 표시 */}
            <div
              onPointerDown={(e) => handleHandlePointerDown(e, id)}
              onPointerMove={handleHandlePointerMove}
              onPointerUp={handleHandlePointerUp}
              onPointerCancel={handleHandlePointerUp}
              title="드래그하여 위젯 순서를 변경합니다"
              aria-label="위젯 이동 핸들"
              className="absolute right-2 top-[10px] z-10 touch-none cursor-grab rounded p-1 text-gray-300 opacity-0 transition-opacity duration-200 active:cursor-grabbing group-hover:opacity-100 dark:text-zinc-600 sm:opacity-20"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            {renderWidget(id)}
          </div>
        ))}
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
