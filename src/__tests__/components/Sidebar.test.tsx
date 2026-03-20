/**
 * Sidebar 컴포넌트 테스트
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";
import { KnowledgeSection } from "@/data/knowledge-base";

const sampleSections: KnowledgeSection[] = [
  {
    id: "section-a",
    title: "처리방법이 궁금해요",
    description: "설명 A",
    icon: "BookOpen",
    colorKey: "blue",
    categories: [
      {
        id: "cat-1",
        title: "카테고리 1",
        links: [
          { id: "l1", title: "링크1", url: "https://notion.so/1" },
          { id: "l2", title: "링크2", url: "https://notion.so/2" },
        ],
      },
    ],
  },
  {
    id: "section-b",
    title: "사용방법이 궁금해요",
    description: "설명 B",
    icon: "HelpCircle",
    colorKey: "violet",
    categories: [
      {
        id: "cat-2",
        title: "카테고리 2",
        links: [{ id: "l3", title: "링크3", url: "https://notion.so/3" }],
      },
    ],
  },
];

describe("Sidebar", () => {
  it("모든 섹션 제목을 렌더링한다", () => {
    render(
      <Sidebar
        sections={sampleSections}
        activeSectionId="section-a"
        onSectionSelect={jest.fn()}
      />
    );
    expect(screen.getByText("처리방법이 궁금해요")).toBeInTheDocument();
    expect(screen.getByText("사용방법이 궁금해요")).toBeInTheDocument();
  });

  it("각 섹션의 링크 수 배지를 렌더링한다", () => {
    render(
      <Sidebar
        sections={sampleSections}
        activeSectionId="section-a"
        onSectionSelect={jest.fn()}
      />
    );
    // section-a: 2개 링크, section-b: 1개 링크
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("섹션 버튼 클릭 시 onSectionSelect를 호출한다", () => {
    const onSectionSelect = jest.fn();
    render(
      <Sidebar
        sections={sampleSections}
        activeSectionId="section-a"
        onSectionSelect={onSectionSelect}
      />
    );
    fireEvent.click(screen.getByText("사용방법이 궁금해요"));
    expect(onSectionSelect).toHaveBeenCalledWith("section-b");
  });

  it("서비스 로고 타이틀을 렌더링한다", () => {
    render(
      <Sidebar
        sections={sampleSections}
        activeSectionId="section-a"
        onSectionSelect={jest.fn()}
      />
    );
    expect(screen.getByText("유팜 기술지원 포털")).toBeInTheDocument();
  });

  it("빈 섹션 배열이면 홈 버튼만 렌더링한다", () => {
    render(
      <Sidebar
        sections={[]}
        activeSectionId=""
        onSectionSelect={jest.fn()}
      />
    );
    expect(screen.getByText("유팜 기술지원 포털")).toBeInTheDocument();
    // 섹션이 없어도 홈 버튼은 항상 표시된다
    expect(screen.getByRole("button", { name: /홈/ })).toBeInTheDocument();
  });

  it("홈 버튼 클릭 시 onSectionSelect('home')를 호출한다", () => {
    const onSectionSelect = jest.fn();
    render(
      <Sidebar
        sections={sampleSections}
        activeSectionId="section-a"
        onSectionSelect={onSectionSelect}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /홈/ }));
    expect(onSectionSelect).toHaveBeenCalledWith("home");
  });

  it("알 수 없는 아이콘 이름이어도 오류 없이 렌더링한다", () => {
    // ICON_MAP에 없는 아이콘 이름 → BookOpen 폴백이 동작해야 한다
    const sectionsWithUnknownIcon: KnowledgeSection[] = [
      {
        ...sampleSections[0],
        icon: "UnknownIconName",
      },
    ];
    render(
      <Sidebar
        sections={sectionsWithUnknownIcon}
        activeSectionId="section-a"
        onSectionSelect={jest.fn()}
      />
    );
    expect(screen.getByText("처리방법이 궁금해요")).toBeInTheDocument();
  });
});
