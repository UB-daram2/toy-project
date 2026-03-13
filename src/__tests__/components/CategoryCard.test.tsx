/**
 * CategoryCard 컴포넌트 테스트
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryCard } from "@/components/CategoryCard";
import { KnowledgeCategory } from "@/data/knowledge-base";

// NotionModal은 fetch에 의존하므로 모킹
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

const sampleCategory: KnowledgeCategory = {
  id: "cat-1",
  title: "처방조제",
  links: [
    { id: "link-1", title: "처방조제 방법", url: "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    { id: "link-2", title: "처방점검 방법", url: "https://notion.so/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
  ],
};

describe("CategoryCard", () => {
  it("카테고리 제목을 렌더링한다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    expect(screen.getByText("처방조제")).toBeInTheDocument();
  });

  it("링크 수 배지를 렌더링한다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("모든 링크 제목을 버튼으로 렌더링한다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    expect(screen.getByText("처방조제 방법")).toBeInTheDocument();
    expect(screen.getByText("처방점검 방법")).toBeInTheDocument();
  });

  it("외부 링크 아이콘은 href와 target=_blank를 가진다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    // 각 링크마다 aria-label이 있는 외부 링크 앵커가 존재한다
    const externalLinks = screen.getAllByRole("link");
    externalLinks.forEach((link) => {
      expect(link).toHaveAttribute("href");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("링크 버튼 클릭 시 NotionModal이 열린다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    // 모달이 처음에는 없다
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // 첫 번째 링크 버튼 클릭
    fireEvent.click(screen.getByText("처방조제 방법"));

    // 모달이 열린다
    expect(screen.getByRole("dialog", { name: "처방조제 방법" })).toBeInTheDocument();
  });

  it("모달 닫기 버튼 클릭 시 모달이 닫힌다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    fireEvent.click(screen.getByText("처방조제 방법"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // 닫기 버튼 클릭
    fireEvent.click(screen.getByText("닫기"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("링크가 없는 카테고리는 배지에 0을 표시한다", () => {
    const emptyCategory: KnowledgeCategory = {
      id: "empty",
      title: "빈 카테고리",
      links: [],
    };
    render(<CategoryCard category={emptyCategory} colorKey="violet" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("colorKey가 달라도 정상 렌더링된다", () => {
    const { rerender } = render(
      <CategoryCard category={sampleCategory} colorKey="blue" />
    );
    expect(screen.getByText("처방조제")).toBeInTheDocument();

    rerender(<CategoryCard category={sampleCategory} colorKey="violet" />);
    expect(screen.getByText("처방조제")).toBeInTheDocument();

    rerender(<CategoryCard category={sampleCategory} colorKey="emerald" />);
    expect(screen.getByText("처방조제")).toBeInTheDocument();
  });
});
