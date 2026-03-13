/**
 * Dashboard 컴포넌트 테스트
 * 섹션 전환, 검색, 검색 결과 없음 동작을 검증한다.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "@/components/Dashboard";

// next-themes를 모킹하여 SSR 환경에서도 동작하게 한다
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: jest.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("Dashboard", () => {
  it("초기 렌더링 시 홈 뷰를 표시한다", () => {
    render(<Dashboard />);
    // 초기 상태는 홈 뷰 — HomeView의 "홈" heading이 표시되어야 한다
    expect(
      screen.getByRole("heading", { name: /홈/ })
    ).toBeInTheDocument();
  });

  it("사이드바에 홈 버튼과 세 개의 섹션 버튼이 모두 있다", () => {
    render(<Dashboard />);
    expect(screen.getByRole("button", { name: /홈/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /처리방법이 궁금해요/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /사용방법이 궁금해요/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /파일이 필요해요/ })
    ).toBeInTheDocument();
  });

  it("사이드바에서 섹션 클릭 시 해당 섹션 콘텐츠로 전환된다", () => {
    render(<Dashboard />);
    const sidebarButton = screen.getByRole("button", {
      name: /사용방법이 궁금해요/,
    });
    fireEvent.click(sidebarButton);
    expect(
      screen.getByRole("heading", { name: /사용방법이 궁금해요/ })
    ).toBeInTheDocument();
  });

  it("검색어 입력 시 홈 뷰에서 벗어나 일치하는 섹션 콘텐츠를 표시한다", () => {
    render(<Dashboard />);
    const searchInput = screen.getByPlaceholderText(
      "처리방법, 카테고리, 문서 이름 검색..."
    );
    // "처방조제"로 검색 — 홈 뷰에서 검색해도 SectionView로 전환된다
    fireEvent.change(searchInput, { target: { value: "처방조제" } });
    expect(screen.getAllByText("처방조제").length).toBeGreaterThan(0);
  });

  it("검색 결과가 없으면 '검색 결과 없음' 메시지를 표시한다", () => {
    render(<Dashboard />);
    const searchInput = screen.getByPlaceholderText(
      "처리방법, 카테고리, 문서 이름 검색..."
    );
    fireEvent.change(searchInput, { target: { value: "존재하지않는검색어xyz" } });
    expect(screen.getByText("검색 결과 없음")).toBeInTheDocument();
  });

  it("검색어 입력 시 '(검색 결과)' 레이블이 표시된다", () => {
    render(<Dashboard />);
    const searchInput = screen.getByPlaceholderText(
      "처리방법, 카테고리, 문서 이름 검색..."
    );
    fireEvent.change(searchInput, { target: { value: "처방" } });
    expect(screen.getByText("(검색 결과)")).toBeInTheDocument();
  });

  it("총 문서 수를 헤더에 표시한다", () => {
    render(<Dashboard />);
    expect(screen.getByText("개 문서")).toBeInTheDocument();
  });

  it("활성 섹션이 검색 결과에 없으면 첫 번째 결과 섹션을 표시한다", () => {
    render(<Dashboard />);
    // 먼저 "파일이 필요해요" 섹션으로 이동
    fireEvent.click(screen.getByRole("button", { name: /파일이 필요해요/ }));
    expect(
      screen.getByRole("heading", { name: /파일이 필요해요/ })
    ).toBeInTheDocument();

    // "처방조제"로 검색 → "파일이 필요해요" 섹션에는 해당 항목 없음
    const searchInput = screen.getByPlaceholderText(
      "처리방법, 카테고리, 문서 이름 검색..."
    );
    fireEvent.change(searchInput, { target: { value: "처방조제" } });
    // 활성 섹션이 결과에 없으므로 첫 번째 결과 섹션("처리방법이 궁금해요")이 표시된다
    expect(
      screen.getByRole("heading", { name: /처리방법이 궁금해요/ })
    ).toBeInTheDocument();
  });
});
