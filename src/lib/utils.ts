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
 * Notion 페이지 URL에서 32자리 페이지 ID를 추출한다.
 * 예: https://www.notion.so/Title-87e1f915cdf083ca → "87e1f915cdf083ca..."
 */
export function extractPageIdFromUrl(url: string): string {
  // URL 끝의 32자리 hex 문자열을 추출 (하이픈 없는 형태)
  const match = url.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  return match ? match[1] : "";
}

/**
 * 섹션 colorKey에 따라 Tailwind 색상 클래스를 반환한다.
 * 라이트모드와 다크모드를 모두 지원한다.
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
      badge: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400",
      accent: "bg-blue-500",
      hover: "hover:border-blue-400/50 hover:bg-blue-50 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/5",
      border: "border-blue-400/30 dark:border-blue-500/30",
      text: "text-blue-600 dark:text-blue-400",
    },
    violet: {
      badge: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
      accent: "bg-violet-500",
      hover: "hover:border-violet-400/50 hover:bg-violet-50 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/5",
      border: "border-violet-400/30 dark:border-violet-500/30",
      text: "text-violet-600 dark:text-violet-400",
    },
    emerald: {
      badge: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
      accent: "bg-emerald-500",
      hover: "hover:border-emerald-400/50 hover:bg-emerald-50 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/5",
      border: "border-emerald-400/30 dark:border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  };

  return colorMap[colorKey];
}
