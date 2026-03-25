/**
 * Dashboard 컴포넌트 테스트
 * useKnowledgeStructure 훅을 모킹하여 동기적으로 상태를 주입한다.
 * 훅 자체의 비동기 동작은 useKnowledgeStructure.test.ts 에서 별도 검증한다.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { Dashboard } from "@/components/Dashboard";

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: jest.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// useKnowledgeStructure 훅 모킹
jest.mock("@/hooks/useKnowledgeStructure", () => ({
  useKnowledgeStructure: jest.fn(),
  NOTION_ROOT_URL: "https://www.notion.so/test",
}));

import { useKnowledgeStructure } from "@/hooks/useKnowledgeStructure";

/** 테스트용 최소 섹션 픽스처 */
const mockSections = [
  {
    id: "how-to-process",
    title: "처리방법이 궁금해요",
    description: "유팜시스템 기능별 처리 방법 안내",
    icon: "BookOpen",
    colorKey: "blue" as const,
    categories: [
      {
        id: "upharm-system",
        title: "유팜시스템",
        links: [
          {
            id: "prescription-link",
            title: "처방조제",
            url: "https://www.notion.so/xxx",
          },
        ],
      },
    ],
  },
  {
    id: "how-to-use",
    title: "사용방법이 궁금해요",
    description: "제품별 사용방법 가이드",
    icon: "HelpCircle",
    colorKey: "violet" as const,
    categories: [
      {
        id: "usage-cat",
        title: "유팜시스템",
        links: [
          {
            id: "usage-link",
            title: "사용법",
            url: "https://www.notion.so/yyy",
          },
        ],
      },
    ],
  },
  {
    id: "files",
    title: "파일이 필요해요",
    description: "설치 파일 다운로드",
    icon: "Download",
    colorKey: "emerald" as const,
    categories: [
      {
        id: "file-cat",
        title: "파일",
        links: [
          {
            id: "file-link",
            title: "파일",
            url: "https://www.notion.so/zzz",
          },
        ],
      },
    ],
  },
];

/** 성공 상태 훅 반환값 */
const successHookValue = {
  sections: mockSections,
  status: "success" as const,
  retryAttempt: 0,
  maxRetries: 2,
  retry: jest.fn(),
};

beforeEach(() => {
  // 기본: 성공 상태
  (useKnowledgeStructure as jest.Mock).mockReturnValue(successHookValue);
  // 위젯 fetch 모킹
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  }) as jest.Mock;
});

describe("Dashboard", () => {
  it("로딩 상태일 때 '불러오는 중...' 메시지를 표시한다", () => {
    (useKnowledgeStructure as jest.Mock).mockReturnValue({
      sections: [],
      status: "loading",
      retryAttempt: 0,
      maxRetries: 2,
      retry: jest.fn(),
    });
    render(<Dashboard />);
    expect(screen.getByText("지식베이스 불러오는 중...")).toBeInTheDocument();
  });

  it("재시도 상태일 때 재시도 횟수를 표시한다", () => {
    (useKnowledgeStructure as jest.Mock).mockReturnValue({
      sections: mockSections,
      status: "retrying",
      retryAttempt: 1,
      maxRetries: 2,
      retry: jest.fn(),
    });
    render(<Dashboard />);
    expect(screen.getByText("지식베이스 재시도 중... (1/2)")).toBeInTheDocument();
  });

  it("에러 상태일 때 홈 탭에서 배너와 위젯을 함께 표시한다", () => {
    // sections는 채워진 채로 status만 error — HomeView는 정상 렌더링되어야 한다
    (useKnowledgeStructure as jest.Mock).mockReturnValue({
      sections: mockSections,
      status: "error",
      retryAttempt: 0,
      maxRetries: 2,
      retry: jest.fn(),
    });
    render(<Dashboard />);
    // 에러 배너: "Notion 열기" 링크와 "재시도" 버튼이 있어야 한다
    expect(screen.getAllByText(/재시도/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Notion/).length).toBeGreaterThan(0);
    // 홈 뷰(위젯)도 함께 표시
    expect(
      screen.getAllByRole("heading", { name: /유팜 기술지원 포털/ }).length
    ).toBeGreaterThan(0);
  });

  it("에러 상태에서 섹션 탭 전환 시 전체 에러 UI를 표시한다", () => {
    (useKnowledgeStructure as jest.Mock).mockReturnValue({
      sections: mockSections,
      status: "error",
      retryAttempt: 0,
      maxRetries: 2,
      retry: jest.fn(),
    });
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /처리방법이 궁금해요/ }));
    expect(screen.getByText("지식베이스를 불러올 수 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /다시 시도/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Notion에서 열기/ })).toBeInTheDocument();
  });

  it("성공 상태일 때 홈 뷰를 표시한다", () => {
    render(<Dashboard />);
    expect(
      screen.getAllByRole("heading", { name: /유팜 기술지원 포털/ }).length
    ).toBeGreaterThan(0);
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
    fireEvent.click(screen.getByRole("button", { name: /사용방법이 궁금해요/ }));
    expect(
      screen.getByRole("heading", { name: /사용방법이 궁금해요/ })
    ).toBeInTheDocument();
  });

  it("검색어 입력 시 일치하는 섹션 콘텐츠를 표시한다", () => {
    render(<Dashboard />);
    fireEvent.change(
      screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색..."),
      { target: { value: "처방조제" } }
    );
    expect(screen.getAllByText("처방조제").length).toBeGreaterThan(0);
  });

  it("검색 결과가 없으면 '검색 결과 없음' 메시지를 표시한다", () => {
    render(<Dashboard />);
    fireEvent.change(
      screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색..."),
      { target: { value: "존재하지않는검색어xyz" } }
    );
    expect(screen.getByText("검색 결과 없음")).toBeInTheDocument();
  });

  it("검색어 입력 시 '(검색 결과)' 레이블이 표시된다", () => {
    render(<Dashboard />);
    fireEvent.change(
      screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색..."),
      { target: { value: "처방" } }
    );
    expect(screen.getByText("(검색 결과)")).toBeInTheDocument();
  });

  it("cached 상태일 때 홈 탭에서 캐시 배너와 위젯을 함께 표시한다", () => {
    (useKnowledgeStructure as jest.Mock).mockReturnValue({
      sections: mockSections,
      status: "cached",
      retryAttempt: 0,
      maxRetries: 2,
      retry: jest.fn(),
    });
    render(<Dashboard />);
    expect(screen.getByText("저장된 데이터를 사용 중입니다")).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: /유팜 기술지원 포털/ }).length
    ).toBeGreaterThan(0);
  });

  it("총 문서 수를 홈 히어로에 표시한다", () => {
    render(<Dashboard />);
    expect(screen.getAllByText(/문서/).length).toBeGreaterThan(0);
  });

  it("활성 섹션이 검색 결과에 없으면 첫 번째 결과 섹션을 표시한다", () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: /파일이 필요해요/ }));
    expect(
      screen.getByRole("heading", { name: /파일이 필요해요/ })
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("처리방법, 카테고리, 문서 이름 검색..."),
      { target: { value: "처방조제" } }
    );
    expect(
      screen.getByRole("heading", { name: /처리방법이 궁금해요/ })
    ).toBeInTheDocument();
  });
});
