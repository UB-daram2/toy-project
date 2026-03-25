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

/** 한 번의 loadPageChunk 요청으로 가져올 최대 블록 수.
 *  100으로 설정 시 DFS 순서로 카테고리 직접 자식만 blockMap에 포함되어
 *  링크 레벨 페이지가 섹션 blockMap에서 자연스럽게 제외된다.
 *  섹션의 링크 레벨 직접 자식(처방조제 등)은 카테고리 하위 트리를 모두 순회한 뒤에야
 *  blockMap에 들어오므로, 100 블록 한도 내에서 카테고리 레벨만 처리된다. */
const BLOCK_FETCH_LIMIT = 100;

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

/** loadPageChunk 응답의 recordMap.block 개별 항목 */
interface NotionRawBlockValue {
  id: string;
  type: string;
  content?: string[];
  last_edited_time?: number;
  properties?: Record<string, unknown[][]>;
  format?: Record<string, unknown>;
}

interface NotionRawBlock {
  value: NotionRawBlockValue;
}

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
async function fetchBlockMap(pageId: string): Promise<Record<string, NotionRawBlock>> {
  const formattedId = formatPageId(pageId);
  try {
    const res = await fetch("https://www.notion.so/api/v3/loadPageChunk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: formattedId,
        limit: BLOCK_FETCH_LIMIT,
        cursor: { stack: [] },
        chunkNumber: 0,
        verticalColumns: false,
      }),
      // 항상 최신 Notion 데이터를 가져온다
      cache: "no-store",
    });
    if (!res.ok) return {};
    const data = await res.json();
    return (data.recordMap?.block ?? {}) as Record<string, NotionRawBlock>;
  } catch {
    return {};
  }
}

/** 블록의 properties.title 배열에서 텍스트 내용을 추출한다 */
function extractTitle(blockValue: NotionRawBlockValue | undefined): string {
  return (blockValue?.properties?.title ?? [])
    .map((segment) => (segment[0] as string) ?? "")
    .join("");
}

/**
 * 카테고리 페이지(예: 유팜시스템)를 직접 조회하여 제목과 링크 목록을 반환한다.
 * 섹션 blockMap에 카테고리 블록이 없는 경우를 대비해 항상 독립적으로 fetch한다.
 */
async function fetchCategoryData(
  categoryPageId: string
): Promise<{ title: string; links: KnowledgeLink[] } | null> {
  const blockMap = await fetchBlockMap(categoryPageId);
  const formattedId = formatPageId(categoryPageId);
  const pageBlock = blockMap[formattedId]?.value;
  // page 타입이 아니면 카테고리가 아니다
  if (!pageBlock || pageBlock.type !== "page") return null;

  const title = extractTitle(pageBlock);
  const contentIds: string[] = pageBlock.content ?? [];

  const links = contentIds
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

  return { title, links };
}

/**
 * 섹션 페이지를 파싱하여 카테고리 그룹과 링크 목록을 반환한다.
 *
 * BLOCK_FETCH_LIMIT=100으로 가져온 섹션 blockMap에는 DFS 순서상 카테고리 레벨 블록만
 * 포함된다. 섹션의 링크 레벨 직접 자식(카테고리 아닌 페이지)은 카테고리 하위 트리 순회
 * 이후에 등장하므로 100 블록 한도를 초과해 blockMap에서 제외된다.
 * blockMap 기반 필터링으로 이 특성을 이용해 카테고리 레벨만 정확히 처리한다.
 */
async function parseSectionCategories(
  sectionPageId: string
): Promise<KnowledgeCategory[]> {
  const blockMap = await fetchBlockMap(sectionPageId);
  const formattedId = formatPageId(sectionPageId);
  const pageBlock = blockMap[formattedId]?.value;
  if (!pageBlock) return [];

  const contentIds: string[] = pageBlock.content ?? [];

  // 섹션 페이지의 직접 자식 중 blockMap에 있는 page 타입 블록을 카테고리로 수집한다.
  // blockMap에 없는 ID(링크 레벨 직접 자식)는 undefined → 필터링 제외된다.
  const categoryBlocks = contentIds
    .map((id) => blockMap[id]?.value)
    .filter(
      (block): block is NotionRawBlockValue =>
        block !== undefined && block.type === "page"
    );

  // 카테고리를 3개씩 배치 처리한다.
  // Promise.all로 전부 동시 fetch하면 Notion이 일부 요청을 throttle해 빈 응답을 반환하므로
  // 배치로 나눠 동시 요청 수를 제한하고, 배치 간 500ms 대기로 rate limit 압력을 줄인다.
  const BATCH = 3;
  const BATCH_DELAY_MS = 500;
  const allCategories: (KnowledgeCategory | null)[] = [];

  for (let i = 0; i < categoryBlocks.length; i += BATCH) {
    // 첫 번째 배치를 제외하고 배치 간 대기하여 연속 요청으로 인한 rate limit을 방지한다
    if (i > 0) {
      await new Promise<void>((r) => setTimeout(r, BATCH_DELAY_MS));
    }
    const batch = categoryBlocks.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map(async (categoryBlock) => {
        const categoryId = categoryBlock.id;
        const categoryTitle = extractTitle(categoryBlock);

        // 빈 응답이면 500ms 후 1회 재시도한다 (rate limit 대응)
        let data = await fetchCategoryData(categoryId);
        if (!data) {
          await new Promise<void>((r) => setTimeout(r, 500));
          data = await fetchCategoryData(categoryId);
        }

        if (!data || data.links.length === 0) return null;
        return {
          id: stripHyphens(categoryId),
          title: categoryTitle,
          links: data.links,
        } satisfies KnowledgeCategory;
      })
    );
    allCategories.push(...batchResults);
  }

  return allCategories.filter((c): c is KnowledgeCategory => c !== null);
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
