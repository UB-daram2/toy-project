/**
 * NotionModal 컴포넌트 테스트
 * 모달 라이프사이클, 블록 렌더링, 서브페이지 네비게이션을 검증한다.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotionModal } from "@/components/NotionModal";

const TEST_URL = "https://u-pham.notion.site/aabbccdd11223344aabbccdd11223344";
const TEST_TITLE = "처방조제";

const mockFetch = jest.fn();
global.fetch = mockFetch;

/** 성공 응답 모킹 헬퍼 */
function mockFetchSuccess(blocks: object[]) {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ blocks }) });
}

/** 에러 응답 모킹 헬퍼 */
function mockFetchError(errorMessage: string) {
  mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: errorMessage }) });
}

/** rich_text 항목 생성 헬퍼 */
function rt(text: string, opts: { bold?: boolean; italic?: boolean; strikethrough?: boolean; underline?: boolean; code?: boolean; href?: string | null } = {}) {
  return {
    plain_text: text,
    href: opts.href ?? null,
    annotations: {
      bold: opts.bold ?? false,
      italic: opts.italic ?? false,
      strikethrough: opts.strikethrough ?? false,
      underline: opts.underline ?? false,
      code: opts.code ?? false,
    },
  };
}

describe("NotionModal", () => {
  beforeEach(() => mockFetch.mockClear());

  // ── 모달 라이프사이클 ──

  it("로딩 중 스피너를 표시하고, 제목과 Notion 링크가 올바르다", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
    expect(screen.getByText(TEST_TITLE)).toBeInTheDocument();
    const link = screen.getByText("Notion에서 열기").closest("a");
    expect(link).toHaveAttribute("href", TEST_URL);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("닫기 버튼/배경 클릭/ESC 키로 모달을 닫는다", () => {
    // 닫기 버튼
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const onClose = jest.fn();
    const { unmount: u1 } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    u1();

    // 배경 클릭
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const onClose2 = jest.fn();
    const { unmount: u2 } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={onClose2} />);
    fireEvent.click(screen.getByRole("dialog", { name: TEST_TITLE }));
    expect(onClose2).toHaveBeenCalledTimes(1);
    u2();

    // ESC 키
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const onClose3 = jest.fn();
    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={onClose3} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose3).toHaveBeenCalledTimes(1);
  });

  it("올바르지 않은 URL이면 에러 메시지를 표시한다", () => {
    render(<NotionModal pageUrl="https://invalid-url.com" pageTitle={TEST_TITLE} onClose={() => {}} />);
    expect(screen.getByText("올바르지 않은 페이지 URL입니다.")).toBeInTheDocument();
  });

  // ── 에러 처리 ──

  it("API 오류/fetch 예외/Unknown error/비Error 예외를 처리한다", async () => {
    // API 에러 응답
    mockFetchError("페이지를 불러오지 못했습니다: Not found");
    const { unmount: u1 } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/페이지를 불러오지 못했습니다/)).toBeInTheDocument());
    u1();

    // fetch 예외
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { unmount: u2 } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("Network error")).toBeInTheDocument());
    u2();

    // error 필드 없는 응답
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const { unmount: u3 } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Unknown error/)).toBeInTheDocument());
    u3();

    // 비Error 인스턴스 예외
    mockFetch.mockRejectedValueOnce("string error");
    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("페이지를 불러오지 못했습니다.")).toBeInTheDocument());
  });

  it("429 에러 시 안내 메시지·다시 시도·Notion 링크를 표시한다", async () => {
    mockFetchError("Notion API 오류: 429");
    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/429/)).toBeInTheDocument();
      expect(screen.getByText("일시적으로 차단되었습니다", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("다시 시도")).toBeInTheDocument();
      // 에러 영역 내 Notion 링크 (헤더와 별도)
      const notionLinks = screen.getAllByText("Notion에서 열기");
      expect(notionLinks.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("에러 상태에서 다시 시도 클릭 시 재요청한다", async () => {
    mockFetchError("Notion API 오류: 502");
    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("다시 시도")).toBeInTheDocument());

    // 재시도 시 성공 응답
    mockFetchSuccess([{ id: "p1", type: "paragraph", paragraph: { rich_text: [rt("재시도 성공")] } }]);
    fireEvent.click(screen.getByText("다시 시도"));
    await waitFor(() => expect(screen.getByText("재시도 성공")).toBeInTheDocument());
  });

  // ── 블록 렌더링 ──

  it("다양한 블록 타입을 렌더링한다 (paragraph, heading, list, todo, quote, code, callout, divider, toggle)", async () => {
    mockFetchSuccess([
      { id: "p1", type: "paragraph", paragraph: { rich_text: [rt("본문 텍스트")] } },
      { id: "h1", type: "heading_1", heading_1: { rich_text: [rt("대제목")] } },
      { id: "h2", type: "heading_2", heading_2: { rich_text: [rt("중제목")] } },
      { id: "h3", type: "heading_3", heading_3: { rich_text: [rt("소제목")] } },
      { id: "bl", type: "bulleted_list_item", bulleted_list_item: { rich_text: [rt("목록 항목")] } },
      { id: "nl", type: "numbered_list_item", numbered_list_item: { rich_text: [rt("순서 항목")] } },
      { id: "td", type: "to_do", to_do: { rich_text: [rt("할 일")], checked: true } },
      { id: "qt", type: "quote", quote: { rich_text: [rt("인용구 내용")] } },
      { id: "co", type: "code", code: { rich_text: [rt("console.log('hello')")], language: "javascript" } },
      { id: "cl", type: "callout", callout: { rich_text: [rt("중요 안내")], icon: { emoji: "💡" } } },
      { id: "dv", type: "divider", divider: {} },
      { id: "tg", type: "toggle", toggle: { rich_text: [rt("토글 제목")] } },
    ]);

    const { container } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("본문 텍스트")).toBeInTheDocument();
      expect(screen.getByText("대제목")).toBeInTheDocument();
      expect(screen.getByText("중제목")).toBeInTheDocument();
      expect(screen.getByText("소제목")).toBeInTheDocument();
      expect(screen.getByText("목록 항목")).toBeInTheDocument();
      expect(screen.getByText("순서 항목")).toBeInTheDocument();
      expect(screen.getByText("할 일")).toBeInTheDocument();
      expect(container.querySelector("input[type='checkbox']")).toBeChecked();
      expect(container.querySelector("blockquote")).toBeInTheDocument();
      expect(screen.getByText("인용구 내용")).toBeInTheDocument();
      expect(container.querySelector("pre")).toBeInTheDocument();
      expect(screen.getByText("💡")).toBeInTheDocument();
      expect(container.querySelector("hr")).toBeInTheDocument();
      expect(container.querySelector("details")).toBeInTheDocument();
      expect(screen.getByText("토글 제목")).toBeInTheDocument();
    });
  });

  it("rich text 어노테이션(bold/italic/strikethrough/underline/code/link)을 렌더링한다", async () => {
    mockFetchSuccess([
      { id: "b", type: "paragraph", paragraph: { rich_text: [rt("굵은", { bold: true })] } },
      { id: "i", type: "paragraph", paragraph: { rich_text: [rt("기울임", { italic: true })] } },
      { id: "s", type: "paragraph", paragraph: { rich_text: [rt("취소선", { strikethrough: true })] } },
      { id: "u", type: "paragraph", paragraph: { rich_text: [rt("밑줄", { underline: true })] } },
      { id: "c", type: "paragraph", paragraph: { rich_text: [rt("코드조각", { code: true })] } },
      { id: "l", type: "paragraph", paragraph: { rich_text: [rt("링크", { href: "https://example.com" })] } },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("굵은")).toHaveClass("font-semibold");
      expect(screen.getByText("기울임")).toHaveClass("italic");
      expect(screen.getByText("취소선")).toHaveClass("line-through");
      expect(screen.getByText("밑줄")).toHaveClass("underline");
      expect(screen.getByText("코드조각").tagName).toBe("CODE");
      expect(screen.getByText("링크").closest("a")).toHaveAttribute("href", "https://example.com");
    });
  });

  it("빈 paragraph는 br, 빈 콘텐츠는 Notion 안내를 표시한다", async () => {
    // 빈 paragraph → br
    mockFetchSuccess([
      { id: "p1", type: "paragraph", paragraph: { rich_text: [rt("내용")] } },
      { id: "p2", type: "paragraph", paragraph: { rich_text: [] } },
    ]);
    const { container, unmount } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector("br")).toBeInTheDocument());
    unmount();

    // 블록 0개 → Notion 안내
    mockFetchSuccess([]);
    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("이 페이지는 Notion에서 직접 확인해 주세요.")).toBeInTheDocument());
  });

  it("image 블록(external/file/URL없음)을 렌더링한다", async () => {
    mockFetchSuccess([
      { id: "img1", type: "image", image: { type: "external", external: { url: "https://example.com/image.png" } } },
      { id: "img2", type: "image", image: { type: "file", file: { url: "https://s3.amazonaws.com/image.png" } } },
      { id: "img3", type: "image", image: { type: "file" } },
    ]);

    const { container } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => {
      const imgs = container.querySelectorAll("img");
      expect(imgs.length).toBe(2);
      expect(imgs[0]).toHaveAttribute("src", "https://example.com/image.png");
      expect(imgs[1]).toHaveAttribute("src", "https://s3.amazonaws.com/image.png");
    });
  });

  it("file 블록(PDF/비PDF/URL없음/size없음)을 렌더링한다", async () => {
    mockFetchSuccess([
      { id: "f1", type: "file", file: { name: "manual.pdf", size: "512 KB", url: "https://s3.amazonaws.com/manual.pdf" } },
      { id: "f2", type: "file", file: { name: "data.zip", size: "1.2 MB", url: "https://s3.amazonaws.com/data.zip" } },
      { id: "f3", type: "file", file: { name: "attachment.pdf", size: null, url: null } },
      { id: "f4", type: "file", file: { name: "report.docx", size: null, url: "https://s3.amazonaws.com/report.docx" } },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => {
      // PDF → 새 탭
      const pdfLink = screen.getByText("manual.pdf").closest("a");
      expect(pdfLink).toHaveAttribute("target", "_blank");

      // 비PDF → 다운로드
      const zipLink = screen.getByText("data.zip").closest("a");
      expect(zipLink).toHaveAttribute("download", "data.zip");

      // URL 없음 → Notion 안내
      expect(screen.getByText("attachment.pdf")).toBeInTheDocument();

      // size null → 크기 미표시
      const docxLink = screen.getByText("report.docx").closest("a");
      expect(docxLink).toHaveAttribute("download", "report.docx");
    });
  });

  it("rich_text가 없는 블록, 미지원 블록, callout 아이콘 없음을 에러 없이 처리한다", async () => {
    mockFetchSuccess([
      { id: "h1", type: "heading_1", heading_1: {} },
      { id: "h2", type: "heading_2", heading_2: {} },
      { id: "h3", type: "heading_3", heading_3: {} },
      { id: "bl", type: "bulleted_list_item", bulleted_list_item: {} },
      { id: "nl", type: "numbered_list_item", numbered_list_item: {} },
      { id: "td", type: "to_do", to_do: {} },
      { id: "qt", type: "quote", quote: {} },
      { id: "cl", type: "callout", callout: {} },
      { id: "co", type: "code", code: {} },
      { id: "uk", type: "unknown_xyz", unknown_xyz: {} },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument());
    expect(screen.queryByText(/페이지를 불러오지 못했습니다/)).not.toBeInTheDocument();
  });

  it("to_do 미체크 상태에서 체크박스가 비어있다", async () => {
    mockFetchSuccess([
      { id: "td", type: "to_do", to_do: { rich_text: [rt("미완료")], checked: false } },
    ]);
    const { container } = render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector("input[type='checkbox']")).not.toBeChecked());
  });

  // ── 서브페이지 네비게이션 ──

  it("child_page 클릭 시 서브페이지로 이동하고 뒤로가기로 복귀한다", async () => {
    const subPageUrl = "https://u-pham.notion.site/eeff0011223344556677889900aabbcc";
    mockFetchSuccess([
      { id: "cp", type: "child_page", child_page: { url: subPageUrl, rich_text: [rt("서브페이지 제목")] } },
    ]);
    mockFetchSuccess([]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("서브페이지 제목")).toBeInTheDocument());

    fireEvent.click(screen.getByText("서브페이지 제목"));
    await waitFor(() => expect(screen.getByRole("button", { name: "이전 페이지" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "이전 페이지" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "이전 페이지" })).not.toBeInTheDocument());
  });

  it("child_page에 plain_text가 없으면 '페이지' 기본 제목을 사용한다", async () => {
    mockFetchSuccess([
      { id: "cp", type: "child_page", child_page: { url: "https://u-pham.notion.site/abc", rich_text: [{ href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }] } },
    ]);
    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("페이지")).toBeInTheDocument());
  });

  it("child_page만 있는 경우(visible content 없음) Notion 안내를 표시한다", async () => {
    mockFetchSuccess([
      { id: "cp", type: "child_page", child_page: { title: "서브페이지" } },
    ]);
    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument());
    expect(screen.getByText("이 페이지는 Notion에서 직접 확인해 주세요.")).toBeInTheDocument();
  });
});
