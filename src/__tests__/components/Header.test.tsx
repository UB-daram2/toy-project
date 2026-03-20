/**
 * Header 컴포넌트 테스트
 * next-themes의 useTheme을 모킹하여 테스트한다.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/Header";

const mockSetTheme = jest.fn();
// 테스트 간 테마 값을 변경할 수 있도록 가변 변수로 선언
let mockTheme = "dark";

// next-themes를 모킹하여 테스트 환경에서도 동작하게 한다
jest.mock("next-themes", () => ({
  useTheme: () => ({
    get theme() {
      return mockTheme;
    },
    setTheme: mockSetTheme,
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    // 각 테스트 전 상태를 초기화
    mockTheme = "dark";
    mockSetTheme.mockClear();
  });

  it("검색 입력창을 렌더링한다", () => {
    render(
      <Header
        searchQuery=""
        onSearchChange={jest.fn()}
        totalDocuments={42}
      />
    );
    expect(
      screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색...")
    ).toBeInTheDocument();
  });

  it("전체 문서 수를 표시한다", () => {
    render(
      <Header
        searchQuery=""
        onSearchChange={jest.fn()}
        totalDocuments={42}
      />
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("검색어 입력 시 onSearchChange를 호출한다", () => {
    const onSearchChange = jest.fn();
    render(
      <Header
        searchQuery=""
        onSearchChange={onSearchChange}
        totalDocuments={0}
      />
    );
    const input = screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색...");
    fireEvent.change(input, { target: { value: "처방조제" } });
    expect(onSearchChange).toHaveBeenCalledWith("처방조제");
  });

  it("searchQuery prop이 입력창에 표시된다", () => {
    render(
      <Header
        searchQuery="처방조제"
        onSearchChange={jest.fn()}
        totalDocuments={5}
      />
    );
    const input = screen.getByDisplayValue("처방조제");
    expect(input).toBeInTheDocument();
  });

  it("다크 모드에서 마운트 후 테마 토글 버튼이 표시된다", () => {
    mockTheme = "dark";
    render(
      <Header searchQuery="" onSearchChange={jest.fn()} totalDocuments={0} />
    );
    // isMounted=true 이후 테마 버튼이 렌더링된다
    const toggleButton = screen.getByRole("button", { name: "테마 전환" });
    expect(toggleButton).toBeInTheDocument();
  });

  it("다크 모드에서 토글 버튼 클릭 시 light 테마로 전환한다", () => {
    mockTheme = "dark";
    render(
      <Header searchQuery="" onSearchChange={jest.fn()} totalDocuments={0} />
    );
    const toggleButton = screen.getByRole("button", { name: "테마 전환" });
    fireEvent.click(toggleButton);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("라이트 모드에서 토글 버튼 클릭 시 dark 테마로 전환한다", () => {
    // 라이트 모드로 설정
    mockTheme = "light";
    render(
      <Header searchQuery="" onSearchChange={jest.fn()} totalDocuments={0} />
    );
    const toggleButton = screen.getByRole("button", { name: "테마 전환" });
    fireEvent.click(toggleButton);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("IME 조합 중에는 onChange에서 onSearchChange가 호출되지 않는다", () => {
    const onSearchChange = jest.fn();
    render(
      <Header searchQuery="" onSearchChange={onSearchChange} totalDocuments={0} />
    );
    const input = screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색...");
    // 한국어 IME 조합 시작 — 이후 onChange 는 차단되어야 한다
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "처" } });
    expect(onSearchChange).not.toHaveBeenCalled();
  });

  it("IME 조합 완료(onCompositionEnd) 후 onSearchChange가 최종값으로 호출된다", () => {
    const onSearchChange = jest.fn();
    render(
      <Header searchQuery="" onSearchChange={onSearchChange} totalDocuments={0} />
    );
    const input = screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색...");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "처" } });
    fireEvent.compositionEnd(input, { target: { value: "처방조제" } });
    expect(onSearchChange).toHaveBeenCalledWith("처방조제");
  });

  it("IME 조합 중에 외부 searchQuery 변경이 입력창에 반영되지 않는다", () => {
    const onSearchChange = jest.fn();
    const { rerender } = render(
      <Header searchQuery="" onSearchChange={onSearchChange} totalDocuments={0} />
    );
    const input = screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색...");
    // IME 조합 시작 후 중간 입력값 설정
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "처" } });
    // 외부에서 searchQuery 가 변경되어도 조합 중이므로 localValue 가 덮이지 않아야 한다
    rerender(
      <Header searchQuery="외부변경" onSearchChange={onSearchChange} totalDocuments={0} />
    );
    expect(input).toHaveValue("처");
  });
});
