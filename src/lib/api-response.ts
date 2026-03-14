/**
 * API Route 공통 응답 유틸리티
 * 에러 메시지 포맷, HTTP 상태 코드, 캐시 헤더를 한 곳에서 관리하여
 * 계층 간 에러 처리가 일관되도록 한다.
 *
 * 사용처: src/app/api/ 하위 라우트 핸들러
 * 의존성: Next.js 없음 (순수 객체·상수만 내보냄 — 테스트 용이)
 */

/** Cache-Control 헤더 프리셋 */
export const CACHE = {
  /** 증시·환율 등 빠르게 변하는 데이터: 1분 캐시, 10초 stale-while-revalidate */
  SHORT:  "public, s-maxage=60, stale-while-revalidate=10",
  /** Notion 페이지 콘텐츠 등 느리게 변하는 데이터: 5분 캐시, 60초 stale-while-revalidate */
  MEDIUM: "public, s-maxage=300, stale-while-revalidate=60",
} as const;

/** API Route에서 사용하는 HTTP 상태 코드 */
export const HTTP_STATUS = {
  OK:                    200,
  BAD_REQUEST:           400,
  NOT_FOUND:             404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY:           502,
} as const;

/** 에러 메시지를 일관된 JSON 바디 형식으로 변환한다 */
export function errorBody(message: string): { error: string } {
  return { error: message };
}
