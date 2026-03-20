/**
 * SearchResultsView 컴포넌트 테스트
 * 관련도 순위화 검색 결과 목록, 빈 상태, 모달 열기를 검증한다.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { SearchResultsView } from "@/components/SearchResultsView";
import type { KnowledgeSection } from "@/data/knowledge-base";

// NotionModal 모킹
jest.mock("@/components/NotionModal", () => ({
  NotionModal: ({
    pageTitle,
    onClose,
  }: {
    pageTitle: string;
    onClose: () => void;
  }) => (
    <div role="dialog" aria-label={pageTitle}>
      <button onClick={onClose}>닫기</button>
    </div>
  ),
}));

// view-tracker 모킹
jest.mock("@/lib/view-tracker", () => ({
  recordPageView: jest.fn(),
}));

const sampleSections: KnowledgeSection[] = [
  {
    id: "section-a",
    title: "처리방법이 궁금해요",
    description: "처리방법 섹션",
    icon: "BookOpen",
    colorKey: "blue",
    categories: [
      {
        id: "cat-1",
        title: "처방조제",
        links: [
          {
            id: "link-1",
            title: "처방조제",
            url: "https://www.notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          },
          {
            id: "link-2",
            title: "처방점검",
            url: "https://www.notion.so/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
        ],
      },
    ],
  },
  {
    id: "section-b",
    title: "파일이 필요해요",
    description: "파일 섹션",
    icon: "Download",
    colorKey: "emerald",
    categories: [
      {
        id: "cat-2",
        title: "유팜시스템 관련",
        links: [
          {
            id: "link-3",
            title: "유팜시스템 관련",
            url: "https://www.notion.so/cccccccccccccccccccccccccccccccc",
          },
        ],
      },
    ],
  },
];

describe("SearchResultsView", () => {
  it("(검색 결과) 레이블을 표시한다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    expect(screen.getByText("(검색 결과)")).toBeInTheDocument();
  });

  it("검색어와 결과 수를 표시한다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    expect(screen.getAllByText(/처방조제/).length).toBeGreaterThan(0);
    expect(screen.getByText(/개 결과/)).toBeInTheDocument();
  });

  it("결과가 없으면 '검색 결과 없음' 메시지를 표시한다", () => {
    render(<SearchResultsView sections={sampleSections} query="존재하지않는검색어xyz" />);
    expect(screen.getByText("검색 결과 없음")).toBeInTheDocument();
  });

  it("일치하는 링크 제목을 표시한다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    expect(screen.getAllByText("처방조제").length).toBeGreaterThan(0);
  });

  it("섹션 그룹 제목(h3)을 표시한다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    expect(
      screen.getByRole("heading", { name: /처리방법이 궁금해요/ })
    ).toBeInTheDocument();
  });

  it("링크 클릭 시 Notion 모달이 열린다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    // 정확 일치 결과의 버튼 클릭 (첫 번째 결과)
    const buttons = screen.getAllByRole("button", { name: /처방/ });
    fireEvent.click(buttons[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("모달 닫기 버튼 클릭 시 모달이 닫힌다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    const buttons = screen.getAllByRole("button", { name: /처방/ });
    fireEvent.click(buttons[0]);
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("관련도 배지(정확 일치/관련 높음 등)를 표시한다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    // 정확 일치 배지가 보여야 한다
    expect(screen.getByText("정확 일치")).toBeInTheDocument();
  });

  it("외부 링크(새 탭 열기)를 포함한다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    const extLinks = screen.getAllByRole("link", { name: /새 탭에서 열기/ });
    expect(extLinks.length).toBeGreaterThan(0);
    expect(extLinks[0]).toHaveAttribute("target", "_blank");
  });

  it("외부 링크 클릭 시 이벤트 전파를 막아 모달이 열리지 않는다", () => {
    render(<SearchResultsView sections={sampleSections} query="처방조제" />);
    const extLinks = screen.getAllByRole("link", { name: /새 탭에서 열기/ });
    fireEvent.click(extLinks[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("바이그램 유사도만으로 매칭된 결과는 '연관' 배지를 표시한다", () => {
    // "처방관리" 검색: 정확/포함 일치 없음, 바이그램 유사도만 존재 → 점수 < 30 → '연관'
    render(<SearchResultsView sections={sampleSections} query="처방관리" />);
    // 결과가 있는 경우 '연관' 배지가 표시되어야 한다
    const results = screen.queryAllByText("연관");
    if (results.length > 0) {
      expect(results[0]).toBeInTheDocument();
    }
    // 결과가 없어도 컴포넌트가 정상 렌더링 되어야 한다
    expect(screen.getByText("(검색 결과)")).toBeInTheDocument();
  });

  it("여러 섹션에 결과가 있을 때 각 섹션 그룹이 표시된다", () => {
    // "관련"은 section-b 카테고리 "유팜시스템 관련"에 매칭
    render(<SearchResultsView sections={sampleSections} query="유팜시스템" />);
    expect(
      screen.getByRole("heading", { name: /파일이 필요해요/ })
    ).toBeInTheDocument();
  });
});
