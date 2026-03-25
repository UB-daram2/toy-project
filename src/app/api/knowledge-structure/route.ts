/**
 * 지식베이스 구조 API 엔드포인트
 * Notion 최상위 페이지에서 섹션·카테고리·링크 구조를 서버에서 파싱해 클라이언트에 제공한다.
 * 클라이언트(useKnowledgeStructure 훅)는 이 엔드포인트를 통해 Notion 구조를 수신한다.
 */

import { NextResponse } from "next/server";
import { fetchKnowledgeStructure } from "@/lib/notion-structure";
import { CACHE, errorBody } from "@/lib/api-response";

export async function GET() {
  const sections = await fetchKnowledgeStructure();

  if (sections.length === 0) {
    return NextResponse.json(errorBody("지식베이스를 불러올 수 없습니다"), {
      status: 503,
    });
  }

  return NextResponse.json(sections, {
    headers: { "Cache-Control": CACHE.MEDIUM },
  });
}
