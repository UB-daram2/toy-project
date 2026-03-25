"use client";

/**
 * Notion 블록 타입 정의 및 렌더러
 * NotionModal에서 분리된 블록 렌더링 전담 모듈이다.
 * rich_text 변환, 블록 타입별 JSX 생성, 서브페이지 내비게이션을 처리한다.
 */

import { ChevronRight, Download, FileText } from "lucide-react";

/** Notion Rich Text 항목 타입 */
export interface RichTextItem {
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
export interface NotionBlock {
  id: string;
  type: string;
  // 블록 타입별 데이터는 타입 단언으로 접근
  [key: string]: unknown;
}

/** 모달 내비게이션 항목 */
export interface PageEntry {
  url: string;
  title: string;
}

/**
 * Rich Text 배열을 스타일이 적용된 React 노드로 변환한다.
 */
export function renderRichText(richTexts: RichTextItem[]): React.ReactNode {
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
export function NotionBlockRenderer({
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

    /* istanbul ignore next -- TYPE_MAP 값은 모두 case에서 처리되므로 도달 불가 */
    default:
      return null;
  }
}
