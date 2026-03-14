"use client";

/**
 * 미니 캘린더 위젯
 * 월 네비게이션과 date.nager.at 공휴일 표시를 제공한다.
 * 인증 불필요. 연도가 바뀔 때마다 해당 연도 공휴일을 재로딩한다.
 */

import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetCard } from "./WidgetCard";

/** date.nager.at에서 한국 공휴일을 가져온다 (인증 불필요) */
async function fetchHolidays(year: number): Promise<Array<{ date: string; localName: string }>> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
  if (!res.ok) return [];
  return res.json() as Promise<Array<{ date: string; localName: string }>>;
}

/** 한국어 요일 레이블 (일~토) */
const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarWidget() {
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
      accentGradient="from-teal-500 to-cyan-500"
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
