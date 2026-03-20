/**
 * knowledge-base.ts 데이터 함수 테스트
 */

import {
  knowledgeSections,
  countTotalLinks,
  searchKnowledge,
  searchKnowledgeRanked,
  KnowledgeSection,
} from "@/data/knowledge-base";

/** 테스트용 샘플 섹션 데이터 */
const sampleSections: KnowledgeSection[] = [
  {
    id: "section-a",
    title: "섹션 A",
    description: "테스트 섹션 A",
    icon: "BookOpen",
    colorKey: "blue",
    categories: [
      {
        id: "cat-1",
        title: "카테고리 1",
        links: [
          { id: "link-1", title: "처방조제", url: "https://notion.so/1" },
          { id: "link-2", title: "보험청구", url: "https://notion.so/2" },
        ],
      },
      {
        id: "cat-2",
        title: "카테고리 2",
        links: [
          { id: "link-3", title: "재고관리", url: "https://notion.so/3" },
        ],
      },
    ],
  },
  {
    id: "section-b",
    title: "섹션 B",
    description: "테스트 섹션 B",
    icon: "HelpCircle",
    colorKey: "violet",
    categories: [
      {
        id: "cat-3",
        title: "VAN Plus",
        links: [
          { id: "link-4", title: "VAN Plus 사용법", url: "https://notion.so/4" },
        ],
      },
    ],
  },
];

describe("countTotalLinks (전체 링크 수 계산)", () => {
  it("모든 섹션의 링크 수를 합산해서 반환한다", () => {
    expect(countTotalLinks(sampleSections)).toBe(4);
  });

  it("빈 섹션 배열에 대해 0을 반환한다", () => {
    expect(countTotalLinks([])).toBe(0);
  });

  it("링크가 없는 카테고리가 있어도 올바르게 합산한다", () => {
    const sectionsWithEmptyCategory: KnowledgeSection[] = [
      {
        id: "s1",
        title: "S1",
        description: "",
        icon: "BookOpen",
        colorKey: "blue",
        categories: [
          { id: "c1", title: "빈 카테고리", links: [] },
          {
            id: "c2",
            title: "카테고리",
            links: [{ id: "l1", title: "링크", url: "https://notion.so/x" }],
          },
        ],
      },
    ];
    expect(countTotalLinks(sectionsWithEmptyCategory)).toBe(1);
  });
});

describe("searchKnowledge (지식베이스 검색)", () => {
  it("빈 검색어이면 전체 섹션을 그대로 반환한다", () => {
    expect(searchKnowledge(sampleSections, "")).toEqual(sampleSections);
    expect(searchKnowledge(sampleSections, "   ")).toEqual(sampleSections);
  });

  it("링크 제목에 검색어가 포함된 항목을 반환한다", () => {
    const results = searchKnowledge(sampleSections, "처방조제");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("section-a");
    expect(results[0].categories[0].links).toHaveLength(1);
    expect(results[0].categories[0].links[0].title).toBe("처방조제");
  });

  it("카테고리 제목에 검색어가 포함된 경우 해당 카테고리의 모든 링크를 반환한다", () => {
    const results = searchKnowledge(sampleSections, "VAN Plus");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("section-b");
  });

  it("대소문자를 구분하지 않고 검색한다", () => {
    const results = searchKnowledge(sampleSections, "van plus");
    expect(results).toHaveLength(1);
  });

  it("검색어에 일치하는 항목이 없으면 빈 배열을 반환한다", () => {
    const results = searchKnowledge(sampleSections, "존재하지않는검색어xyz");
    expect(results).toHaveLength(0);
  });

  it("섹션 제목이 일치하면 해당 섹션 전체를 반환한다", () => {
    const results = searchKnowledge(sampleSections, "섹션 A");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("section-a");
  });
});

describe("searchKnowledgeRanked (관련도 순위화 검색)", () => {
  it("빈 검색어이면 빈 배열을 반환한다", () => {
    expect(searchKnowledgeRanked(sampleSections, "")).toHaveLength(0);
    expect(searchKnowledgeRanked(sampleSections, "   ")).toHaveLength(0);
  });

  it("관련 없는 검색어이면 빈 배열을 반환한다", () => {
    expect(searchKnowledgeRanked(sampleSections, "존재하지않는검색어xyz")).toHaveLength(0);
  });

  it("정확 일치 결과가 부분 일치보다 높은 점수를 가진다", () => {
    const results = searchKnowledgeRanked(sampleSections, "처방조제");
    expect(results.length).toBeGreaterThan(0);
    // 정확 일치("처방조제")가 첫 번째 결과여야 한다
    expect(results[0].link.title).toBe("처방조제");
    expect(results[0].score).toBeGreaterThanOrEqual(100);
  });

  it("결과가 점수 내림차순으로 정렬된다", () => {
    const results = searchKnowledgeRanked(sampleSections, "카테고리");
    // 모든 연속된 쌍에서 앞 항목 점수 >= 뒤 항목 점수
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  it("각 결과에 link, category, section, score 필드가 있다", () => {
    const results = searchKnowledgeRanked(sampleSections, "처방조제");
    expect(results[0]).toHaveProperty("link");
    expect(results[0]).toHaveProperty("category");
    expect(results[0]).toHaveProperty("section");
    expect(results[0]).toHaveProperty("score");
  });

  it("카테고리 제목 일치도 결과에 포함된다", () => {
    const results = searchKnowledgeRanked(sampleSections, "VAN Plus");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].link.title).toBe("VAN Plus 사용법");
  });

  it("바이그램 유사도로 부분 일치 단어도 탐지한다", () => {
    // "처방" 검색 시 "처방조제", "보험청구"는 아니지만 "처방조제"가 포함
    const results = searchKnowledgeRanked(sampleSections, "처방");
    const titles = results.map((r) => r.link.title);
    expect(titles).toContain("처방조제");
  });
});

describe("knowledgeSections (실제 데이터 유효성)", () => {
  it("세 개의 메인 섹션이 있다", () => {
    expect(knowledgeSections).toHaveLength(3);
  });

  it("각 섹션은 id, title, description, icon, colorKey, categories를 가진다", () => {
    knowledgeSections.forEach((section) => {
      expect(section).toHaveProperty("id");
      expect(section).toHaveProperty("title");
      expect(section).toHaveProperty("description");
      expect(section).toHaveProperty("icon");
      expect(section).toHaveProperty("colorKey");
      expect(section).toHaveProperty("categories");
    });
  });

  it("모든 링크는 유효한 URL 형식을 가진다", () => {
    knowledgeSections.forEach((section) => {
      section.categories.forEach((category) => {
        category.links.forEach((link) => {
          expect(link.url).toMatch(/^https?:\/\//);
        });
      });
    });
  });

  it("처리방법 섹션은 최소 20개 이상의 링크를 가진다", () => {
    const processSection = knowledgeSections.find((s) => s.id === "how-to-process");
    expect(processSection).toBeDefined();
    const totalLinks = processSection!.categories.reduce(
      (sum, cat) => sum + cat.links.length,
      0
    );
    expect(totalLinks).toBeGreaterThanOrEqual(20);
  });
});
