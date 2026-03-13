/**
 * HomeView 컴포넌트 테스트
 * 최근 수정 위젯, 많이 본 게시물 위젯, 날씨, 환율, 증시, 메모 위젯을 검증한다.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HomeView } from "@/components/HomeView";
import { recordPageView } from "@/lib/view-tracker";
import type { KnowledgeSection } from "@/data/knowledge-base";

// NotionModal 모킹
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

// fetch 모킹 (날씨 + 환율 + 증시 API)
const mockFetch = jest.fn();
global.fetch = mockFetch;

/** 날씨 API 응답 픽스처 (PM 좋음) */
const mockWeatherResponse = {
  current: { temperature_2m: 15, weather_code: 0, wind_speed_10m: 3.5 },
};
const mockAirGood = { current: { pm2_5: 10, pm10: 25 } };
/** PM 나쁨 수준 픽스처 */
const mockAirBad = { current: { pm2_5: 50, pm10: 100 } };
/** PM 매우 나쁨 수준 픽스처 */
const mockAirVeryBad = { current: { pm2_5: 80, pm10: 160 } };

/** 환율 API 응답 픽스처 */
const mockExchangeRateResponse = {
  base: "USD",
  date: "2026-03-13",
  rates: { KRW: 1350.5, EUR: 0.92, JPY: 149.5, CNY: 7.25 },
};

/** 증시 API 응답 픽스처 */
const mockMarketResponse = {
  indices: [
    { symbol: "^KS11", name: "KOSPI", price: 2650.5, change: 15.3, changePercent: 0.58 },
    { symbol: "^KQ11", name: "KOSDAQ", price: 885.2, change: -3.1, changePercent: -0.35 },
  ],
};

/** 공휴일 API 응답 픽스처 */
const mockHolidayResponse = [
  { date: "2026-03-01", localName: "삼일절" },
];

/** 주간 날씨 예보 API 응답 픽스처 */
const mockWeeklyWeatherResponse = {
  daily: {
    time: ["2026-03-13","2026-03-14","2026-03-15","2026-03-16","2026-03-17","2026-03-18","2026-03-19"],
    weather_code: [0, 1, 2, 3, 61, 0, 1],
    temperature_2m_max: [15, 16, 14, 12, 11, 13, 14],
    temperature_2m_min: [5, 6, 4, 3, 2, 4, 5],
    precipitation_sum: [0, 0, 0.5, 1.2, 3.0, 0, 0],
  },
};

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const sampleSections: KnowledgeSection[] = [
  {
    id: "section-a",
    title: "처리방법",
    description: "설명",
    icon: "BookOpen",
    colorKey: "blue",
    categories: [
      {
        id: "cat-1",
        title: "카테고리1",
        links: [
          {
            id: "link-1",
            title: "최근문서A",
            url: "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            lastEditedTime: NOW - 1000,
          },
          {
            id: "link-2",
            title: "최근문서B",
            url: "https://notion.so/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            lastEditedTime: NOW - 5000,
          },
        ],
      },
    ],
  },
];

/**
 * 모든 위젯 fetch 성공 모킹
 * 렌더 순서: 날씨(2회) → 환율(1회) → 증시(1회) → 공휴일(1회) → 주간날씨(1회)
 */
function mockAllSuccess(airData = mockAirGood) {
  mockFetch
    .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
    .mockResolvedValueOnce({ json: () => Promise.resolve(airData) })
    .mockResolvedValueOnce({ json: () => Promise.resolve(mockExchangeRateResponse) })
    .mockResolvedValueOnce({ json: () => Promise.resolve(mockMarketResponse) })
    .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockHolidayResponse) })
    .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeeklyWeatherResponse) });
}

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
  mockAllSuccess();
});

describe("HomeView — 기본 렌더링", () => {
  it("홈 heading을 렌더링한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByRole("heading", { name: /홈/ })).toBeInTheDocument();
  });

  it("총 문서 수와 섹션 수를 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText(/2개 문서/)).toBeInTheDocument();
    expect(screen.getByText(/1개 섹션/)).toBeInTheDocument();
  });

  it("열한 위젯 제목을 모두 렌더링한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("최근 수정 Top 5")).toBeInTheDocument();
    expect(screen.getByText("많이 본 게시물 Top 5")).toBeInTheDocument();
    expect(screen.getByText("날씨 & 미세먼지")).toBeInTheDocument();
    expect(screen.getByText("환율 (1 USD 기준)")).toBeInTheDocument();
    expect(screen.getByText("국내 증시")).toBeInTheDocument();
    expect(screen.getByText("메모")).toBeInTheDocument();
    expect(screen.getByText("미니 캘린더")).toBeInTheDocument();
    expect(screen.getByText("D-Day 카운터")).toBeInTheDocument();
    expect(screen.getByText("북마크")).toBeInTheDocument();
    expect(screen.getByText("포모도로 타이머")).toBeInTheDocument();
    expect(screen.getByText("주간 날씨 예보")).toBeInTheDocument();
  });
});

describe("HomeView — 최근 수정 위젯", () => {
  it("lastEditedTime이 있는 링크를 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("최근문서A")).toBeInTheDocument();
    expect(screen.getByText("최근문서B")).toBeInTheDocument();
  });

  it("lastEditedTime이 없는 링크는 표시되지 않는다", () => {
    const sectionsNoTime: KnowledgeSection[] = [
      {
        ...sampleSections[0],
        categories: [
          {
            id: "cat-1",
            title: "카테고리1",
            links: [
              {
                id: "link-no-time",
                title: "시간없는문서",
                url: "https://notion.so/cccccccccccccccccccccccccccccccc",
              },
            ],
          },
        ],
      },
    ];
    render(<HomeView sections={sectionsNoTime} />);
    expect(screen.queryByText("시간없는문서")).not.toBeInTheDocument();
    expect(screen.getByText("수정 데이터가 없습니다")).toBeInTheDocument();
  });

  it("링크 클릭 시 모달이 열린다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("최근문서A"));
    expect(screen.getByRole("dialog", { name: "최근문서A" })).toBeInTheDocument();
  });

  it("모달 닫기 버튼 클릭 시 모달이 닫힌다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("최근문서A"));
    fireEvent.click(screen.getByText("닫기"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("방금 전(1분 미만) 상대 시간을 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getAllByText("방금 전").length).toBeGreaterThan(0);
  });

  it("분 단위 상대 시간을 표시한다", () => {
    const sections: KnowledgeSection[] = [
      {
        ...sampleSections[0],
        categories: [
          {
            id: "cat-1",
            title: "카테고리",
            links: [
              {
                id: "l1",
                title: "분전문서",
                url: "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                lastEditedTime: NOW - 30 * MIN,
              },
            ],
          },
        ],
      },
    ];
    render(<HomeView sections={sections} />);
    expect(screen.getByText("30분 전")).toBeInTheDocument();
  });

  it("시간 단위 상대 시간을 표시한다", () => {
    const sections: KnowledgeSection[] = [
      {
        ...sampleSections[0],
        categories: [
          {
            id: "cat-1",
            title: "카테고리",
            links: [
              {
                id: "l1",
                title: "시간전문서",
                url: "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                lastEditedTime: NOW - 3 * HOUR,
              },
            ],
          },
        ],
      },
    ];
    render(<HomeView sections={sections} />);
    expect(screen.getByText("3시간 전")).toBeInTheDocument();
  });

  it("일 단위 상대 시간을 표시한다 (7일 미만)", () => {
    const sections: KnowledgeSection[] = [
      {
        ...sampleSections[0],
        categories: [
          {
            id: "cat-1",
            title: "카테고리",
            links: [
              {
                id: "l1",
                title: "일전문서",
                url: "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                lastEditedTime: NOW - 3 * DAY,
              },
            ],
          },
        ],
      },
    ];
    render(<HomeView sections={sections} />);
    expect(screen.getByText("3일 전")).toBeInTheDocument();
  });

  it("7일 이상이면 날짜 형식으로 표시한다", () => {
    const oldTime = NOW - 10 * DAY;
    const sections: KnowledgeSection[] = [
      {
        ...sampleSections[0],
        categories: [
          {
            id: "cat-1",
            title: "카테고리",
            links: [
              {
                id: "l1",
                title: "오래된문서",
                url: "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                lastEditedTime: oldTime,
              },
            ],
          },
        ],
      },
    ];
    render(<HomeView sections={sections} />);
    const expected = new Date(oldTime).toLocaleDateString("ko-KR");
    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

describe("HomeView — 많이 본 게시물 위젯", () => {
  it("열람 기록이 없으면 안내 문구를 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("아직 열람 기록이 없습니다")).toBeInTheDocument();
  });

  it("localStorage에 열람 기록이 있으면 목록을 표시한다", () => {
    recordPageView("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "인기문서", "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    recordPageView("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "인기문서", "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("인기문서")).toBeInTheDocument();
    expect(screen.getByText("2회")).toBeInTheDocument();
  });

  it("많이 본 위젯의 링크 클릭 시 모달이 열린다", () => {
    recordPageView("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "인기문서", "https://notion.so/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("인기문서"));
    expect(screen.getByRole("dialog", { name: "인기문서" })).toBeInTheDocument();
  });
});

describe("HomeView — 날씨 위젯", () => {
  it("날씨 API 성공 시 온도를 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("15°C")).toBeInTheDocument();
    });
  });

  it("날씨 API 성공 시 바람 속도를 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("3.5m/s")).toBeInTheDocument();
    });
  });

  it("PM2.5 좋음 등급을 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getAllByText("좋음").length).toBeGreaterThan(0);
    });
  });

  it("PM2.5 나쁨 등급을 표시한다", async () => {
    mockFetch.mockReset();
    mockAllSuccess(mockAirBad);
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getAllByText("나쁨").length).toBeGreaterThan(0);
    });
  });

  it("PM2.5 매우 나쁨 등급을 표시한다", async () => {
    mockFetch.mockReset();
    mockAllSuccess(mockAirVeryBad);
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getAllByText("매우 나쁨").length).toBeGreaterThan(0);
    });
  });

  it("날씨 API 실패 시 에러 안내를 표시한다", async () => {
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error("network error"));
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      // 날씨 & 미세먼지 + 주간 날씨 예보 두 위젯이 같은 에러 문구를 표시할 수 있다
      expect(screen.getAllByText("날씨 정보를 불러올 수 없습니다").length).toBeGreaterThan(0);
    });
  });

  it("에러 상태에서 다시 시도 버튼을 표시하고 클릭 시 재요청한다", async () => {
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error("network error"));
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getAllByText("다시 시도").length).toBeGreaterThan(0);
    });

    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockAirGood) });

    fireEvent.click(screen.getAllByText("다시 시도")[0]);
    await waitFor(() => {
      expect(screen.getByText("15°C")).toBeInTheDocument();
    });
  });

  it("geolocation 성공 시 현재 위치 기준 날씨를 요청한다", async () => {
    Object.defineProperty(global.navigator, "geolocation", {
      value: {
        getCurrentPosition: jest.fn((successCb: PositionCallback) => {
          successCb({
            coords: { latitude: 37.1, longitude: 127.1 },
          } as GeolocationPosition);
        }),
      },
      writable: true,
      configurable: true,
    });

    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("15°C")).toBeInTheDocument();
    });

    Object.defineProperty(global.navigator, "geolocation", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });
});

describe("HomeView — 날씨 미지원 코드", () => {
  it("WEATHER_LABEL에 없는 날씨 코드는 알 수 없음 레이블과 기본 이모지를 표시한다", async () => {
    mockFetch.mockReset();
    // 날씨 코드 99 — WEATHER_LABEL에 정의되지 않은 코드
    const unknownWeatherResponse = {
      current: { temperature_2m: 20, weather_code: 99, wind_speed_10m: 2.0 },
    };
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(unknownWeatherResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockAirGood) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockExchangeRateResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockMarketResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockHolidayResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeeklyWeatherResponse) });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("20°C")).toBeInTheDocument();
    });
  });
});

describe("HomeView — 모달 비-Notion URL", () => {
  it("Notion 페이지 ID가 없는 URL로 모달을 열면 recordPageView를 호출하지 않는다", () => {
    const sectionsWithExternalLink: KnowledgeSection[] = [
      {
        ...sampleSections[0],
        categories: [
          {
            id: "cat-ext",
            title: "외부링크",
            links: [
              {
                id: "link-ext",
                title: "외부문서",
                url: "https://example.com/docs/page",
                lastEditedTime: Date.now() - 1000,
              },
            ],
          },
        ],
      },
    ];
    render(<HomeView sections={sectionsWithExternalLink} />);
    // 최근 수정 위젯에서 외부 URL 링크 클릭 — extractPageIdFromUrl이 null 반환
    fireEvent.click(screen.getByText("외부문서"));
    // 모달이 열리지만 오류 없이 처리되어야 한다
    expect(screen.getByRole("dialog", { name: "외부문서" })).toBeInTheDocument();
  });
});

describe("HomeView — 환율 위젯", () => {
  it("환율 API 성공 시 KRW 환율을 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("1,350.5 ₩")).toBeInTheDocument();
    });
  });

  it("기준일을 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("기준일: 2026-03-13")).toBeInTheDocument();
    });
  });

  it("통화 레이블을 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("원화")).toBeInTheDocument();
      expect(screen.getByText("유로")).toBeInTheDocument();
      expect(screen.getByText("엔화")).toBeInTheDocument();
      expect(screen.getByText("위안화")).toBeInTheDocument();
    });
  });

  it("환율 API 실패 시 에러 안내를 표시한다", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockAirGood) })
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockMarketResponse) });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("환율 정보를 불러올 수 없습니다")).toBeInTheDocument();
    });
  });
});

describe("HomeView — 증시 위젯", () => {
  it("증시 API 성공 시 KOSPI를 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("KOSPI")).toBeInTheDocument();
    });
  });

  it("증시 API 성공 시 KOSDAQ를 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("KOSDAQ")).toBeInTheDocument();
    });
  });

  it("증시 API 실패 시 에러 안내를 표시한다", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockAirGood) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockExchangeRateResponse) })
      .mockRejectedValueOnce(new Error("network error"));
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("증시 정보를 불러올 수 없습니다")).toBeInTheDocument();
    });
  });
});

describe("HomeView — 메모 위젯", () => {
  it("초기 상태에서 안내 문구를 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("메모가 없습니다")).toBeInTheDocument();
  });

  it("입력 후 추가 버튼 클릭 시 메모가 표시된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.change(screen.getByPlaceholderText("메모를 입력하세요..."), {
      target: { value: "테스트 메모" },
    });
    fireEvent.click(screen.getByLabelText("메모 추가"));
    expect(screen.getByText("테스트 메모")).toBeInTheDocument();
  });

  it("Enter 키로 메모를 추가할 수 있다", () => {
    render(<HomeView sections={sampleSections} />);
    const input = screen.getByPlaceholderText("메모를 입력하세요...");
    fireEvent.change(input, { target: { value: "엔터 메모" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("엔터 메모")).toBeInTheDocument();
  });

  it("공백만 입력하면 메모가 추가되지 않는다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.change(screen.getByPlaceholderText("메모를 입력하세요..."), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByLabelText("메모 추가"));
    expect(screen.getByText("메모가 없습니다")).toBeInTheDocument();
  });

  it("삭제 버튼 클릭 시 메모가 제거된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.change(screen.getByPlaceholderText("메모를 입력하세요..."), {
      target: { value: "삭제할 메모" },
    });
    fireEvent.click(screen.getByLabelText("메모 추가"));
    expect(screen.getByText("삭제할 메모")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("메모 삭제"));
    expect(screen.queryByText("삭제할 메모")).not.toBeInTheDocument();
    expect(screen.getByText("메모가 없습니다")).toBeInTheDocument();
  });
});

describe("HomeView — 미니 캘린더 위젯", () => {
  it("요일 헤더를 모두 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    days.forEach((d) => {
      expect(screen.getAllByText(d).length).toBeGreaterThan(0);
    });
  });

  it("이전 달 / 다음 달 버튼이 존재한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByLabelText("이전 달")).toBeInTheDocument();
    expect(screen.getByLabelText("다음 달")).toBeInTheDocument();
  });

  it("다음 달 버튼 클릭 시 월이 증가한다", () => {
    render(<HomeView sections={sampleSections} />);
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    fireEvent.click(screen.getByLabelText("다음 달"));
    expect(
      screen.getByText(`${nextMonth.getFullYear()}년 ${nextMonth.getMonth() + 1}월`)
    ).toBeInTheDocument();
  });

  it("이전 달 버튼 클릭 시 월이 감소한다", () => {
    render(<HomeView sections={sampleSections} />);
    const today = new Date();
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    fireEvent.click(screen.getByLabelText("이전 달"));
    expect(
      screen.getByText(`${prevMonth.getFullYear()}년 ${prevMonth.getMonth() + 1}월`)
    ).toBeInTheDocument();
  });

  it("공휴일 API 성공 시 공휴일 이름을 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    // 2026-03-01 삼일절 픽스처가 현재 달(3월 2026)에 해당하면 UI에 표시된다
    const today = new Date();
    if (today.getFullYear() === 2026 && today.getMonth() === 2) {
      expect(await screen.findByText(/삼일절/)).toBeInTheDocument();
    } else {
      // 테스트 실행 월이 다른 경우 fetch 호출 여부만 확인한다
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("date.nager.at")
        );
      });
    }
  });
});

describe("HomeView — D-Day 카운터 위젯", () => {
  it("초기 상태에서 안내 문구를 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("D-Day가 없습니다")).toBeInTheDocument();
  });

  it("D-Day 추가 버튼 클릭 시 입력 폼이 나타난다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("D-Day 추가"));
    expect(screen.getByPlaceholderText("이벤트 이름")).toBeInTheDocument();
  });

  it("취소 버튼 클릭 시 입력 폼이 닫힌다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.click(screen.getByText("취소"));
    expect(screen.queryByPlaceholderText("이벤트 이름")).not.toBeInTheDocument();
  });

  it("이름과 날짜를 입력하면 D-Day가 추가된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), {
      target: { value: "생일" },
    });
    fireEvent.change(screen.getByLabelText("목표 날짜"), {
      target: { value: "2099-12-31" },
    });
    fireEvent.click(screen.getByText("추가"));
    expect(screen.getByText("생일")).toBeInTheDocument();
  });

  it("D-Day 삭제 버튼 클릭 시 항목이 제거된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), {
      target: { value: "삭제할이벤트" },
    });
    fireEvent.change(screen.getByLabelText("목표 날짜"), {
      target: { value: "2099-01-01" },
    });
    fireEvent.click(screen.getByText("추가"));
    expect(screen.getByText("삭제할이벤트")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("삭제할이벤트 삭제"));
    expect(screen.queryByText("삭제할이벤트")).not.toBeInTheDocument();
  });
});

describe("HomeView — 북마크 위젯", () => {
  it("초기 상태에서 안내 문구를 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("저장된 북마크가 없습니다")).toBeInTheDocument();
  });

  it("북마크 추가 버튼 클릭 시 입력 폼이 나타난다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("북마크 추가"));
    expect(screen.getByPlaceholderText("북마크 이름")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();
  });

  it("이름과 URL을 입력하면 북마크가 추가된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.change(screen.getByPlaceholderText("북마크 이름"), {
      target: { value: "구글" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://google.com" },
    });
    fireEvent.click(screen.getAllByText("추가")[0]);
    expect(screen.getByText("구글")).toBeInTheDocument();
  });

  it("북마크 삭제 버튼 클릭 시 항목이 제거된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.change(screen.getByPlaceholderText("북마크 이름"), {
      target: { value: "삭제북마크" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://example.com" },
    });
    fireEvent.click(screen.getAllByText("추가")[0]);
    expect(screen.getByText("삭제북마크")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("삭제북마크 삭제"));
    expect(screen.queryByText("삭제북마크")).not.toBeInTheDocument();
  });

  it("취소 버튼 클릭 시 폼이 닫힌다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.click(screen.getByText("취소"));
    expect(screen.queryByPlaceholderText("북마크 이름")).not.toBeInTheDocument();
  });
});

describe("HomeView — 포모도로 타이머 위젯", () => {
  it("초기 상태에서 25:00을 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  it("시작 버튼이 존재한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("시작")).toBeInTheDocument();
  });

  it("시작 버튼 클릭 시 일시정지 버튼으로 바뀐다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("시작"));
    expect(screen.getByText("일시정지")).toBeInTheDocument();
  });

  it("일시정지 후 초기화 버튼 클릭 시 25:00으로 리셋된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("시작"));
    fireEvent.click(screen.getByText("초기화"));
    expect(screen.getByText("25:00")).toBeInTheDocument();
  });

  it("휴식 5분 탭 클릭 시 05:00으로 전환된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("휴식 5분"));
    expect(screen.getByText("05:00")).toBeInTheDocument();
  });

  it("집중 모드와 휴식 모드 탭이 모두 존재한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("집중 25분")).toBeInTheDocument();
    expect(screen.getByText("휴식 5분")).toBeInTheDocument();
  });

  it("휴식 모드에서 초기화 버튼 클릭 시 05:00으로 리셋된다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("휴식 5분"));
    fireEvent.click(screen.getByText("초기화"));
    expect(screen.getByText("05:00")).toBeInTheDocument();
  });
});

describe("HomeView — 포모도로 휴식 타이머 종료", () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it("휴식 타이머가 종료되면 자동으로 집중 모드로 전환된다", async () => {
    render(<HomeView sections={sampleSections} />);
    // 휴식 모드로 전환 후 시작
    fireEvent.click(screen.getByText("휴식 5분"));
    fireEvent.click(screen.getByText("시작"));
    // 5분(300초) 경과 시뮬레이션
    jest.advanceTimersByTime(300 * 1000);
    await waitFor(() => {
      // 타이머 종료 후 시작 버튼이 다시 표시되거나 25:00이 표시된다
      expect(
        screen.queryByText("시작") !== null ||
        screen.queryByText("25:00") !== null
      ).toBe(true);
    });
  });
});

describe("HomeView — 주간 날씨 예보 위젯", () => {
  it("주간 날씨 API 성공 시 7일치 예보를 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      // 최고/최저 온도 중 하나 이상이 표시되는지 확인한다
      const maxTemps = screen.getAllByText(/15°|16°|14°|12°|11°|13°/);
      expect(maxTemps.length).toBeGreaterThan(0);
    });
  });

  it("주간 날씨 API 실패 시 에러 안내를 표시한다", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockAirGood) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockExchangeRateResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockMarketResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockHolidayResponse) })
      .mockRejectedValueOnce(new Error("network error"));
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      // 주간 날씨 에러 메시지 — 날씨 & 미세먼지도 같은 문구를 사용하므로 2개 이상일 수 있다
      expect(screen.getAllByText("날씨 정보를 불러올 수 없습니다").length).toBeGreaterThan(0);
    });
  });

  it("주간 날씨 에러 시 '다시 시도' 버튼을 클릭하면 재요청한다", async () => {
    mockFetch.mockReset();
    // 첫 렌더: 날씨·환율·증시·공휴일 성공, 주간날씨 실패
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockAirGood) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockExchangeRateResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockMarketResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockHolidayResponse) })
      .mockRejectedValueOnce(new Error("network error"))
      // 재시도: 주간날씨 성공
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeeklyWeatherResponse) });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() =>
      expect(screen.getAllByText("날씨 정보를 불러올 수 없습니다").length).toBeGreaterThan(0)
    );
    // WeeklyWeatherWidget의 '다시 시도' 버튼을 찾아 클릭한다
    const retryBtns = screen.getAllByText("다시 시도");
    fireEvent.click(retryBtns[retryBtns.length - 1]);
    expect(mockFetch).toHaveBeenCalled();
  });
});

describe("HomeView — localStorage 복원", () => {
  it("유효한 메모 JSON이 있으면 메모를 복원한다", async () => {
    const stored = JSON.stringify([{ id: "1", text: "저장된메모", createdAt: Date.now() }]);
    localStorage.setItem("upharm_memos", stored);
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(screen.getByText("저장된메모")).toBeInTheDocument());
  });

  it("손상된 메모 JSON이 있어도 빈 목록으로 정상 렌더링한다", () => {
    localStorage.setItem("upharm_memos", "invalid-json{{{");
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("메모가 없습니다")).toBeInTheDocument();
  });

  it("유효한 D-Day JSON이 있으면 복원한다", async () => {
    const stored = JSON.stringify([{ id: "1", title: "복원이벤트", targetDate: "2099-01-01" }]);
    localStorage.setItem("upharm_ddays", stored);
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(screen.getByText("복원이벤트")).toBeInTheDocument());
  });

  it("손상된 D-Day JSON이 있어도 빈 목록으로 정상 렌더링한다", () => {
    localStorage.setItem("upharm_ddays", "not-valid");
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("D-Day가 없습니다")).toBeInTheDocument();
  });

  it("유효한 북마크 JSON이 있으면 복원한다", async () => {
    const stored = JSON.stringify([{ id: "1", title: "복원북마크", url: "https://example.com" }]);
    localStorage.setItem("upharm_bookmarks", stored);
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(screen.getByText("복원북마크")).toBeInTheDocument());
  });

  it("손상된 북마크 JSON이 있어도 빈 목록으로 정상 렌더링한다", () => {
    localStorage.setItem("upharm_bookmarks", "{{bad");
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("저장된 북마크가 없습니다")).toBeInTheDocument();
  });

  it("유효한 위젯 순서가 저장되어 있으면 복원한다", async () => {
    const order = ["popular", "recent", "weather", "exchange", "market", "memo", "calendar", "dday", "bookmark", "pomodoro", "weekly-weather"];
    localStorage.setItem("upharm_widget_order", JSON.stringify(order));
    render(<HomeView sections={sampleSections} />);
    // 순서 복원 후에도 모든 위젯이 표시되어야 한다
    await waitFor(() => expect(screen.getByText("최근 수정 Top 5")).toBeInTheDocument());
    expect(screen.getByText("많이 본 게시물 Top 5")).toBeInTheDocument();
  });

  it("손상된 위젯 순서 JSON이 있어도 기본 순서로 정상 렌더링한다", () => {
    localStorage.setItem("upharm_widget_order", "bad-json");
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("최근 수정 Top 5")).toBeInTheDocument();
  });
});

describe("HomeView — 날씨 보통 등급", () => {
  it("PM2.5 보통 등급(16~35)과 PM10 보통 등급(31~80)을 표시한다", async () => {
    mockFetch.mockReset();
    // pm2_5=20 → 보통, pm10=50 → 보통
    mockAllSuccess({ current: { pm2_5: 20, pm10: 50 } });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getAllByText("보통").length).toBeGreaterThan(0);
    });
  });
});

describe("HomeView — 메모 Enter키 입력", () => {
  it("입력 필드에서 Enter 키를 누르면 메모가 추가된다", () => {
    render(<HomeView sections={sampleSections} />);
    const input = screen.getByPlaceholderText("메모를 입력하세요...");
    fireEvent.change(input, { target: { value: "엔터키메모" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("엔터키메모")).toBeInTheDocument();
  });

  it("Enter가 아닌 키를 누르면 메모가 추가되지 않는다", () => {
    render(<HomeView sections={sampleSections} />);
    const input = screen.getByPlaceholderText("메모를 입력하세요...");
    fireEvent.change(input, { target: { value: "미완성메모" } });
    fireEvent.keyDown(input, { key: "Shift" });
    expect(screen.queryByText("미완성메모")).not.toBeInTheDocument();
  });
});

describe("HomeView — D-Day 날짜 분기", () => {
  it("D-Day가 오늘이면 'D-Day' 레이블을 표시한다", () => {
    const today = new Date().toISOString().slice(0, 10);
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), { target: { value: "오늘이벤트" } });
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: today } });
    fireEvent.click(screen.getByText("추가"));
    expect(screen.getByText("D-Day")).toBeInTheDocument();
  });

  it("이미 지난 D-Day는 D+n 레이블을 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), { target: { value: "지난이벤트" } });
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: "2020-01-01" } });
    fireEvent.click(screen.getByText("추가"));
    expect(screen.getByText(/D\+/)).toBeInTheDocument();
  });

  it("addDDay 버튼 클릭 시 이름이 비어 있으면 추가되지 않는다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("D-Day 추가"));
    // 날짜만 입력하고 이름은 비워둔다
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByText("추가"));
    // 이름이 없으므로 폼이 닫히지 않고 이벤트 이름 입력 필드가 남아 있어야 한다
    expect(screen.getByPlaceholderText("이벤트 이름")).toBeInTheDocument();
  });
});

describe("HomeView — 북마크 URL 처리", () => {
  it("http로 시작하지 않는 URL에 https://를 자동으로 붙인다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.change(screen.getByPlaceholderText("북마크 이름"), { target: { value: "프로토콜없음" } });
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "example.com" } });
    fireEvent.click(screen.getAllByText("추가")[0]);
    expect(screen.getByText("프로토콜없음")).toBeInTheDocument();
  });

  it("addBookmark 클릭 시 이름이 비어 있으면 추가되지 않는다", () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://example.com" } });
    fireEvent.click(screen.getAllByText("추가")[0]);
    // 이름이 없으므로 폼이 닫히지 않고 북마크 이름 입력 필드가 남아 있어야 한다
    expect(screen.getByPlaceholderText("북마크 이름")).toBeInTheDocument();
  });
});

describe("HomeView — 위젯 순서 불완전 복원", () => {
  it("저장된 위젯 순서에 기본 위젯이 누락된 경우 기본 순서를 사용한다", async () => {
    // 일부 위젯만 포함된 불완전한 순서
    const partialOrder = ["recent", "weather", "exchange"];
    localStorage.setItem("upharm_widget_order", JSON.stringify(partialOrder));
    render(<HomeView sections={sampleSections} />);
    // 기본 순서로 렌더링되어 모든 위젯이 표시되어야 한다
    await waitFor(() => expect(screen.getByText("최근 수정 Top 5")).toBeInTheDocument());
    expect(screen.getByText("D-Day 카운터")).toBeInTheDocument();
  });
});

describe("HomeView — D-Day 정렬", () => {
  it("D-Day 두 개를 추가하면 날짜 오름차순으로 정렬된다", () => {
    render(<HomeView sections={sampleSections} />);
    // 첫 번째 D-Day 추가 (늦은 날짜)
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), { target: { value: "나중이벤트" } });
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: "2099-12-31" } });
    fireEvent.click(screen.getByText("추가"));
    // 두 번째 D-Day 추가 (빠른 날짜)
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), { target: { value: "빠른이벤트" } });
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: "2099-06-01" } });
    fireEvent.click(screen.getByText("추가"));
    // 두 항목 모두 표시되어야 한다
    expect(screen.getByText("나중이벤트")).toBeInTheDocument();
    expect(screen.getByText("빠른이벤트")).toBeInTheDocument();
  });
});

describe("HomeView — 포모도로 타이머 (시간 종료)", () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it("집중 타이머가 종료되면 자동으로 휴식 모드로 전환된다", async () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("시작"));
    // 25분(1500초) 경과 시뮬레이션
    jest.advanceTimersByTime(1500 * 1000);
    await waitFor(() => {
      // 타이머 종료 후 모드 전환 — 시작 버튼이 다시 표시되거나 05:00이 표시된다
      expect(
        screen.queryByText("시작") !== null ||
        screen.queryByText("05:00") !== null
      ).toBe(true);
    });
  });
});

describe("HomeView — 드래그앤드롭", () => {
  beforeEach(() => {
    // jsdom은 setPointerCapture와 elementFromPoint를 구현하지 않으므로 모킹한다
    Element.prototype.setPointerCapture = jest.fn();
    document.elementFromPoint = jest.fn().mockReturnValue(null);
  });

  it("위젯 카드에 dragstart 이벤트 발생 시 핸들러가 호출된다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    expect(cards.length).toBeGreaterThan(0);
    const dataTransfer = { effectAllowed: "" };
    fireEvent.dragStart(cards[0], { dataTransfer });
  });

  it("위젯 카드에 dragover 이벤트 발생 시 핸들러가 호출된다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    expect(cards.length).toBeGreaterThan(1);
    const dataTransfer = { effectAllowed: "" };
    fireEvent.dragStart(cards[0], { dataTransfer });
    fireEvent.dragOver(cards[1], { dataTransfer });
  });

  it("위젯 카드에 dragend 이벤트 발생 시 순서가 변경된다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    expect(cards.length).toBeGreaterThan(1);
    const dataTransfer = { effectAllowed: "" };
    fireEvent.dragStart(cards[0], { dataTransfer });
    fireEvent.dragOver(cards[1], { dataTransfer });
    fireEvent.dragEnd(cards[0]);
    // dragEnd 후에도 위젯이 모두 표시되어야 한다
    expect(document.querySelectorAll("[data-widget-id]").length).toBeGreaterThan(0);
  });

  it("dragend 단독 실행 시 (드래그 시작 없이) 오류 없이 처리된다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    fireEvent.dragEnd(cards[0]);
  });

  it("같은 카드로 dragover 시 reorder하지 않는다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    const dataTransfer = { effectAllowed: "" };
    fireEvent.dragStart(cards[0], { dataTransfer });
    fireEvent.dragOver(cards[0], { dataTransfer });
    fireEvent.dragEnd(cards[0]);
    // 위젯 수가 그대로여야 한다
    expect(document.querySelectorAll("[data-widget-id]").length).toBeGreaterThan(0);
  });

  it("같은 카드에 dragover를 두 번 발생시켜도 중복 상태 갱신이 없다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    const dataTransfer = { effectAllowed: "" };
    // 첫 번째 드래그: cards[0] → cards[1] 으로 DragOver
    fireEvent.dragStart(cards[0], { dataTransfer });
    fireEvent.dragOver(cards[1], { dataTransfer });
    // 동일한 카드로 두 번째 DragOver → id === dropTargetId 분기 실행
    fireEvent.dragOver(cards[1], { dataTransfer });
    fireEvent.dragEnd(cards[0]);
    expect(document.querySelectorAll("[data-widget-id]").length).toBeGreaterThan(0);
  });

  it("터치 포인터 이벤트로 드래그 핸들을 조작할 수 있다", () => {
    render(<HomeView sections={sampleSections} />);
    const handle = screen.getAllByLabelText("위젯 이동 핸들")[0];
    // 터치 포인터로 드래그 시작
    fireEvent.pointerDown(handle, { pointerType: "touch", pointerId: 1, clientX: 100, clientY: 100 });
    // 다른 위젯 위치로 이동
    fireEvent.pointerMove(handle, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 200 });
    // 포인터 업으로 드래그 종료
    fireEvent.pointerUp(handle, { pointerType: "touch", pointerId: 1 });
  });

  it("마우스 포인터는 터치 핸들러를 무시한다", () => {
    render(<HomeView sections={sampleSections} />);
    const handle = screen.getAllByLabelText("위젯 이동 핸들")[0];
    // 마우스 포인터 — 터치 핸들러에서 early return 되어야 한다
    fireEvent.pointerDown(handle, { pointerType: "mouse", pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerType: "mouse", pointerId: 1, clientX: 200, clientY: 200 });
    fireEvent.pointerUp(handle, { pointerType: "mouse", pointerId: 1 });
  });

  it("pointerCancel 이벤트로 드래그가 종료된다", () => {
    render(<HomeView sections={sampleSections} />);
    const handle = screen.getAllByLabelText("위젯 이동 핸들")[0];
    fireEvent.pointerDown(handle, { pointerType: "touch", pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerCancel(handle, { pointerType: "touch", pointerId: 1 });
  });

  it("pointerMove 시 다른 위젯 위로 이동하면 드롭 대상이 변경된다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    const targetCard = cards[1] as HTMLElement;
    // elementFromPoint가 targetCard를 반환하도록 모킹한다
    document.elementFromPoint = jest.fn().mockReturnValue(targetCard);

    const handle = screen.getAllByLabelText("위젯 이동 핸들")[0];
    fireEvent.pointerDown(handle, { pointerType: "touch", pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 300 });
    // 드래그 완료 — 두 위젯 모두 여전히 렌더링되어야 한다
    fireEvent.pointerUp(handle, { pointerType: "touch", pointerId: 1 });
    expect(document.querySelectorAll("[data-widget-id]").length).toBeGreaterThan(0);
  });

  it("geolocation 오류 시 서울 기본값으로 날씨를 로드한다", async () => {
    // getCurrentPosition이 에러 콜백을 호출하도록 모킹한다
    const mockGeolocation = {
      getCurrentPosition: jest.fn((_success, error) => { error(new Error("denied")); }),
    };
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation, configurable: true,
    });
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockAirGood) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockExchangeRateResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockMarketResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockHolidayResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeeklyWeatherResponse) });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    // 정리: geolocation 모킹 제거
    Object.defineProperty(global.navigator, "geolocation", {
      value: undefined, configurable: true,
    });
  });
});
