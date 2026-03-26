/**
 * Notion 내부 API 응답(loadPageChunk)을 공식 API 형식으로 변환하는 유틸리티
 * /api/notion/[pageId]/route.ts 에서 분리된 순수 변환 로직이다.
 */

/** 32자리 ID를 UUID 형식으로 변환 (하이픈 삽입) */
export function formatPageId(pageId: string): string {
  if (pageId.includes("-")) return pageId;
  return `${pageId.slice(0, 8)}-${pageId.slice(8, 12)}-${pageId.slice(12, 16)}-${pageId.slice(16, 20)}-${pageId.slice(20)}`;
}

/** Notion 내부 세그먼트: [텍스트, 장식 배열?] */
export type NotionSegment = [string, ([string, string?])[]?];

/** Notion 내부 블록 속성 (loadPageChunk 응답) */
export interface NotionBlockValue {
  type: string;
  properties?: {
    title?: NotionSegment[];
    checked?: NotionSegment[];
    source?: NotionSegment[];
    language?: NotionSegment[];
    size?: NotionSegment[];
  };
  format?: {
    display_source?: string;
    page_icon?: string;
  };
  content?: string[];
}

/** 공식 Notion API 형식으로 변환된 블록 */
export interface ConvertedBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

/** Notion 내부 블록 타입 → 공식 API 블록 타입 매핑 */
export const TYPE_MAP: Record<string, string> = {
  text: "paragraph",
  header: "heading_1",
  sub_header: "heading_2",
  sub_sub_header: "heading_3",
  bulleted_list: "bulleted_list_item",
  numbered_list: "numbered_list_item",
  to_do: "to_do",
  divider: "divider",
  quote: "quote",
  code: "code",
  callout: "callout",
  image: "image",
  // 파일 첨부 블록 → 다운로드 카드로 변환 (signed URL 별도 획득 필요)
  file: "file",
  // 서브페이지 참조 블록 → 클릭 가능한 내비게이션 링크로 변환
  page: "child_page",
  // 토글 블록 → 제목만 표시
  toggle: "toggle",
};

/** Notion 내부 Rich Text 세그먼트를 공식 API Rich Text 형식으로 변환 */
export function convertRichText(segments: NotionSegment[] | undefined): {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  };
}[] {
  if (!segments) return [];
  return segments.map((segment) => {
    const text: string = segment[0] ?? "";
    const decorations: [string, string?][] = segment[1] ?? [];
    const annotations = {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
    };
    let href: string | null = null;
    for (const deco of decorations) {
      switch (deco[0]) {
        case "b": annotations.bold = true; break;
        case "i": annotations.italic = true; break;
        case "s": annotations.strikethrough = true; break;
        case "_": annotations.underline = true; break;
        case "c": annotations.code = true; break;
        case "a": href = deco[1] ?? null; break;
      }
    }
    return { plain_text: text, href, annotations };
  });
}

/** 내부 블록 값을 공식 API 형식으로 변환 */
export function convertBlock(id: string, blockValue: NotionBlockValue): ConvertedBlock | null {
  const internalType: string = blockValue.type;
  const officialType = TYPE_MAP[internalType];
  // 지원하지 않는 블록 타입은 null 반환
  if (!officialType) return null;

  const properties = blockValue.properties;
  const format = blockValue.format;
  const richText = convertRichText(properties?.title);

  const block: ConvertedBlock = { id, type: officialType };

  switch (officialType) {
    case "paragraph":
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "bulleted_list_item":
    case "numbered_list_item":
    case "quote":
    case "toggle":
      block[officialType] = { rich_text: richText };
      break;
    case "to_do":
      // 내부 API에서 checked 상태는 properties.checked = [["Yes"]] 형식
      block[officialType] = {
        rich_text: richText,
        checked: properties?.checked?.[0]?.[0] === "Yes",
      };
      break;
    case "divider":
      block[officialType] = {};
      break;
    case "code":
      block[officialType] = {
        rich_text: richText,
        language: properties?.language?.[0]?.[0] ?? "plain text",
      };
      break;
    case "callout":
      block[officialType] = {
        rich_text: richText,
        icon: format?.page_icon ? { emoji: format.page_icon } : undefined,
      };
      break;
    case "image": {
      // display_source 또는 properties.source에서 이미지 URL을 추출한다
      const imageUrl = format?.display_source ?? properties?.source?.[0]?.[0] ?? "";
      // Notion 업로드 이미지(S3 URL, attachment: 프로토콜)는 인증이 필요하므로 signed URL로 교체해야 한다
      const needsSigning = imageUrl.includes("secure.s3") || imageUrl.includes("s3.amazonaws.com") || imageUrl.startsWith("attachment:");
      if (!imageUrl) {
        block[officialType] = {};
      } else if (needsSigning) {
        // source 필드를 보존하여 route handler에서 signed URL로 교체한다
        block[officialType] = { type: "file", file: { url: imageUrl }, source: imageUrl };
      } else {
        block[officialType] = { type: "external", external: { url: imageUrl } };
      }
      break;
    }
    case "file":
      // 파일 첨부 블록 → 파일명·크기·source 저장 (route handler에서 signed URL로 교체)
      block[officialType] = {
        name: properties?.title?.[0]?.[0] ?? "파일",
        size: properties?.size?.[0]?.[0] ?? null,
        source: properties?.source?.[0]?.[0] ?? null,
        url: null as string | null,
      };
      break;
    case "child_page":
      // 서브페이지 블록 → 모달 내 내비게이션 링크로 사용할 URL 포함
      block[officialType] = {
        rich_text: richText,
        url: `https://www.notion.so/${id.replace(/-/g, "")}`,
      };
      break;
    /* istanbul ignore next -- TYPE_MAP 값은 모두 case에서 처리되므로 도달 불가 */
    default:
      return null;
  }

  return block;
}
