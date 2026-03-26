"use client";

/**
 * 지식베이스 로딩 상태별 UI 컴포넌트
 * Dashboard.tsx에서 분리한 배너·로딩·에러 상태 UI를 모은다.
 */

import { Loader2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { NOTION_ROOT_URL } from "@/hooks/useKnowledgeStructure";

/** 홈 탭 상단 로딩 배너 (위젯은 그대로 표시) */
export function KnowledgeLoadingBanner({
  status,
  retryAttempt,
  maxRetries,
}: {
  status: "loading" | "retrying";
  retryAttempt: number;
  maxRetries: number;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-indigo-200/60 bg-indigo-50/80 px-4 py-2.5 text-sm text-indigo-700 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-300">
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      <span>
        {status === "retrying"
          ? `지식베이스 재시도 중... (${retryAttempt}/${maxRetries})`
          : "지식베이스 불러오는 중..."}
      </span>
    </div>
  );
}

/** 홈 탭 상단 에러 배너 (위젯은 그대로 표시) */
export function KnowledgeErrorBanner({ retry }: { retry: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200/60 bg-amber-50/80 px-4 py-2.5 text-sm dark:border-amber-800/40 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>지식베이스를 불러올 수 없습니다</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={retry}
          className="flex items-center gap-1 text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
        >
          <RefreshCw className="h-3 w-3" />
          재시도
        </button>
        <a
          href={NOTION_ROOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Notion 열기
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

/** 전체 화면 로딩·재시도 상태 UI */
export function KnowledgeLoadingState({
  status,
  retryAttempt,
  maxRetries,
}: {
  status: "loading" | "retrying";
  retryAttempt: number;
  maxRetries: number;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        {status === "retrying"
          ? `재시도 중... (${retryAttempt}/${maxRetries})`
          : "지식베이스 불러오는 중..."}
      </p>
    </div>
  );
}

/** 전체 화면 최종 실패 상태 UI */
export function KnowledgeErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-5 text-center">
      <AlertCircle className="h-10 w-10 text-gray-300 dark:text-zinc-600" />
      <div className="space-y-1">
        <p className="font-medium text-gray-600 dark:text-zinc-300">
          지식베이스를 불러올 수 없습니다
        </p>
        <p className="text-sm text-gray-400 dark:text-zinc-500">
          Notion 서버가 응답하지 않습니다
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={retry}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          다시 시도
        </button>
        <a
          href={NOTION_ROOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
        >
          Notion에서 열기
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
