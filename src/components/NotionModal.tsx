"use client";

/**
 * Notion 페이지 내용을 모달로 표시하는 컴포넌트
 * 카드 클릭 시 API Route를 통해 Notion 블록을 가져와 렌더링한다.
 */

import { useEffect, useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
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
  // 블록 타입별 데이터는 동적으로 접근
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Rich Text 배열을 스타일이 적용된 React 노드로 변환한다.
 * bold, italic, code, link 등의 어노테이션을 처리한다.
 */
function renderRichText(richTexts: RichTextItem[]): React.ReactNode {
  return richTexts.map((item, index) => {
    // 인라인 코드
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

    // 텍스트 스타일 클래스 조합
    const className = [
      item.annotations.bold && "font-semibold",
      item.annotations.italic && "italic",
      item.annotations.strikethrough && "line-through",
      item.annotations.underline && "underline",
    ]
      .filter(Boolean)
      .join(" ");

    // 링크가 있으면 앵커 태그로 감싼다
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
 * 지원하지 않는 타입은 null을 반환한다.
 */
function NotionBlockRenderer({
  block,
}: {
  block: NotionBlock;
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
          {/* 체크박스는 읽기 전용으로 표시 */}
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
      // file 타입 또는 external URL 처리
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

    // 지원하지 않는 블록 타입은 렌더링 생략
    default:
      return null;
  }
}

interface NotionModalProps {
  /** 열람할 Notion 페이지 URL */
  pageUrl: string;
  /** 모달 헤더에 표시할 제목 */
  pageTitle: string;
  /** 모달 닫기 콜백 */
  onClose: () => void;
}

export function NotionModal({
  pageUrl,
  pageTitle,
  onClose,
}: NotionModalProps) {
  const [blocks, setBlocks] = useState<NotionBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL에서 페이지 ID 추출
  const pageId = extractPageIdFromUrl(pageUrl);

  // 페이지 블록 데이터 로딩
  useEffect(() => {
    if (!pageId) {
      setError("올바르지 않은 페이지 URL입니다.");
      setIsLoading(false);
      return;
    }

    async function fetchBlocks() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/notion/${pageId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unknown error");
        setBlocks(data.blocks as NotionBlock[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "페이지를 불러오지 못했습니다. Notion 통합 설정을 확인해주세요."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlocks();
  }, [pageId]);

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
      aria-label={pageTitle}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      // 배경 클릭으로 모달 닫기
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-full max-h-[80vh] w-full max-w-3xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* 헤더: 제목 + Notion 열기 링크 + 닫기 버튼 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
            {pageTitle}
          </h2>
          <div className="flex items-center gap-2">
            <a
              href={pageUrl}
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

        {/* 본문: 블록 렌더링 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400 dark:text-zinc-500">
                불러오는 중...
              </span>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="flex items-center justify-center py-16 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* 빈 페이지 */}
          {!isLoading && !error && blocks.length === 0 && (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400 dark:text-zinc-500">
              내용이 없습니다.
            </div>
          )}

          {/* 블록 목록 렌더링 */}
          {!isLoading && !error && blocks.length > 0 && (
            <div>
              {blocks.map((block) => (
                <NotionBlockRenderer key={block.id} block={block} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
