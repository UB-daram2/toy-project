"use client";

/**
 * Notion 지식베이스 구조를 클라이언트에서 가져오는 커스텀 훅.
 * /api/knowledge-structure 엔드포인트를 호출하며,
 * 실패 시 최대 2회 자동 재시도한다. 캐시 없이 항상 최신 데이터를 요청한다.
 *
 * 상태 전이: loading → (retrying ×2) → success | error
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { KnowledgeSection } from "@/data/knowledge-base";

/** 기술지원 최상위 Notion 페이지 URL (에러 시 안내용) */
export const NOTION_ROOT_URL =
  "https://u-pham.notion.site/f619ba2093174f54b31f1c5eba82a468";

/** 총 시도 횟수 (초기 1회 + 재시도 2회) */
const MAX_ATTEMPTS = 3;

/** 재시도 전 대기 시간 (ms): 1차 1초, 2차 2초 */
const RETRY_DELAYS_MS = [1000, 2000];

/** 지식베이스 로딩 상태 */
export type KnowledgeStatus =
  | "loading"  // 첫 로딩 중
  | "retrying" // 재시도 중
  | "success"  // Notion 데이터 로딩 성공
  | "error";   // 모든 시도 실패

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

export function useKnowledgeStructure(
  /** 서버사이드에서 미리 로딩된 초기 섹션. 제공 시 즉시 success 상태로 시작한다 */
  initialSections: KnowledgeSection[] = []
): UseKnowledgeStructureResult {
  const [sections, setSections] = useState<KnowledgeSection[]>(initialSections);
  const [status, setStatus] = useState<KnowledgeStatus>(
    initialSections.length > 0 ? "success" : "loading"
  );
  const [retryAttempt, setRetryAttempt] = useState(0);

  // useCallback deps 안정화를 위해 initialSections는 ref로 관리 (마운트 시 고정)
  const initialSectionsRef = useRef(initialSections);

  const load = useCallback(async () => {
    setStatus("loading");
    setRetryAttempt(0);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // 재시도 전 상태 업데이트 및 대기
      if (attempt > 0) {
        setStatus("retrying");
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
        setSections(data);
        setStatus("success");
        return;
      } catch {
        // 마지막 시도 실패 시 서버 초기 데이터가 있으면 유지, 없으면 error
        if (attempt === MAX_ATTEMPTS - 1) {
          if (initialSectionsRef.current.length > 0) {
            setSections(initialSectionsRef.current);
          }
          setStatus("error");
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
