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
    const body = JSON.stringify({
      pageId: formattedId,
      limit: 100,
      cursor: { stack: [] },
      chunkNumber: 0,
      verticalColumns: false,
    });

    // 인증 없이 공개 페이지 블록을 조회하는 Notion 내부 API 호출
    // 429 레이트 리밋 시 최대 2회 재시도한다
    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch("https://www.notion.so/api/v3/loadPageChunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        next: { revalidate: 300 },
      });
      if (response.status !== 429 || attempt >= 2) break;
      await new Promise<void>((r) => setTimeout(r, 2000));
    }

    if (!response!.ok) {
      return NextResponse.json(
        errorBody(`Notion API 오류: ${response!.status}`),
        { status: HTTP_STATUS.BAD_GATEWAY }
      );
    }

    const data = await response!.json();
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

    // 파일·이미지 블록의 Notion 업로드 URL → signed URL로 교체
    // (S3 URL은 인증 없이 접근 불가하므로 signed URL이 필요하다)
    type SourceBlock = { source?: string; url?: string | null };
    const blocksNeedingSigning = blocks.filter((b) => {
      if (b.type === "file") return !!(b.file as SourceBlock)?.source;
      if (b.type === "image") return !!(b.image as SourceBlock)?.source;
      return false;
    });

    if (blocksNeedingSigning.length > 0) {
      try {
        const signedRes = await fetch("https://www.notion.so/api/v3/getSignedFileUrls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            urls: blocksNeedingSigning.map((b) => {
              const data = (b.type === "file" ? b.file : b.image) as SourceBlock;
              return { url: data.source, permissionRecord: { table: "block", id: b.id } };
            }),
          }),
        });
        if (signedRes.ok) {
          const { signedUrls } = await signedRes.json() as { signedUrls: string[] };
          blocksNeedingSigning.forEach((b, i) => {
            const data = (b.type === "file" ? b.file : b.image) as SourceBlock;
            if (b.type === "image" && (b.image as { file?: { url: string } })?.file) {
              // 이미지 블록: file.url을 signed URL로 교체
              (b.image as { file: { url: string } }).file.url = signedUrls[i] ?? data.source ?? "";
            } else {
              // 파일 블록: url을 signed URL로 교체
              data.url = signedUrls[i] ?? null;
            }
          });
        }
      } catch {
        // signed URL 획득 실패 시 원본 URL 유지 → 모달에서 Notion 링크로 안내
      }
      // source 필드는 클라이언트에 노출하지 않음
      blocksNeedingSigning.forEach((b) => {
        const data = (b.type === "file" ? b.file : b.image) as SourceBlock;
        delete data.source;
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
