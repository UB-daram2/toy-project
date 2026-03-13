/**
 * Notion 페이지 블록 조회 API Route
 * GET /api/notion/[pageId] → Notion 공개 API로 페이지 블록을 가져와 공식 형식으로 변환해 반환한다.
 * 인증 없이 공개된 페이지에 접근하기 위해 notion.so/api/v3/loadPageChunk를 사용한다.
 */

import { NextResponse } from "next/server";

/** 32자리 ID를 UUID 형식으로 변환 (하이픈 삽입) */
function formatPageId(pageId: string): string {
  if (pageId.includes("-")) return pageId;
  return `${pageId.slice(0, 8)}-${pageId.slice(8, 12)}-${pageId.slice(12, 16)}-${pageId.slice(16, 20)}-${pageId.slice(20)}`;
}

/** Notion 내부 Rich Text 세그먼트를 공식 API Rich Text 형식으로 변환 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertRichText(segments: any[][] | undefined): {
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

/** Notion 내부 블록 타입 → 공식 API 블록 타입 매핑 */
const TYPE_MAP: Record<string, string> = {
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
  // 서브페이지 참조 블록 → 클릭 가능한 내비게이션 링크로 변환
  page: "child_page",
  // 토글 블록 → 제목만 표시
  toggle: "toggle",
};

/** 내부 블록 값을 공식 API 형식으로 변환 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertBlock(id: string, blockValue: any): Record<string, any> | null {
  const internalType: string = blockValue.type;
  const officialType = TYPE_MAP[internalType];
  // 지원하지 않는 블록 타입은 null 반환
  if (!officialType) return null;

  const properties = blockValue.properties ?? {};
  const format = blockValue.format ?? {};
  const richText = convertRichText(properties.title);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const block: Record<string, any> = { id, type: officialType };

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
        checked: properties.checked?.[0]?.[0] === "Yes",
      };
      break;
    case "divider":
      block[officialType] = {};
      break;
    case "code":
      block[officialType] = {
        rich_text: richText,
        language: properties.language?.[0]?.[0] ?? "plain text",
      };
      break;
    case "callout":
      block[officialType] = {
        rich_text: richText,
        icon: format.page_icon ? { emoji: format.page_icon } : undefined,
      };
      break;
    case "image": {
      // display_source(외부 이미지) 또는 source(업로드 이미지)에서 URL 추출
      const imageUrl: string =
        format.display_source ?? properties.source?.[0]?.[0] ?? "";
      block[officialType] = imageUrl
        ? format.display_source
          ? { external: { url: imageUrl } }
          : { file: { url: imageUrl } }
        : {};
      break;
    }
    case "child_page":
      // 서브페이지 블록 → 모달 내 내비게이션 링크로 사용할 URL 포함
      block[officialType] = {
        rich_text: richText,
        url: `https://www.notion.so/${id.replace(/-/g, "")}`,
      };
      break;
    default:
      return null;
  }

  return block;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;

  try {
    const formattedId = formatPageId(pageId);

    // 인증 없이 공개 페이지 블록을 조회하는 Notion 내부 API 호출
    const response = await fetch("https://www.notion.so/api/v3/loadPageChunk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: formattedId,
        limit: 100,
        cursor: { stack: [] },
        chunkNumber: 0,
        verticalColumns: false,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Notion API 오류: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const blockMap = data.recordMap?.block ?? {};

    // 페이지 블록에서 자식 블록 ID 목록 추출
    const pageBlock = blockMap[formattedId]?.value;
    const contentIds: string[] = pageBlock?.content ?? [];

    // 자식 블록을 공식 API 형식으로 변환 (지원하지 않는 타입은 제외)
    const blocks = contentIds
      .map((id) => {
        const blockValue = blockMap[id]?.value;
        return blockValue ? convertBlock(id, blockValue) : null;
      })
      .filter(Boolean);

    return NextResponse.json({ blocks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `페이지를 불러오지 못했습니다: ${message}` },
      { status: 500 }
    );
  }
}
