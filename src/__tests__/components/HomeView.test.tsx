/**
 * HomeView 컴포넌트 테스트
 * 최근 수정 위젯, 많이 본 게시물 위젯, 날씨 위젯을 검증한다.
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

// fetch 모킹 (날씨 API)
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

/** 기본 날씨 fetch 성공 모킹 */
function mockWeatherSuccess(airData = mockAirGood) {
  mockFetch
    .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
    .mockResolvedValueOnce({ json: () => Promise.resolve(airData) });
}

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
  mockWeatherSuccess();
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

  it("세 위젯 제목을 모두 렌더링한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("최근 수정 Top 5")).toBeInTheDocument();
    expect(screen.getByText("많이 본 게시물 Top 5")).toBeInTheDocument();
    expect(screen.getByText("날씨 & 미세먼지")).toBeInTheDocument();
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
    // NOW - 1000ms, NOW - 5000ms 모두 방금 전 범위
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
      // pm2_5: 10 → 좋음
      expect(screen.getAllByText("좋음").length).toBeGreaterThan(0);
    });
  });

  it("PM2.5 나쁨 등급을 표시한다", async () => {
    mockFetch.mockReset();
    mockWeatherSuccess(mockAirBad);
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      // pm2_5: 50 → 나쁨
      expect(screen.getAllByText("나쁨").length).toBeGreaterThan(0);
    });
  });

  it("PM2.5 매우 나쁨 등급을 표시한다", async () => {
    mockFetch.mockReset();
    mockWeatherSuccess(mockAirVeryBad);
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      // pm2_5: 80 → 매우 나쁨
      expect(screen.getAllByText("매우 나쁨").length).toBeGreaterThan(0);
    });
  });

  it("날씨 API 실패 시 에러 안내를 표시한다", async () => {
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error("network error"));
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("날씨 정보를 불러올 수 없습니다")).toBeInTheDocument();
    });
  });

  it("에러 상태에서 '다시 시도' 버튼을 표시하고 클릭 시 재요청한다", async () => {
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error("network error"));
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("다시 시도")).toBeInTheDocument();
    });

    // 다시 시도 클릭 시 다시 fetch 요청
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockWeatherResponse) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockAirGood) });

    fireEvent.click(screen.getByText("다시 시도"));
    await waitFor(() => {
      expect(screen.getByText("15°C")).toBeInTheDocument();
    });
  });

  it("geolocation 성공 시 현재 위치 기준 날씨를 요청한다", async () => {
    // navigator.geolocation이 success 콜백을 즉시 호출하도록 모킹
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

    // 복원
    Object.defineProperty(global.navigator, "geolocation", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });
});
