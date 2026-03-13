"use client";

/**
 * Notion 페이지 내용을 모달로 표시하는 컴포넌트
 * 카드 클릭 시 API Route를 통해 Notion 블록을 가져와 렌더링한다.
 * child_page 블록 클릭 시 모달 내에서 페이지 내비게이션을 지원한다.
 */

import { useEffect, useState, useCallback } from "react";
import { X, ExternalLink, Loader2, ChevronLeft, FileText, ChevronRight, Download } from "lucide-react";
import { extractPageIdFromUrl } from "@/lib/utils";

/** Notion Rich Text 항목 타입 */
interface RichTextItem {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  };
}

/** Notion 블록의 최소 공통 타입 */
interface NotionBlock {
  id: string;
  type: string;
  // 블록 타입별 데이터는 타입 단언으로 접근
  [key: string]: unknown;
}

/** 모달 내비게이션 항목 */
interface PageEntry {
  url: string;
  title: string;
}

/**
 * Rich Text 배열을 스타일이 적용된 React 노드로 변환한다.
 */
function renderRichText(richTexts: RichTextItem[]): React.ReactNode {
  return richTexts.map((item, index) => {
    if (item.annotations.code) {
      return (
        <code
          key={index}
          className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm dark:bg-zinc-800"
        >
          {item.plain_text}
        </code>
      );
    }

    const className = [
      item.annotations.bold && "font-semibold",
      item.annotations.italic && "italic",
      item.annotations.strikethrough && "line-through",
      item.annotations.underline && "underline",
    ]
      .filter(Boolean)
      .join(" ");

    if (item.href) {
      return (
        <a
          key={index}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-blue-600 hover:underline dark:text-blue-400 ${className}`}
        >
          {item.plain_text}
        </a>
      );
    }

    return (
      <span key={index} className={className || undefined}>
        {item.plain_text}
      </span>
    );
  });
}

/**
 * 단일 Notion 블록을 타입에 따라 적합한 HTML 엘리먼트로 렌더링한다.
 * child_page 블록은 onNavigate 콜백을 통해 모달 내 페이지 이동을 지원한다.
 */
function NotionBlockRenderer({
  block,
  onNavigate,
}: {
  block: NotionBlock;
  onNavigate: (entry: PageEntry) => void;
}): React.ReactElement | null {
  const { type } = block;
  const data = block[type] as {
    rich_text?: RichTextItem[];
    checked?: boolean;
    url?: string;
    file?: { url: string };
    external?: { url: string };
    icon?: { emoji?: string };
    language?: string;
  };

  switch (type) {
    case "paragraph":
      return (
        <p className="mb-3 text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
          {data.rich_text?.length ? renderRichText(data.rich_text) : <br />}
        </p>
      );

    case "heading_1":
      return (
        <h1 className="mb-3 mt-6 text-xl font-bold text-gray-900 dark:text-zinc-100">
          {renderRichText(data.rich_text ?? [])}
        </h1>
      );

    case "heading_2":
      return (
        <h2 className="mb-2 mt-5 text-lg font-semibold text-gray-900 dark:text-zinc-100">
          {renderRichText(data.rich_text ?? [])}
        </h2>
      );

    case "heading_3":
      return (
        <h3 className="mb-2 mt-4 text-base font-semibold text-gray-800 dark:text-zinc-200">
          {renderRichText(data.rich_text ?? [])}
        </h3>
      );

    case "bulleted_list_item":
      return (
        <li className="mb-1 ml-5 list-disc text-sm text-gray-700 dark:text-zinc-300">
          {renderRichText(data.rich_text ?? [])}
        </li>
      );

    case "numbered_list_item":
      return (
        <li className="mb-1 ml-5 list-decimal text-sm text-gray-700 dark:text-zinc-300">
          {renderRichText(data.rich_text ?? [])}
        </li>
      );

    case "to_do":
      return (
        <div className="mb-1 flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={data.checked ?? false}
            readOnly
            className="mt-0.5 flex-shrink-0"
          />
          <span className={data.checked ? "line-through opacity-60" : ""}>
            {renderRichText(data.rich_text ?? [])}
          </span>
        </div>
      );

    case "divider":
      return <hr className="my-4 border-gray-200 dark:border-zinc-700" />;

    case "quote":
      return (
        <blockquote className="mb-3 border-l-4 border-gray-300 pl-4 text-sm italic text-gray-600 dark:border-zinc-600 dark:text-zinc-400">
          {renderRichText(data.rich_text ?? [])}
        </blockquote>
      );

    case "code":
      return (
        <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm font-mono dark:bg-zinc-800">
          <code className="text-gray-800 dark:text-zinc-200">
            {data.rich_text?.map((r) => r.plain_text).join("") ?? ""}
          </code>
        </pre>
      );

    case "callout":
      return (
        <div className="mb-3 flex gap-3 rounded-lg bg-gray-100 p-4 text-sm dark:bg-zinc-800">
          {data.icon?.emoji && <span>{data.icon.emoji}</span>}
          <div className="text-gray-700 dark:text-zinc-300">
            {renderRichText(data.rich_text ?? [])}
          </div>
        </div>
      );

    case "image": {
      const imageUrl = data.file?.url ?? data.external?.url ?? "";
      return imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="mb-3 max-w-full rounded-lg"
        />
      ) : null;
    }

    case "toggle":
      return (
        <details className="mb-2 rounded-lg border border-gray-200 dark:border-zinc-700">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
            {renderRichText(data.rich_text ?? [])}
          </summary>
        </details>
      );

    case "file": {
      // 파일 첨부 블록 → signed URL이 있으면 다운로드, 없으면 Notion 페이지로 유도
      const fileData = data as unknown as { name: string; size: string | null; url: string | null };
      const ext = fileData.name.split(".").pop()?.toLowerCase() ?? "";
      const isPdf = ext === "pdf";
      // PDF는 새 탭에서 보기, 나머지는 다운로드
      const linkProps = isPdf
        ? { target: "_blank" as const, rel: "noopener noreferrer" }
        : { download: fileData.name };
      return fileData.url ? (
        <a
          href={fileData.url}
          {...linkProps}
          className="mb-2 flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Download className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="flex-1 text-sm text-gray-700 dark:text-zinc-300">{fileData.name}</span>
          {fileData.size && (
            <span className="text-xs text-gray-400 dark:text-zinc-500">{fileData.size}</span>
          )}
        </a>
      ) : (
        // signed URL 획득 실패 시 → 파일명은 표시하되 Notion에서 직접 열도록 안내
        <div className="mb-2 flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 opacity-60 dark:border-zinc-700">
          <Download className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="flex-1 text-sm text-gray-700 dark:text-zinc-300">{fileData.name}</span>
          {fileData.size && (
            <span className="text-xs text-gray-400 dark:text-zinc-500">{fileData.size}</span>
          )}
          <span className="text-xs text-gray-400 dark:text-zinc-500">Notion에서 열기</span>
        </div>
      );
    }

    case "child_page": {
      // 서브페이지 블록 → 클릭 시 모달 내에서 해당 페이지로 이동
      const pageUrl = data.url as string;
      const pageTitle = data.rich_text?.[0]?.plain_text ?? "페이지";
      return (
        <button
          onClick={() => onNavigate({ url: pageUrl, title: pageTitle })}
          className="mb-2 flex w-full items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <FileText className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
          <span className="flex-1 text-sm text-gray-700 dark:text-zinc-300">
            {pageTitle}
          </span>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
        </button>
      );
    }

    default:
      return null;
  }
}


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
