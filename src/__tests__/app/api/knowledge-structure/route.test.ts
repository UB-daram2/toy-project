/**
 * @jest-environment node
 *
 * GET /api/knowledge-structure 테스트
 * - Notion 구조 조회 성공: 200 + KnowledgeSection[] 반환
 * - Notion 조회 실패(빈 배열): 503 반환
 * - Cache-Control: MEDIUM 헤더 포함
 */

import { GET } from "@/app/api/knowledge-structure/route";

// fetchKnowledgeStructure 모킹
jest.mock("@/lib/notion-structure", () => ({
  fetchKnowledgeStructure: jest.fn(),
}));

import { fetchKnowledgeStructure } from "@/lib/notion-structure";

const mockSections = [
  {
    id: "how-to-process",
    title: "처리방법이 궁금해요",
    description: "안내",
    icon: "BookOpen",
    colorKey: "blue",
    categories: [
      {
        id: "upharm-system",
        title: "유팜시스템",
        links: [{ id: "link-1", title: "처방조제", url: "https://u-pham.notion.site/xxx" }],
      },
    ],
  },
];

describe("GET /api/knowledge-structure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Notion 조회 성공 시 200과 섹션 목록을 반환한다", async () => {
    (fetchKnowledgeStructure as jest.Mock).mockResolvedValue(mockSections);

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockSections);
  });

  it("성공 응답에 Cache-Control MEDIUM 헤더가 포함된다", async () => {
    (fetchKnowledgeStructure as jest.Mock).mockResolvedValue(mockSections);

    const response = await GET();

    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
  });

  it("Notion 조회 결과가 빈 배열이면 503을 반환한다", async () => {
    (fetchKnowledgeStructure as jest.Mock).mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });
});
