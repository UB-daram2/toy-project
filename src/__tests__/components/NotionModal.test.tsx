/**
 * NotionModal 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotionModal } from "@/components/NotionModal";

const TEST_URL = "https://www.notion.so/87e1f915cdf083ca827e812ef3a5a3e0";
const TEST_TITLE = "처방조제";

// fetch 모킹
const mockFetch = jest.fn();
global.fetch = mockFetch;

/** 성공 응답을 반환하는 fetch 모킹 헬퍼 */
function mockFetchSuccess(blocks: object[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ blocks }),
  });
}

/** 에러 응답을 반환하는 fetch 모킹 헬퍼 */
function mockFetchError(errorMessage: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: errorMessage }),
  });
}

describe("NotionModal", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("로딩 중 스피너와 텍스트를 표시한다", () => {
    // fetch가 완료되기 전 상태를 테스트하기 위해 pending Promise 사용
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );
    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
  });

  it("페이지 제목을 헤더에 표시한다", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );
    expect(screen.getByText(TEST_TITLE)).toBeInTheDocument();
  });

  it("'Notion에서 열기' 링크가 올바른 href를 가진다", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );
    const link = screen.getByText("Notion에서 열기").closest("a");
    expect(link).toHaveAttribute("href", TEST_URL);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("블록 로딩 후 paragraph 블록을 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-1",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              plain_text: "테스트 내용입니다.",
              href: null,
              annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false },
            },
          ],
        },
      },
    ]);

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("테스트 내용입니다.")).toBeInTheDocument();
    });
  });

  it("heading_2 블록을 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-h2",
        type: "heading_2",
        heading_2: {
          rich_text: [
            {
              plain_text: "섹션 제목",
              href: null,
              annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false },
            },
          ],
        },
      },
    ]);

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("섹션 제목")).toBeInTheDocument();
    });
  });

  it("API 오류 시 에러 메시지를 표시한다", async () => {
    mockFetchError("페이지를 불러오지 못했습니다: Not found");

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/페이지를 불러오지 못했습니다/)
      ).toBeInTheDocument();
    });
  });

  it("fetch 예외 발생 시 에러 메시지를 표시한다", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("블록이 없으면 '내용이 없습니다' 메시지를 표시한다", async () => {
    mockFetchSuccess([]);

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("내용이 없습니다.")).toBeInTheDocument();
    });
  });

  it("닫기 버튼 클릭 시 onClose가 호출된다", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const onClose = jest.fn();
    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={onClose} />
    );
    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("배경 클릭 시 onClose가 호출된다", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const onClose = jest.fn();
    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={onClose} />
    );
    // role="dialog" 부모 div(배경) 클릭
    fireEvent.click(screen.getByRole("dialog", { name: TEST_TITLE }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ESC 키 입력 시 onClose가 호출된다", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const onClose = jest.fn();
    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={onClose} />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("올바르지 않은 URL이면 에러 메시지를 표시한다", () => {
    render(
      <NotionModal
        pageUrl="https://invalid-url.com"
        pageTitle={TEST_TITLE}
        onClose={() => {}}
      />
    );
    expect(screen.getByText("올바르지 않은 페이지 URL입니다.")).toBeInTheDocument();
  });

  it("bulleted_list_item 블록을 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-li",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            {
              plain_text: "목록 항목",
              href: null,
              annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false },
            },
          ],
        },
      },
    ]);

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("목록 항목")).toBeInTheDocument();
    });
  });

  it("divider 블록을 렌더링한다", async () => {
    mockFetchSuccess([
      { id: "block-div", type: "divider", divider: {} },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelector("hr")).toBeInTheDocument();
    });
  });

  it("지원하지 않는 블록 타입은 렌더링을 생략한다", async () => {
    mockFetchSuccess([
      { id: "block-unknown", type: "child_page", child_page: { title: "서브페이지" } },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelector("[role='dialog']")).toBeInTheDocument();
    });
  });

  it("bold 어노테이션이 적용된 rich text를 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-bold",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              plain_text: "굵은 텍스트",
              href: null,
              annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false },
            },
          ],
        },
      },
    ]);

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      const el = screen.getByText("굵은 텍스트");
      expect(el).toHaveClass("font-semibold");
    });
  });

  it("href가 있는 rich text를 링크로 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-link",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              plain_text: "링크 텍스트",
              href: "https://example.com",
              annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false },
            },
          ],
        },
      },
    ]);

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      const link = screen.getByText("링크 텍스트").closest("a");
      expect(link).toHaveAttribute("href", "https://example.com");
    });
  });

  it("code 어노테이션이 적용된 rich text를 인라인 코드로 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-code-inline",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              plain_text: "코드조각",
              href: null,
              annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: true },
            },
          ],
        },
      },
    ]);

    render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      const codeEl = screen.getByText("코드조각");
      expect(codeEl.tagName).toBe("CODE");
    });
  });

  it("heading_1 블록을 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-h1",
        type: "heading_1",
        heading_1: {
          rich_text: [{ plain_text: "대제목", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
        },
      },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("대제목")).toBeInTheDocument());
  });

  it("heading_3 블록을 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-h3",
        type: "heading_3",
        heading_3: {
          rich_text: [{ plain_text: "소제목", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
        },
      },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("소제목")).toBeInTheDocument());
  });

  it("numbered_list_item 블록을 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-nl",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ plain_text: "순서 항목", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
        },
      },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText("순서 항목")).toBeInTheDocument());
  });

  it("to_do 블록을 체크박스로 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-todo",
        type: "to_do",
        to_do: {
          rich_text: [{ plain_text: "할 일", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
          checked: true,
        },
      },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(screen.getByText("할 일")).toBeInTheDocument();
      expect(container.querySelector("input[type='checkbox']")).toBeChecked();
    });
  });

  it("quote 블록을 인용구로 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-quote",
        type: "quote",
        quote: {
          rich_text: [{ plain_text: "인용구 내용", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
        },
      },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelector("blockquote")).toBeInTheDocument();
      expect(screen.getByText("인용구 내용")).toBeInTheDocument();
    });
  });

  it("code 블록을 pre/code로 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-code",
        type: "code",
        code: {
          rich_text: [{ plain_text: "console.log('hello')", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
          language: "javascript",
        },
      },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelector("pre")).toBeInTheDocument();
      expect(screen.getByText("console.log('hello')")).toBeInTheDocument();
    });
  });

  it("callout 블록을 이모지와 함께 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-callout",
        type: "callout",
        callout: {
          rich_text: [{ plain_text: "중요 안내", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
          icon: { emoji: "💡" },
        },
      },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("💡")).toBeInTheDocument();
      expect(screen.getByText("중요 안내")).toBeInTheDocument();
    });
  });

  it("image 블록(external)을 img 태그로 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-img",
        type: "image",
        image: {
          type: "external",
          external: { url: "https://example.com/image.png" },
        },
      },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/image.png");
    });
  });

  it("paragraph에 rich_text가 비어있으면 br 태그를 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-empty-para",
        type: "paragraph",
        paragraph: { rich_text: [] },
      },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelector("br")).toBeInTheDocument();
    });
  });

  it("italic 어노테이션이 적용된 rich text를 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-italic",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              plain_text: "기울임 텍스트",
              href: null,
              annotations: { bold: false, italic: true, strikethrough: false, underline: false, code: false },
            },
          ],
        },
      },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("기울임 텍스트")).toHaveClass("italic");
    });
  });

  it("strikethrough 어노테이션이 적용된 rich text를 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-strike",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              plain_text: "취소선 텍스트",
              href: null,
              annotations: { bold: false, italic: false, strikethrough: true, underline: false, code: false },
            },
          ],
        },
      },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("취소선 텍스트")).toHaveClass("line-through");
    });
  });

  it("underline 어노테이션이 적용된 rich text를 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-underline",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              plain_text: "밑줄 텍스트",
              href: null,
              annotations: { bold: false, italic: false, strikethrough: false, underline: true, code: false },
            },
          ],
        },
      },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("밑줄 텍스트")).toHaveClass("underline");
    });
  });

  it("image 블록(file 타입)을 img 태그로 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-img-file",
        type: "image",
        image: {
          type: "file",
          file: { url: "https://s3.amazonaws.com/image.png" },
        },
      },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      const img = container.querySelector("img");
      expect(img).toHaveAttribute("src", "https://s3.amazonaws.com/image.png");
    });
  });

  it("image 블록에 URL이 없으면 렌더링을 생략한다", async () => {
    mockFetchSuccess([
      {
        id: "block-img-empty",
        type: "image",
        image: { type: "file" },
      },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
    });
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("callout 블록에 이모지가 없어도 렌더링한다", async () => {
    mockFetchSuccess([
      {
        id: "block-callout-no-icon",
        type: "callout",
        callout: {
          rich_text: [{ plain_text: "이모지 없는 안내", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
          icon: {},
        },
      },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("이모지 없는 안내")).toBeInTheDocument();
    });
  });

  it("to_do 블록이 미체크 상태일 때 체크박스가 비어있다", async () => {
    mockFetchSuccess([
      {
        id: "block-todo-unchecked",
        type: "to_do",
        to_do: {
          rich_text: [{ plain_text: "미완료 할 일", href: null, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false } }],
          checked: false,
        },
      },
    ]);

    const { container } = render(
      <NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />
    );

    await waitFor(() => {
      const checkbox = container.querySelector("input[type='checkbox']");
      expect(checkbox).not.toBeChecked();
    });
  });

  it("지원하지 않는 블록 타입(default)은 null을 반환한다", async () => {
    mockFetchSuccess([
      { id: "block-unknown", type: "child_page", child_page: { title: "서브페이지" } },
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);

    // 로딩 완료까지 대기
    await waitFor(() => {
      expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
    });

    // 내용은 없지만 에러도 없다 (blocks.length > 0이지만 모두 null 반환)
    expect(screen.queryByText("내용이 없습니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("에러")).not.toBeInTheDocument();
  });

  it("rich_text가 없는 블록들을 에러 없이 처리한다 (null 방어 분기)", async () => {
    // 각 블록 타입에서 data.rich_text ?? [] 의 null 분기를 커버
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
    ]);

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
    });

    expect(screen.queryByText(/페이지를 불러오지 못했습니다/)).not.toBeInTheDocument();
  });

  it("에러 응답에 error 필드가 없으면 'Unknown error'로 처리한다", async () => {
    // data.error ?? "Unknown error" 의 null 분기 커버
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Unknown error/)).toBeInTheDocument();
    });
  });

  it("fetch가 Error 인스턴스가 아닌 값으로 실패하면 기본 에러 메시지를 표시한다", async () => {
    // err instanceof Error 의 false 분기 커버
    mockFetch.mockRejectedValueOnce("string error");

    render(<NotionModal pageUrl={TEST_URL} pageTitle={TEST_TITLE} onClose={() => {}} />);

    await waitFor(() => {
      expect(
        screen.getByText("페이지를 불러오지 못했습니다. Notion 통합 설정을 확인해주세요.")
      ).toBeInTheDocument();
    });
  });
});
