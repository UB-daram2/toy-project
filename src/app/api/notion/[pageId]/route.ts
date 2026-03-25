/**
 * Notion 페이지 블록 조회 API Route
 * GET /api/notion/[pageId] → Notion 공개 API로 페이지 블록을 가져와 공식 형식으로 변환해 반환한다.
 * 인증 없이 공개된 페이지에 접근하기 위해 notion.so/api/v3/loadPageChunk를 사용한다.
 */

import { NextResponse } from "next/server";
import { CACHE, errorBody, HTTP_STATUS } from "@/lib/api-response";
import {
  formatPageId,
  convertBlock,
  type NotionBlockValue,
  type ConvertedBlock,
} from "@/lib/notion-converter";

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
        errorBody(`Notion API 오류: ${response.status}`),
        { status: HTTP_STATUS.BAD_GATEWAY }
      );
    }

    const data = await response.json();
    const blockMap = data.recordMap?.block ?? {};

    // 페이지 블록에서 자식 블록 ID 목록 추출
    const pageBlock = blockMap[formattedId]?.value;
    const contentIds: string[] = pageBlock?.content ?? [];

    // 자식 블록을 공식 API 형식으로 변환 (지원하지 않는 타입은 제외)
    const blocks = (
      contentIds
        .map((id) => {
          const blockValue = blockMap[id]?.value as NotionBlockValue | undefined;
          return blockValue ? convertBlock(id, blockValue) : null;
        })
        .filter(Boolean) as ConvertedBlock[]
    );

    // 파일 블록의 attachment URL → Notion signed URL로 교체 (직접 다운로드 가능하도록)
    const fileBlocks = blocks.filter(
      (b) => b.type === "file" && (b.file as { source?: string })?.source
    );
    if (fileBlocks.length > 0) {
      try {
        const signedRes = await fetch("https://www.notion.so/api/v3/getSignedFileUrls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            urls: fileBlocks.map((b) => ({
              url: (b.file as { source: string }).source,
              permissionRecord: { table: "block", id: b.id },
            })),
          }),
        });
        if (signedRes.ok) {
          const { signedUrls } = await signedRes.json() as { signedUrls: string[] };
          fileBlocks.forEach((b, i) => {
            const fd = b.file as { url: string | null; source?: string };
            fd.url = signedUrls[i] ?? null;
            delete fd.source;
          });
        }
      } catch {
        // signed URL 획득 실패 시 url: null 유지 → 모달에서 Notion 링크로 안내
      }
      // 성공 여부와 무관하게 source 필드는 클라이언트에 노출하지 않음
      fileBlocks.forEach((b) => {
        delete (b.file as { source?: string }).source;
      });
    }

    // Notion 페이지 콘텐츠는 느리게 변하므로 MEDIUM 캐시 프리셋 사용
    return NextResponse.json({ blocks }, {
      headers: { "Cache-Control": CACHE.MEDIUM },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      errorBody(`페이지를 불러오지 못했습니다: ${message}`),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
