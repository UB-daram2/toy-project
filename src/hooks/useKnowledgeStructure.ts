"use client";

/**
 * Notion 지식베이스 구조를 클라이언트에서 가져오는 커스텀 훅.
 * /api/knowledge-structure 엔드포인트를 호출하며,
 * 실패 시 최대 2회 자동 재시도하고, 로컬 캐시를 폴백으로 활용한다.
 *
 * 상태 전이:
 *   캐시 없음: loading → (retrying ×2) → success | error
 *   캐시 있음: 즉시 캐시 표시, 백그라운드 갱신 → success | cached
 */

import { useState, useEffect, useCallback } from "react";
import type { KnowledgeSection } from "@/data/knowledge-base";

/** 기술지원 최상위 Notion 페이지 URL (에러 시 안내용) */
export const NOTION_ROOT_URL =
  "https://www.notion.so/40e1f915cdf083b1a12c81d925ccecca";

/** localStorage 캐시 키 */
const CACHE_KEY = "upharm_knowledge_structure";

/** 총 시도 횟수 (초기 1회 + 재시도 2회) */
const MAX_ATTEMPTS = 3;

/** 재시도 전 대기 시간 (ms): 1차 1초, 2차 2초 */
const RETRY_DELAYS_MS = [1000, 2000];

/** 지식베이스 로딩 상태 */
export type KnowledgeStatus =
  | "loading"  // 캐시 없음, 첫 로딩 중
  | "retrying" // 캐시 없음, 재시도 중
  | "success"  // 최신 Notion 데이터 로딩 성공
  | "cached"   // Notion 로딩 실패 + 이전 캐시 사용 중
  | "error";   // Notion 로딩 실패 + 캐시 없음

export interface UseKnowledgeStructureResult {
  sections: KnowledgeSection[];
  status: KnowledgeStatus;
  /** 현재 재시도 횟수 (1부터 시작, retrying 상태에서만 의미 있음) */
  retryAttempt: number;
  /** 최대 재시도 횟수 */
  maxRetries: number;
  /** 수동 재시도 트리거 */
  retry: () => void;
}

/** localStorage에서 캐시된 섹션 배열을 읽는다 */
function loadCache(): KnowledgeSection[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as KnowledgeSection[]) : [];
  } catch {
    return [];
  }
}

/** 섹션 배열을 localStorage에 캐시로 저장한다 */
function saveCache(sections: KnowledgeSection[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(sections));
  } catch {
    // 용량 초과 등 쓰기 실패 시 무시
  }
}

export function useKnowledgeStructure(): UseKnowledgeStructureResult {
  // SSR 하이드레이션 일치를 위해 초기값은 항상 빈 배열 (캐시 로딩은 useEffect 내 load()에서 처리)
  const [sections, setSections] = useState<KnowledgeSection[]>([]);
  const [status, setStatus] = useState<KnowledgeStatus>("loading");
  const [retryAttempt, setRetryAttempt] = useState(0);

  const load = useCallback(async () => {
    // load() 시작 시점의 캐시 보유 여부 확인 (useEffect 내에서만 호출되므로 window 항상 존재)
    const cachedSections = loadCache();
    const hasCached = cachedSections.length > 0;

    // 캐시가 있으면 즉시 표시 (빈 화면 방지), 항상 loading 으로 전환해 갱신 중임을 표시
    if (hasCached) {
      setSections(cachedSections);
    }
    setStatus("loading");
    setRetryAttempt(0);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // 재시도 전 상태 업데이트 및 대기
      if (attempt > 0) {
        // 캐시가 없을 때만 retrying 배너 표시
        if (!hasCached) {
          setStatus("retrying");
        }
        setRetryAttempt(attempt);
        await new Promise<void>((r) =>
          setTimeout(r, RETRY_DELAYS_MS[attempt - 1])
        );
      }

      try {
        const res = await fetch("/api/knowledge-structure");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: KnowledgeSection[] = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("빈 응답");
        // 성공: 캐시 저장 후 최신 데이터로 교체
        saveCache(data);
        setSections(data);
        setStatus("success");
        return;
      } catch {
        // 마지막 시도 실패 시 캐시 유무에 따라 상태 결정
        if (attempt === MAX_ATTEMPTS - 1) {
          if (hasCached) {
            // 이전 캐시로 폴백
            setSections(cachedSections);
            setStatus("cached");
          } else {
            setStatus("error");
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    sections,
    status,
    retryAttempt,
    maxRetries: MAX_ATTEMPTS - 1,
    retry: load,
  };
}
