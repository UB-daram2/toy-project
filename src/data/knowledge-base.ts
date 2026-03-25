/**
 * 유팜시스템 지원 포털 지식베이스 타입 정의 및 검색 유틸리티
 * 실제 데이터는 런타임에 /api/knowledge-structure 에서 동적으로 로딩한다.
 * Notion 접근 불가 시 knowledgeSections 정적 폴백으로 기본 UI를 보장한다.
 */

/** 개별 Notion 문서 링크 */
export interface KnowledgeLink {
  id: string;
  title: string;
  url: string;
  /** Notion 블록의 마지막 수정 시각 (Unix ms). 동적 로딩 시 채워진다 */
  lastEditedTime?: number;
}

/** 카테고리 그룹 (예: 유팜시스템, VAN Plus) */
export interface KnowledgeCategory {
  id: string;
  title: string;
  links: KnowledgeLink[];
}

/** 메인 섹션 (처리방법 / 사용방법 / 파일필요) */
export interface KnowledgeSection {
  id: string;
  title: string;
  description: string;
  /** Lucide 아이콘 이름 */
  icon: string;
  /** Tailwind 색상 키 (accent 용도) */
  colorKey: "blue" | "violet" | "emerald";
  categories: KnowledgeCategory[];
}

/**
 * 정적 폴백 섹션 데이터
 * Notion API 접근 불가 시 사용한다.
 * "처리방법이 궁금해요"에는 E2E 섹션 테스트용 처방조제 샘플 링크를 포함한다.
 */
export const knowledgeSections: KnowledgeSection[] = [
  {
    id: "how-to-process",
    title: "처리방법이 궁금해요",
    description: "유팜시스템 기능별 처리 방법 안내",
    icon: "BookOpen",
    colorKey: "blue",
    categories: [
      {
        id: "prescription-fallback",
        title: "처방/조제",
        links: [
          {
            id: "prescription-dispensing-fallback",
            title: "처방조제",
            url: "https://www.notion.so/40e1f915cdf083b1a12c81d925ccecca",
          },
        ],
      },
    ],
  },
  {
    id: "how-to-use",
    title: "사용방법이 궁금해요",
    description: "유팜시스템 소프트웨어 사용 방법 안내",
    icon: "HelpCircle",
    colorKey: "violet",
    categories: [],
  },
  {
    id: "need-file",
    title: "파일이 필요해요",
    description: "설치 파일 및 업데이트 파일 제공",
    icon: "Download",
    colorKey: "emerald",
    categories: [],
  },
];

/**
 * 전체 링크 수를 계산한다.
 * 섹션 > 카테고리 > 링크를 순회하여 합산한다.
 */
export function countTotalLinks(sections: KnowledgeSection[]): number {
  return sections.reduce((sectionTotal, section) => {
    const sectionLinkCount = section.categories.reduce(
      (categoryTotal, category) => categoryTotal + category.links.length,
      0
    );
    return sectionTotal + sectionLinkCount;
  }, 0);
}

/** 관련도 순위화 검색 결과 항목 */
export interface SearchResult {
  link: KnowledgeLink;
  category: KnowledgeCategory;
  section: KnowledgeSection;
  /** 관련도 점수 — 높을수록 검색어와 가까움 */
  score: number;
}

/**
 * 텍스트의 바이그램(2-gram) 집합을 반환한다.
 * 한국어 퍼지 매칭에 활용한다.
 */
function getBigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, "");
  const bigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    bigrams.add(normalized.slice(i, i + 2));
  }
  return bigrams;
}

/**
 * 두 문자열 간 바이그램 유사도(0~1)를 반환한다.
 * query의 바이그램 중 text에 포함된 비율로 계산한다.
 */
function bigramSimilarity(text: string, query: string): number {
  const queryBigrams = getBigrams(query);
  if (queryBigrams.size === 0) return 0;
  const textBigrams = getBigrams(text);
  let common = 0;
  for (const bg of queryBigrams) {
    if (textBigrams.has(bg)) common++;
  }
  return common / queryBigrams.size;
}

/**
 * 검색어와 관련도가 높은 순으로 전체 섹션을 검색하여 정렬된 결과를 반환한다.
 *
 * 점수 구성:
 *   링크 제목 정확 일치: +100
 *   링크 제목이 검색어로 시작: +80
 *   링크 제목에 검색어 포함: +60
 *   카테고리 제목에 검색어 포함: +40
 *   섹션 제목에 검색어 포함: +20
 *   바이그램 유사도 (퍼지 매칭): 0~30
 */
export function searchKnowledgeRanked(
  sections: KnowledgeSection[],
  query: string
): SearchResult[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const section of sections) {
    for (const category of section.categories) {
      for (const link of category.links) {
        const titleLower = link.title.toLowerCase();
        const catLower = category.title.toLowerCase();
        const secLower = section.title.toLowerCase();

        // 키워드 점수 계산
        let score = 0;
        if (titleLower === q) score += 100;
        else if (titleLower.startsWith(q)) score += 80;
        else if (titleLower.includes(q)) score += 60;
        if (catLower.includes(q)) score += 40;
        if (secLower.includes(q)) score += 20;

        // 바이그램 퍼지 매칭 점수 (0~30)
        score += bigramSimilarity(titleLower + catLower, q) * 30;

        if (score > 0) {
          results.push({ link, category, section, score });
        }
      }
    }
  }

  // 관련도 내림차순 정렬
  return results.sort((a, b) => b.score - a.score);
}

/**
 * 검색어로 전체 데이터를 필터링한다.
 * 섹션 제목, 카테고리 제목, 링크 제목을 대소문자 구분 없이 검색한다.
 */
export function searchKnowledge(
  sections: KnowledgeSection[],
  query: string
): KnowledgeSection[] {
  // 빈 검색어이면 전체 반환
  if (!query.trim()) return sections;

  const normalizedQuery = query.toLowerCase();

  return sections
    .map((section) => {
      // 카테고리 내 링크를 검색어로 필터링
      const matchedCategories = section.categories
        .map((category) => {
          const matchedLinks = category.links.filter(
            (link) =>
              link.title.toLowerCase().includes(normalizedQuery) ||
              category.title.toLowerCase().includes(normalizedQuery) ||
              section.title.toLowerCase().includes(normalizedQuery)
          );
          return matchedLinks.length > 0
            ? { ...category, links: matchedLinks }
            : null;
        })
        .filter((category): category is KnowledgeCategory => category !== null);

      return matchedCategories.length > 0
        ? { ...section, categories: matchedCategories }
        : null;
    })
    .filter((section): section is KnowledgeSection => section !== null);
}
