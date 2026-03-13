/**
 * SectionView 컴포넌트 테스트
 */

import { render, screen } from "@testing-library/react";
import { SectionView } from "@/components/SectionView";
import { KnowledgeSection } from "@/data/knowledge-base";

const sampleSection: KnowledgeSection = {
  id: "section-a",
  title: "처리방법이 궁금해요",
  description: "유팜시스템 기능별 처리 방법 안내",
  icon: "BookOpen",
  colorKey: "blue",
  categories: [
    {
      id: "cat-1",
      title: "처방조제",
      links: [
        { id: "l1", title: "처방조제 가이드", url: "https://notion.so/1" },
      ],
    },
    {
      id: "cat-2",
      title: "보험청구",
      links: [
        { id: "l2", title: "보험청구 가이드", url: "https://notion.so/2" },
        { id: "l3", title: "보험청구 오류", url: "https://notion.so/3" },
      ],
    },
  ],
};

describe("SectionView", () => {
  it("섹션 제목과 설명을 렌더링한다", () => {
    render(<SectionView section={sampleSection} />);
    expect(screen.getByText("처리방법이 궁금해요")).toBeInTheDocument();
    expect(screen.getByText("유팜시스템 기능별 처리 방법 안내")).toBeInTheDocument();
  });

  it("카테고리 수와 문서 수 통계 레이블을 표시한다", () => {
    render(<SectionView section={sampleSection} />);
    // "카테고리" 레이블이 있는지 확인
    expect(screen.getByText("카테고리")).toBeInTheDocument();
    // "문서" 레이블이 있는지 확인
    expect(screen.getByText("문서")).toBeInTheDocument();
  });

  it("전체 링크 수(3)를 표시한다", () => {
    render(<SectionView section={sampleSection} />);
    // 전체 링크 수 3은 문서 배지에만 표시된다
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("모든 카테고리 카드를 렌더링한다", () => {
    render(<SectionView section={sampleSection} />);
    expect(screen.getByText("처방조제")).toBeInTheDocument();
    expect(screen.getByText("보험청구")).toBeInTheDocument();
  });

  it("isSearchResult가 true이면 '(검색 결과)' 레이블을 표시한다", () => {
    render(<SectionView section={sampleSection} isSearchResult={true} />);
    expect(screen.getByText("(검색 결과)")).toBeInTheDocument();
  });

  it("isSearchResult가 false이면 '(검색 결과)' 레이블을 표시하지 않는다", () => {
    render(<SectionView section={sampleSection} isSearchResult={false} />);
    expect(screen.queryByText("(검색 결과)")).not.toBeInTheDocument();
  });

  it("카테고리가 없으면 '검색 결과가 없습니다' 메시지를 표시한다", () => {
    const emptySection: KnowledgeSection = {
      ...sampleSection,
      categories: [],
    };
    render(<SectionView section={emptySection} />);
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
  });

  it("알 수 없는 아이콘 이름이어도 오류 없이 렌더링한다", () => {
    // ICON_MAP에 없는 아이콘 이름 → BookOpen 폴백이 동작해야 한다
    const sectionWithUnknownIcon: KnowledgeSection = {
      ...sampleSection,
      icon: "UnknownIconName",
    };
    render(<SectionView section={sectionWithUnknownIcon} />);
    expect(screen.getByText("처리방법이 궁금해요")).toBeInTheDocument();
  });
});
