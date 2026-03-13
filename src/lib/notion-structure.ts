/**
 * Notion 기술지원 최상위 페이지에서 지식베이스 구조를 동적으로 가져오는 서버사이드 유틸리티.
 * loadPageChunk API(비공개 API, 인증 불필요)를 사용하여 공개 페이지 구조를 파싱한다.
 *
 * Notion 계층 구조:
 *   기술지원 (루트)
 *     └─ 처리방법이 궁금해요 (섹션 페이지, type: "page")
 *          └─ 유팜시스템 (카테고리 페이지, type: "page")
 *               └─ 처방조제, VAN Plus, ... (링크 페이지, type: "page")
 */

import type {
  KnowledgeSection,
  KnowledgeCategory,
  KnowledgeLink,
} from "@/data/knowledge-base";

/** 기술지원 최상위 Notion 페이지 ID */
const ROOT_PAGE_ID = "40e1f915cdf083b1a12c81d925ccecca";

/** 섹션 제목별 UI 설정 (아이콘, 색상, 설명) */
const SECTION_UI_CONFIG: Record<
  string,
  { icon: string; colorKey: "blue" | "violet" | "emerald"; description: string }
> = {
  "처리방법이 궁금해요": {
    icon: "BookOpen",
    colorKey: "blue",
    description: "유팜시스템 기능별 처리 방법 안내",
  },
  "사용방법이 궁금해요": {
    icon: "HelpCircle",
    colorKey: "violet",
    description: "제품별 사용방법 가이드",
  },
  "파일이 필요해요": {
    icon: "Download",
    colorKey: "emerald",
    description: "제품별 설치 파일 및 관련 자료 다운로드",
  },
};

/** UUID 형식의 ID에서 하이픈을 제거하여 32자리 ID로 변환 */
function stripHyphens(id: string): string {
  return id.replace(/-/g, "");
}

/** 32자리 ID를 UUID 형식으로 변환 */
function formatPageId(pageId: string): string {
  if (pageId.includes("-")) return pageId;
  return `${pageId.slice(0, 8)}-${pageId.slice(8, 12)}-${pageId.slice(12, 16)}-${pageId.slice(16, 20)}-${pageId.slice(20)}`;
}

/** Notion 내부 API(loadPageChunk)로 페이지 블록 맵을 가져온다 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchBlockMap(pageId: string): Promise<Record<string, any>> {
  const formattedId = formatPageId(pageId);
  try {
    const res = await fetch("https://www.notion.so/api/v3/loadPageChunk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: formattedId,
        limit: 100,
        cursor: { stack: [] },
        chunkNumber: 0,
        verticalColumns: false,
      }),
      // 항상 최신 Notion 데이터를 가져온다
      cache: "no-store",
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.recordMap?.block ?? {};
  } catch {
    return {};
  }
}

/** 블록의 properties.title 배열에서 텍스트 내용을 추출한다 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTitle(blockValue: any): string {
  return (blockValue?.properties?.title ?? [])
    .map((segment: unknown[]) => (segment[0] as string) ?? "")
    .join("");
}

/**
 * 카테고리 페이지(예: 유팜시스템)에서 링크 목록을 가져온다.
 * 카테고리 페이지의 자식 블록 중 type: "page" 인 것을 링크로 수집한다.
 */
async function fetchCategoryLinks(
  categoryPageId: string
): Promise<KnowledgeLink[]> {
  const blockMap = await fetchBlockMap(categoryPageId);
  const formattedId = formatPageId(categoryPageId);
  const pageBlock = blockMap[formattedId]?.value;
  if (!pageBlock) return [];

  const contentIds: string[] = pageBlock.content ?? [];

  return contentIds
    .map((id) => {
      const block = blockMap[id]?.value;
      // 서브페이지 타입만 링크로 수집한다
      if (!block || block.type !== "page") return null;
      const linkId = stripHyphens(id);
      const entry: KnowledgeLink = {
        id: `${linkId}-link`,
        title: extractTitle(block),
        url: `https://www.notion.so/${linkId}`,
        // Notion 블록의 마지막 수정 시각 (Unix ms) — 최근 수정 위젯에서 사용
        lastEditedTime: block.last_edited_time as number | undefined,
      };
      return entry;
    })
    .filter((link): link is KnowledgeLink => link !== null);
}

/**
 * 섹션 페이지를 파싱하여 카테고리 그룹과 링크 목록을 반환한다.
 * 섹션 페이지의 자식 page 블록이 각 카테고리가 되며,
 * 각 카테고리 페이지의 하위 page 블록들이 링크가 된다.
 */
async function parseSectionCategories(
  sectionPageId: string
): Promise<KnowledgeCategory[]> {
  const blockMap = await fetchBlockMap(sectionPageId);
  const formattedId = formatPageId(sectionPageId);
  const pageBlock = blockMap[formattedId]?.value;
  if (!pageBlock) return [];

  const contentIds: string[] = pageBlock.content ?? [];

  // 섹션 페이지의 직접 자식 중 page 타입 블록을 카테고리로 수집
  const categoryBlocks = contentIds
    .map((id) => blockMap[id]?.value)
    .filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (block): block is Record<string, any> => block?.type === "page"
    );

  // 각 카테고리 페이지의 링크를 병렬로 가져온다
  const categories = await Promise.all(
    categoryBlocks.map(async (categoryBlock) => {
      const categoryId = categoryBlock.id as string;
      const categoryTitle = extractTitle(categoryBlock);
      const links = await fetchCategoryLinks(categoryId);
      return {
        id: stripHyphens(categoryId),
        title: categoryTitle,
        links,
      } satisfies KnowledgeCategory;
    })
  );

  // 링크가 없는 카테고리는 제외한다
  return categories.filter((c) => c.links.length > 0);
}

/**
 * 기술지원 최상위 페이지에서 전체 지식베이스 구조를 동적으로 가져온다.
 * 섹션 서브페이지를 병렬 조회하여 KnowledgeSection[] 형식으로 반환한다.
 * 조회 실패 시 빈 배열을 반환하며, 호출자가 정적 데이터로 폴백해야 한다.
 */
export async function fetchKnowledgeStructure(): Promise<KnowledgeSection[]> {
  // 최상위 페이지 블록 맵 가져오기
  const rootBlockMap = await fetchBlockMap(ROOT_PAGE_ID);
  const formattedRootId = formatPageId(ROOT_PAGE_ID);
  const rootBlock = rootBlockMap[formattedRootId]?.value;
  if (!rootBlock) return [];

  const contentIds: string[] = rootBlock.content ?? [];

  // 최상위 페이지의 직접 자식 블록에서 섹션 페이지를 찾아 설정과 매핑
  const sectionTasks = contentIds
    .map((id) => {
      const block = rootBlockMap[id]?.value;
      if (!block || block.type !== "page") return null;
      const title = extractTitle(block);
      const config = SECTION_UI_CONFIG[title];
      if (!config) return null;
      return { id, title, config };
    })
    .filter(
      (
        task
      ): task is {
        id: string;
        title: string;
        config: (typeof SECTION_UI_CONFIG)[string];
      } => task !== null
    );

  // 각 섹션의 카테고리 구조를 병렬로 가져온다
  const sectionResults = await Promise.all(
    sectionTasks.map(async ({ id, title, config }) => {
      const categories = await parseSectionCategories(id);
      return {
        id: stripHyphens(id),
        title,
        ...config,
        categories,
      } satisfies KnowledgeSection;
    })
  );

  return sectionResults;
}
