/**
 * CategoryCard 컴포넌트 테스트
 */

import { render, screen } from "@testing-library/react";
import { CategoryCard } from "@/components/CategoryCard";
import { KnowledgeCategory } from "@/data/knowledge-base";

const sampleCategory: KnowledgeCategory = {
  id: "cat-1",
  title: "처방조제",
  links: [
    { id: "link-1", title: "처방조제 방법", url: "https://notion.so/1" },
    { id: "link-2", title: "처방점검 방법", url: "https://notion.so/2" },
  ],
};

describe("CategoryCard", () => {
  it("카테고리 제목을 렌더링한다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    expect(screen.getByText("처방조제")).toBeInTheDocument();
  });

  it("링크 수 배지를 렌더링한다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    // links.length = 2
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("모든 링크 제목을 렌더링한다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    expect(screen.getByText("처방조제 방법")).toBeInTheDocument();
    expect(screen.getByText("처방점검 방법")).toBeInTheDocument();
  });

  it("각 링크는 href와 target=_blank를 가진다", () => {
    render(<CategoryCard category={sampleCategory} colorKey="blue" />);
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
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
