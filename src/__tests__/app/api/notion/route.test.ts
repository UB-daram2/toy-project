/**
 * @jest-environment node
 *
 * Notion API Route 테스트
 * GET /api/notion/[pageId]
 * - formatPageId: 32자리 ID → UUID 변환
 * - convertRichText: 장식 세그먼트 → 공식 rich_text 형식
 * - convertBlock: 내부 타입 → 공식 API 타입 변환
 * - GET handler: fetch 성공/실패/예외 분기, Cache-Control 헤더
 */

import { GET } from "@/app/api/notion/[pageId]/route";

// fetch 전역 모킹
const mockFetch = jest.fn();
global.fetch = mockFetch;

/** 테스트용 params 헬퍼 */
function makeParams(pageId: string) {
  return { params: Promise.resolve({ pageId }) };
}

/** 32자리 ID 샘플 */
const RAW_ID = "40e1f915abc1234567890123456789ab";
/** UUID 형식으로 변환된 값 */
const UUID_ID = "40e1f915-abc1-2345-6789-0123456789ab";

/** Notion recordMap mock 빌더 */
function makeRecordMap(
  pageId: string,
  contentIds: string[],
  blocks: Record<string, { type: string; properties?: object; format?: object }>
) {
  const blockMap: Record<string, { value: object }> = {
    [pageId]: { value: { type: "page", content: contentIds } },
  };
  for (const [id, value] of Object.entries(blocks)) {
    blockMap[id] = { value };
  }
  return { recordMap: { block: blockMap } };
}

beforeEach(() => {
  mockFetch.mockClear();
});

describe("Notion Route — formatPageId", () => {
  it("32자리 ID를 UUID 형식으로 변환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeRecordMap(UUID_ID, [], {}),
    });
    await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.pageId).toBe(UUID_ID);
  });

  it("이미 UUID 형식인 ID는 그대로 유지한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeRecordMap(UUID_ID, [], {}),
    });
    await GET(new Request("http://localhost"), makeParams(UUID_ID));
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.pageId).toBe(UUID_ID);
  });
});

describe("Notion Route — GET 정상 응답", () => {
  it("paragraph(text) 블록을 변환해 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "text", properties: { title: [["안녕하세요"]] } },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.blocks).toHaveLength(1);
    expect(body.blocks[0].type).toBe("paragraph");
    expect(body.blocks[0].paragraph.rich_text[0].plain_text).toBe("안녕하세요");
  });

  it("heading_1(header) 블록을 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "header", properties: { title: [["제목"]] } },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].type).toBe("heading_1");
  });

  it("to_do 블록의 checked 상태를 올바르게 변환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: {
            type: "to_do",
            properties: { title: [["할 일"]], checked: [["Yes"]] },
          },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].to_do.checked).toBe(true);
  });

  it("to_do 미체크 상태를 올바르게 변환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "to_do", properties: { title: [["미체크"]] } },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].to_do.checked).toBe(false);
  });

  it("code 블록의 language를 추출한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: {
            type: "code",
            properties: { title: [["console.log()"]], language: [["javascript"]] },
          },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].code.language).toBe("javascript");
  });

  it("callout 블록의 icon을 추출한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: {
            type: "callout",
            properties: { title: [["주의사항"]] },
            format: { page_icon: "⚠️" },
          },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].callout.icon.emoji).toBe("⚠️");
  });

  it("image 블록(display_source)을 external 형식으로 변환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: {
            type: "image",
            format: { display_source: "https://example.com/img.png" },
          },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].image.external.url).toBe("https://example.com/img.png");
  });

  it("image 블록(source)을 file 형식으로 변환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: {
            type: "image",
            properties: { source: [["https://s3.amazonaws.com/img.png"]] },
          },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].image.file.url).toBe("https://s3.amazonaws.com/img.png");
  });

  it("child_page(page) 블록에 notion URL을 포함한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "page", properties: { title: [["서브페이지"]] } },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].type).toBe("child_page");
    expect(body.blocks[0].child_page.url).toContain("notion.so");
  });

  it("divider 블록을 빈 객체로 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "divider" },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].type).toBe("divider");
    expect(body.blocks[0].divider).toEqual({});
  });

  it("지원하지 않는 블록 타입은 필터링된다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1", "b2"], {
          b1: { type: "text", properties: { title: [["텍스트"]] } },
          b2: { type: "unknown_type" },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks).toHaveLength(1);
  });

  it("blockMap에 없는 블록 ID는 건너뛴다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recordMap: {
          block: {
            [UUID_ID]: { value: { type: "page", content: ["ghost-id"] } },
            // ghost-id는 blockMap에 없음
          },
        },
      }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks).toHaveLength(0);
  });
});

describe("Notion Route — rich_text 장식 변환", () => {
  it("bold 장식을 올바르게 변환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "text", properties: { title: [["굵게", [["b"]]]] } },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].paragraph.rich_text[0].annotations.bold).toBe(true);
  });

  it("italic 장식을 올바르게 변환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "text", properties: { title: [["기울임", [["i"]]]] } },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].paragraph.rich_text[0].annotations.italic).toBe(true);
  });

  it("link(a) 장식에서 href를 추출한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: {
            type: "text",
            properties: { title: [["링크", [["a", "https://example.com"]]]] },
          },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].paragraph.rich_text[0].href).toBe("https://example.com");
  });

  it("장식 없는 세그먼트는 기본 annotations를 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "text", properties: { title: [["일반 텍스트"]] } },
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    const ann = body.blocks[0].paragraph.rich_text[0].annotations;
    expect(ann.bold).toBe(false);
    expect(ann.italic).toBe(false);
    expect(ann.href).toBeUndefined();
  });

  it("빈 title 세그먼트는 빈 rich_text를 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        makeRecordMap(UUID_ID, ["b1"], {
          b1: { type: "text" }, // properties 없음
        }),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    const body = await res.json();
    expect(body.blocks[0].paragraph.rich_text).toEqual([]);
  });
});

describe("Notion Route — 에러 처리", () => {
  it("Notion API non-OK 응답 시 502와 에러 메시지를 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain("Notion API 오류");
  });

  it("fetch 예외 발생 시 500을 반환한다", async () => {
    mockFetch.mockRejectedValueOnce(new Error("네트워크 오류"));
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("네트워크 오류");
  });

  it("비-Error 예외 발생 시 500을 반환한다", async () => {
    mockFetch.mockRejectedValueOnce("문자열 예외");
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("알 수 없는 오류");
  });
});

describe("Notion Route — Cache-Control 헤더", () => {
  it("정상 응답에 Cache-Control 헤더가 포함된다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeRecordMap(UUID_ID, [], {}),
    });
    const res = await GET(new Request("http://localhost"), makeParams(RAW_ID));
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=60"
    );
  });
});
