/**
 * Notion 페이지 블록 조회 API Route
 * GET /api/notion/[pageId] → Notion API에서 블록 목록을 가져와 반환한다.
 */

import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// 서버 사이드에서만 사용되는 Notion 클라이언트
const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  // Next.js 15+ 에서 params는 Promise
  const { pageId } = await params;

  try {
    // Notion API에서 페이지의 블록 목록을 최대 100개 가져온다
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    return NextResponse.json({ blocks: response.results });
  } catch (error) {
    // 403: 통합 미공유, 404: 페이지 없음 등
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `페이지를 불러오지 못했습니다: ${message}` },
      { status: 500 }
    );
  }
}
