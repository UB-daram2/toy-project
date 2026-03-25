"use client";

/**
 * Notion 페이지 내용을 모달로 표시하는 컴포넌트
 * 카드 클릭 시 API Route를 통해 Notion 블록을 가져와 렌더링한다.
 * child_page 블록 클릭 시 모달 내에서 페이지 내비게이션을 지원한다.
 */

import { useEffect, useState, useCallback } from "react";
import { X, ExternalLink, Loader2, ChevronLeft } from "lucide-react";
import { extractPageIdFromUrl } from "@/lib/utils";
import {
  NotionBlockRenderer,
  type NotionBlock,
  type PageEntry,
} from "./NotionBlockRenderer";

interface NotionModalProps {
  pageUrl: string;
  pageTitle: string;
  onClose: () => void;
}

export function NotionModal({ pageUrl, pageTitle, onClose }: NotionModalProps) {
  // 내비게이션 히스토리 스택 (마지막 항목이 현재 페이지)
  const [pageStack, setPageStack] = useState<PageEntry[]>([
    { url: pageUrl, title: pageTitle },
  ]);

  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 현재 표시 중인 페이지
  const currentPage = pageStack[pageStack.length - 1];
  const canGoBack = pageStack.length > 1;

  // 실제로 보이는 콘텐츠가 하나라도 있는지 판단
  // divider·image·file은 rich_text 없이도 가시적, 나머지는 rich_text가 1개 이상이어야 보임
  const hasVisibleContent = blocks.some((b) => {
    if (b.type === "divider") return true;
    if (b.type === "file") return true;
    if (b.type === "image") {
      const d = b[b.type] as { file?: { url: string }; external?: { url: string } };
      return !!(d?.file?.url ?? d?.external?.url);
    }
    const d = b[b.type] as { rich_text?: unknown[] };
    return (d?.rich_text?.length ?? 0) > 0;
  });

  // 서브페이지로 이동 (스택에 추가)
  const navigateTo = useCallback((entry: PageEntry) => {
    setPageStack((prev) => [...prev, entry]);
  }, []);

  // 이전 페이지로 돌아가기
  const navigateBack = useCallback(() => {
    setPageStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // URL에서 페이지 ID 추출 후 블록 데이터 로딩
  useEffect(() => {
    const pageId = extractPageIdFromUrl(currentPage.url);

    if (!pageId) {
      setError("올바르지 않은 페이지 URL입니다.");
      setIsLoading(false);
      return;
    }

    async function fetchBlocks() {
      setIsLoading(true);
      setError(null);
      setBlocks([]);
      try {
        const response = await fetch(`/api/notion/${pageId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unknown error");
        setBlocks(data.blocks as NotionBlock[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "페이지를 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlocks();
  }, [currentPage.url]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentPage.title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-full max-h-[92dvh] w-full max-w-3xl flex-col rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[80vh] sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* 헤더: 뒤로가기 + 제목 + Notion 열기 + 닫기 */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
          {/* 뒤로가기 버튼 (서브페이지 이동 시에만 표시) */}
          {canGoBack && (
            <button
              onClick={navigateBack}
              aria-label="이전 페이지"
              className="flex-shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <h2 className="flex-1 truncate text-base font-semibold text-gray-900 dark:text-zinc-100">
            {currentPage.title}
          </h2>

          <div className="flex flex-shrink-0 items-center gap-2">
            <a
              href={currentPage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
            >
              <ExternalLink className="h-3 w-3" />
              Notion에서 열기
            </a>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 본문: 블록 렌더링 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400 dark:text-zinc-500">
                불러오는 중...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* 보이는 콘텐츠가 없는 경우 Notion 링크로 유도 */}
          {!isLoading && !error && !hasVisibleContent && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <p className="text-sm text-gray-400 dark:text-zinc-500">
                이 페이지는 Notion에서 직접 확인해 주세요.
              </p>
              <a
                href={currentPage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                <ExternalLink className="h-4 w-4" />
                Notion에서 열기
              </a>
            </div>
          )}

          {!isLoading && !error && hasVisibleContent && (
            <div>
              {blocks.map((block) => (
                <NotionBlockRenderer
                  key={block.id}
                  block={block}
                  onNavigate={navigateTo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
