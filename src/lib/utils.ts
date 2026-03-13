/**
 * 공통 유틸리티 함수 모음
 */

/**
 * 여러 클래스명을 조합하여 하나의 문자열로 반환한다.
 * falsy 값(undefined, null, false)은 자동으로 제외된다.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * 섹션 colorKey에 따라 Tailwind 색상 클래스를 반환한다.
 * 다크모드와 라이트모드 모두 지원한다.
 */
export function getSectionColorClasses(colorKey: "blue" | "violet" | "emerald"): {
  badge: string;
  accent: string;
  hover: string;
  border: string;
  text: string;
} {
  const colorMap = {
    blue: {
      badge: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
      accent: "bg-blue-500",
      hover: "hover:border-blue-500/50 hover:bg-blue-500/5",
      border: "border-blue-500/30",
      text: "text-blue-400",
    },
    violet: {
      badge: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
      accent: "bg-violet-500",
      hover: "hover:border-violet-500/50 hover:bg-violet-500/5",
      border: "border-violet-500/30",
      text: "text-violet-400",
    },
    emerald: {
      badge: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
      accent: "bg-emerald-500",
      hover: "hover:border-emerald-500/50 hover:bg-emerald-500/5",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
    },
  };

  return colorMap[colorKey];
}
