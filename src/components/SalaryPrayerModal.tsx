"use client";

/**
 * 🙏 월급 기도 이스터에그 모달
 * 포털 타이틀을 5번 빠르게 클릭하면 등장한다.
 * 기도 횟수는 localStorage에 영속화된다 (Zustand 불필요 — 이스터에그 전용 단순 카운터).
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface SalaryPrayerModalProps {
  onClose: () => void;
}

/** 기도 완료 시 표시할 랜덤 응답 메시지 */
const DIVINE_RESPONSES = [
  "이번달도 ㄹㅍ 예정이오니 기도를 멈추지 마세요 🌟",
  "성과급은 내년을 기약하세요 📅",
  "야근수당은 천국에서 지급됩니다 😇",
  "상사도 같이 기도 중입니다 🤝",
  "월급날까지 조금만 더 버티세요 💪",
  "정의로운 월급도둑의 기도가 접수되었습니다 ✅",
];

export function SalaryPrayerModal({ onClose }: SalaryPrayerModalProps) {
  // 기도 애니메이션 상태 — true이면 두 번째 이미지(혼자 기도) 표시
  const [isPraying, setIsPraying] = useState(false);
  // 누적 기도 횟수 — localStorage에서 복원
  const [prayCount, setPrayCount] = useState(0);
  // 기도 완료 후 표시할 신의 응답 메시지
  const [response, setResponse] = useState("");

  // 마운트 시 localStorage에서 기도 횟수 복원
  useEffect(() => {
    const saved = parseInt(localStorage.getItem("upharm_pray_count") ?? "0", 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrayCount(saved);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  /** 기도하기 버튼 클릭 — 이미지 전환 + 카운터 증가 + 랜덤 응답 */
  const handlePray = () => {
    if (isPraying) return;
    const newCount = prayCount + 1;
    setPrayCount(newCount);
    localStorage.setItem("upharm_pray_count", String(newCount));
    setResponse(DIVINE_RESPONSES[newCount % DIVINE_RESPONSES.length]);
    setIsPraying(true);
    // 1.5초 후 원래 이미지로 복귀
    setTimeout(() => setIsPraying(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700"
          aria-label="닫기"
        >
          <X size={16} />
        </button>

        {/* 이스터에그 헤더 */}
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-indigo-400">
          🔒 비밀 기능 발견
        </p>

        {/* 기도 이미지 — 기도 중이면 두 번째(혼자 기도), 아니면 첫 번째(함께 기도) */}
        <div className="relative mb-4 h-56 w-full overflow-hidden rounded-2xl bg-gray-50 dark:bg-zinc-700">
          <Image
            src={isPraying ? "/salary-prayer-2.jpg" : "/salary-prayer-1.jpg"}
            alt={isPraying ? "간절히 기도 중" : "함께 기도 중"}
            fill
            className="object-contain transition-opacity duration-300"
          />
        </div>

        {/* 신의 응답 or 기본 문구 */}
        <p className="mb-1 min-h-[2.5rem] text-center text-sm font-medium text-gray-700 dark:text-zinc-200">
          {response || "주님! 오늘도 정의로운 월급도둑이\n되게 해주세요 🙏"}
        </p>
        <p className="mb-4 text-center text-xs text-gray-400 dark:text-zinc-500">
          누적 기도 {prayCount}회
        </p>

        {/* 기도하기 버튼 */}
        <button
          onClick={handlePray}
          disabled={isPraying}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPraying ? "🙏 기도 전송 중..." : "🙏 기도하기"}
        </button>
      </div>
    </div>
  );
}
