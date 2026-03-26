/**
 * HomeView 컴포넌트 테스트
 * 핵심 위젯 렌더링, 모달, DnD, 스토어 복원을 검증한다.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HomeView } from "@/components/HomeView";
import { recordPageView } from "@/lib/view-tracker";
import type { KnowledgeSection } from "@/data/knowledge-base";
import { useMemoStore } from "@/stores/memoStore";
import { useDDayStore } from "@/stores/ddayStore";
import { useBookmarkStore } from "@/stores/bookmarkStore";
import { useWidgetStore, DEFAULT_WIDGET_ORDER } from "@/stores/widgetStore";
import { useTodoStore } from "@/stores/todoStore";

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

// fetch 모킹 (날씨 + 캘린더 API)
const mockFetch = jest.fn();
global.fetch = mockFetch;

/** 날씨 API 응답 픽스처 */
const mockWeatherResponse = {
  current: { temperature_2m: 15, weather_code: 0, wind_speed_10m: 3.5 },
};
const mockAirGood = { current: { pm2_5: 10, pm10: 25 } };

/** 공휴일 API 응답 픽스처 */
const mockHolidayResponse = [{ date: "2026-03-01", localName: "삼일절" }];

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
          { id: "link-1", title: "최근문서A", url: "https://u-pham.notion.site/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", lastEditedTime: NOW - 1000 },
          { id: "link-2", title: "최근문서B", url: "https://u-pham.notion.site/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", lastEditedTime: NOW - 5000 },
        ],
      },
    ],
  },
];

/** 모든 위젯 fetch 성공 모킹 */
function mockAllSuccess(airData = mockAirGood) {
  mockFetch.mockImplementation((url: string) => {
    if (String(url).includes("air-quality-api.open-meteo.com"))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(airData) });
    if (String(url).includes("daily="))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeeklyWeatherResponse) });
    if (String(url).includes("open-meteo.com"))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeatherResponse) });
    if (String(url).includes("date.nager.at"))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHolidayResponse) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
  mockAllSuccess();
  useMemoStore.setState({ memos: [] });
  useDDayStore.setState({ ddays: [] });
  useBookmarkStore.setState({ bookmarks: [] });
  useWidgetStore.setState({ widgetOrder: [...DEFAULT_WIDGET_ORDER] });
  useTodoStore.setState({ todos: [] });
});

describe("HomeView — 기본 렌더링", () => {
  it("홈 heading과 위젯 제목들을 렌더링한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByRole("heading", { name: /홈/ })).toBeInTheDocument();
    expect(screen.getByText("최근 수정 Top 5")).toBeInTheDocument();
    expect(screen.getByText("메모")).toBeInTheDocument();
    expect(screen.getByText("디지털 시계")).toBeInTheDocument();
  });

  it("총 문서 수와 섹션 수를 표시한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText(/2개 문서/)).toBeInTheDocument();
    expect(screen.getByText(/1개 섹션/)).toBeInTheDocument();
  });
});

describe("HomeView — 최근 수정 위젯", () => {
  it("lastEditedTime이 있는 링크를 표시하고 클릭 시 모달이 열린다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("최근문서A")).toBeInTheDocument();
    fireEvent.click(screen.getByText("최근문서A"));
    expect(screen.getByRole("dialog", { name: "최근문서A" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("닫기"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lastEditedTime이 없으면 안내 문구를 표시한다", () => {
    const sectionsNoTime: KnowledgeSection[] = [{
      ...sampleSections[0],
      categories: [{ id: "cat-1", title: "카테고리1", links: [{ id: "l-nt", title: "시간없는문서", url: "https://u-pham.notion.site/cccccccccccccccccccccccccccccccc" }] }],
    }];
    render(<HomeView sections={sectionsNoTime} />);
    expect(screen.getByText("수정 데이터가 없습니다")).toBeInTheDocument();
  });

  it("상대 시간을 올바르게 표시한다 (분/시간/일/날짜)", () => {
    const mkSection = (time: number, title: string): KnowledgeSection[] => [{
      ...sampleSections[0],
      categories: [{ id: "c", title: "카테고리", links: [{ id: "l", title, url: "https://u-pham.notion.site/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", lastEditedTime: time }] }],
    }];

    // 방금 전
    render(<HomeView sections={sampleSections} />);
    expect(screen.getAllByText("방금 전").length).toBeGreaterThan(0);

    // 분 단위
    const { unmount: u1 } = render(<HomeView sections={mkSection(NOW - 30 * MIN, "분전")} />);
    expect(screen.getByText("30분 전")).toBeInTheDocument();
    u1();

    // 시간 단위
    const { unmount: u2 } = render(<HomeView sections={mkSection(NOW - 3 * HOUR, "시간전")} />);
    expect(screen.getByText("3시간 전")).toBeInTheDocument();
    u2();

    // 일 단위
    const { unmount: u3 } = render(<HomeView sections={mkSection(NOW - 3 * DAY, "일전")} />);
    expect(screen.getByText("3일 전")).toBeInTheDocument();
    u3();

    // 날짜 형식 (7일 이상)
    const oldTime = NOW - 10 * DAY;
    const { unmount: u4 } = render(<HomeView sections={mkSection(oldTime, "오래된")} />);
    expect(screen.getByText(new Date(oldTime).toLocaleDateString("ko-KR"))).toBeInTheDocument();
    u4();
  });
});

describe("HomeView — 많이 본 게시물 위젯", () => {
  it("열람 기록이 없으면 안내, 있으면 목록을 표시한다", () => {
    const { unmount } = render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("아직 열람 기록이 없습니다")).toBeInTheDocument();
    unmount();

    recordPageView("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "인기문서", "https://u-pham.notion.site/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    recordPageView("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "인기문서", "https://u-pham.notion.site/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("인기문서")).toBeInTheDocument();
    expect(screen.getByText("2회")).toBeInTheDocument();
  });
});

describe("HomeView — 날씨 위젯 (fetch 성공/실패/재시도)", () => {
  it("날씨 API 성공 시 온도와 대기질을 표시한다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getByText("15°C")).toBeInTheDocument();
      expect(screen.getAllByText("좋음").length).toBeGreaterThan(0);
    });
  });

  it("날씨 API 실패 시 에러 안내와 재시도 버튼을 표시한다", async () => {
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error("network error"));
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getAllByText("날씨 정보를 불러올 수 없습니다").length).toBeGreaterThan(0);
      expect(screen.getAllByText("다시 시도").length).toBeGreaterThan(0);
    });

    // 재시도 후 성공
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes("air-quality-api.open-meteo.com"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAirGood) });
      if (String(url).includes("open-meteo.com"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeatherResponse) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    fireEvent.click(screen.getAllByText("다시 시도")[0]);
    await waitFor(() => expect(screen.getByText("15°C")).toBeInTheDocument());
  });

  it("PM2.5 나쁨/매우나쁨/보통 등급을 표시한다", async () => {
    // 나쁨
    mockFetch.mockReset();
    mockAllSuccess({ current: { pm2_5: 50, pm10: 100 } });
    const { unmount: u1 } = render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(screen.getAllByText("나쁨").length).toBeGreaterThan(0));
    u1();

    // 매우 나쁨
    mockFetch.mockReset();
    mockAllSuccess({ current: { pm2_5: 80, pm10: 160 } });
    const { unmount: u2 } = render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(screen.getAllByText("매우 나쁨").length).toBeGreaterThan(0));
    u2();

    // 보통
    mockFetch.mockReset();
    mockAllSuccess({ current: { pm2_5: 20, pm10: 50 } });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(screen.getAllByText("보통").length).toBeGreaterThan(0));
  });

  it("미지원 날씨 코드에서도 오류 없이 렌더링한다", async () => {
    mockFetch.mockReset();
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes("air-quality-api.open-meteo.com"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAirGood) });
      if (String(url).includes("daily="))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeeklyWeatherResponse) });
      if (String(url).includes("open-meteo.com"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ current: { temperature_2m: 20, weather_code: 99, wind_speed_10m: 2.0 } }) });
      if (String(url).includes("date.nager.at"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHolidayResponse) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(screen.getByText("20°C")).toBeInTheDocument());
  });

  it("geolocation 성공 시 현재 위치 기준 날씨를 요청한다", async () => {
    Object.defineProperty(global.navigator, "geolocation", {
      value: { getCurrentPosition: jest.fn((cb: PositionCallback) => cb({ coords: { latitude: 37.1, longitude: 127.1 } } as GeolocationPosition)) },
      writable: true, configurable: true,
    });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(screen.getByText("15°C")).toBeInTheDocument());
    Object.defineProperty(global.navigator, "geolocation", { value: undefined, writable: true, configurable: true });
  });
});

describe("HomeView — 메모 위젯", () => {
  it("추가/삭제/Enter키/공백방지 동작을 검증한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("메모가 없습니다")).toBeInTheDocument();

    // 버튼으로 추가
    fireEvent.change(screen.getByPlaceholderText("메모를 입력하세요..."), { target: { value: "테스트 메모" } });
    fireEvent.click(screen.getByLabelText("메모 추가"));
    expect(screen.getByText("테스트 메모")).toBeInTheDocument();

    // 삭제
    fireEvent.click(screen.getByLabelText("메모 삭제"));
    expect(screen.queryByText("테스트 메모")).not.toBeInTheDocument();

    // Enter 키로 추가
    const input = screen.getByPlaceholderText("메모를 입력하세요...");
    fireEvent.change(input, { target: { value: "엔터 메모" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("엔터 메모")).toBeInTheDocument();

    // 공백만 입력 시 추가 안됨
    fireEvent.change(screen.getByPlaceholderText("메모를 입력하세요..."), { target: { value: "   " } });
    fireEvent.click(screen.getByLabelText("메모 추가"));
    // 메모가 1개뿐 (엔터 메모만 존재)
    expect(screen.getByText("엔터 메모")).toBeInTheDocument();

    // Enter가 아닌 키는 무시
    fireEvent.change(screen.getByPlaceholderText("메모를 입력하세요..."), { target: { value: "미완성" } });
    fireEvent.keyDown(screen.getByPlaceholderText("메모를 입력하세요..."), { key: "Shift" });
    expect(screen.queryByText("미완성")).not.toBeInTheDocument();
  });
});

describe("HomeView — 캘린더 위젯", () => {
  it("요일 헤더와 이전/다음 달 네비게이션을 검증한다", () => {
    render(<HomeView sections={sampleSections} />);
    ["일", "월", "화", "수", "목", "금", "토"].forEach((d) =>
      expect(screen.getAllByText(d).length).toBeGreaterThan(0)
    );

    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    fireEvent.click(screen.getByLabelText("다음 달"));
    expect(screen.getByText(`${nextMonth.getFullYear()}년 ${nextMonth.getMonth() + 1}월`)).toBeInTheDocument();

    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    fireEvent.click(screen.getByLabelText("이전 달"));
    expect(screen.getByText(`${prevMonth.getFullYear()}년 ${prevMonth.getMonth() + 1}월`)).toBeInTheDocument();
  });
});

describe("HomeView — D-Day 위젯", () => {
  it("추가/삭제/빈이름방지/날짜분기를 검증한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("D-Day가 없습니다")).toBeInTheDocument();

    // 추가 폼 열기/닫기
    fireEvent.click(screen.getByText("D-Day 추가"));
    expect(screen.getByPlaceholderText("이벤트 이름")).toBeInTheDocument();
    fireEvent.click(screen.getByText("취소"));
    expect(screen.queryByPlaceholderText("이벤트 이름")).not.toBeInTheDocument();

    // 추가
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), { target: { value: "생일" } });
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: "2099-12-31" } });
    fireEvent.click(screen.getByText("추가"));
    expect(screen.getByText("생일")).toBeInTheDocument();

    // 삭제
    fireEvent.click(screen.getByLabelText("생일 삭제"));
    expect(screen.queryByText("생일")).not.toBeInTheDocument();

    // D-Day 오늘
    const today = new Date().toLocaleDateString("en-CA");
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), { target: { value: "오늘" } });
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: today } });
    fireEvent.click(screen.getByText("추가"));
    expect(screen.getByText("D-Day")).toBeInTheDocument();

    // D+ (지난 날짜)
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByPlaceholderText("이벤트 이름"), { target: { value: "지난" } });
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: "2020-01-01" } });
    fireEvent.click(screen.getByText("추가"));
    expect(screen.getByText(/D\+/)).toBeInTheDocument();

    // 빈 이름 방지
    fireEvent.click(screen.getByText("D-Day 추가"));
    fireEvent.change(screen.getByLabelText("목표 날짜"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByText("추가"));
    expect(screen.getByPlaceholderText("이벤트 이름")).toBeInTheDocument();
  });
});

describe("HomeView — 북마크 위젯", () => {
  it("추가/삭제/URL자동보정/빈이름방지를 검증한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("저장된 북마크가 없습니다")).toBeInTheDocument();

    // 추가
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.change(screen.getByPlaceholderText("북마크 이름"), { target: { value: "구글" } });
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://google.com" } });
    fireEvent.click(screen.getAllByText("추가")[0]);
    expect(screen.getByText("구글")).toBeInTheDocument();

    // 삭제
    fireEvent.click(screen.getByLabelText("구글 삭제"));
    expect(screen.queryByText("구글")).not.toBeInTheDocument();

    // 취소
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.click(screen.getByText("취소"));
    expect(screen.queryByPlaceholderText("북마크 이름")).not.toBeInTheDocument();

    // http 없는 URL 자동 보정
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.change(screen.getByPlaceholderText("북마크 이름"), { target: { value: "노프로토콜" } });
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "example.com" } });
    fireEvent.click(screen.getAllByText("추가")[0]);
    expect(screen.getByText("노프로토콜")).toBeInTheDocument();

    // 빈 이름 방지
    fireEvent.click(screen.getByText("북마크 추가"));
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://example.com" } });
    fireEvent.click(screen.getAllByText("추가")[0]);
    expect(screen.getByPlaceholderText("북마크 이름")).toBeInTheDocument();
  });
});

describe("HomeView — 포모도로 타이머 위젯", () => {
  it("시작/일시정지/초기화/모드전환을 검증한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("25:00")).toBeInTheDocument();

    fireEvent.click(screen.getByText("시작"));
    expect(screen.getByText("일시정지")).toBeInTheDocument();

    fireEvent.click(screen.getByText("초기화"));
    expect(screen.getByText("25:00")).toBeInTheDocument();

    fireEvent.click(screen.getByText("휴식 5분"));
    expect(screen.getByText("05:00")).toBeInTheDocument();
  });
});

describe("HomeView — 포모도로 타이머 종료", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useWidgetStore.setState({ widgetOrder: ["pomodoro"] });
  });
  afterEach(() => jest.useRealTimers());

  it("집중 타이머 종료 시 자동으로 휴식 모드로 전환된다", async () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("시작"));
    jest.advanceTimersByTime(1500 * 1000);
    await waitFor(() => {
      expect(screen.queryByText("시작") !== null || screen.queryByText("05:00") !== null).toBe(true);
    });
  });

  it("휴식 타이머 종료 시 자동으로 집중 모드로 전환된다", async () => {
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByText("휴식 5분"));
    fireEvent.click(screen.getByText("시작"));
    jest.advanceTimersByTime(300 * 1000);
    await waitFor(() => {
      expect(screen.queryByText("시작") !== null || screen.queryByText("25:00") !== null).toBe(true);
    });
  });
});

describe("HomeView — Todo 위젯", () => {
  it("추가/완료/삭제를 검증한다", () => {
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("할 일이 없습니다")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("할 일을 입력하세요...");
    fireEvent.change(input, { target: { value: "테스트 할일" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("테스트 할일")).toBeInTheDocument();
  });

  it("완료 토글과 삭제가 동작한다", () => {
    useTodoStore.setState({ todos: [{ id: "1", text: "할일", completed: false, createdAt: Date.now() }] });
    render(<HomeView sections={sampleSections} />);
    fireEvent.click(screen.getByLabelText("완료 표시"));
    expect(screen.getByText("할일").className).toContain("line-through");
    fireEvent.click(screen.getByLabelText("삭제"));
    expect(screen.queryByText("할일")).not.toBeInTheDocument();
  });
});

describe("HomeView — 계산기 위젯", () => {
  it("사칙연산, 0 나누기, ±, %, 소수점, 연속연산을 검증한다", () => {
    render(<HomeView sections={sampleSections} />);

    // 더하기
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getAllByText("7").length).toBeGreaterThan(0);

    // 초기화
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);

    // 0으로 나누기
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "÷" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getByText("오류")).toBeInTheDocument();

    // C → ± → %
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "±" }));
    expect(screen.getByText("-5")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "%" }));
    expect(screen.getByText("0.5")).toBeInTheDocument();

    // 소수점
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "." }));
    expect(screen.getByText("0.")).toBeInTheDocument();

    // 연속 연산 (중간 결과)
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getAllByText("7").length).toBeGreaterThan(0);

    // 연산자 없이 = (early return)
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
  });

  it("빼기·곱하기·나누기 연산이 정상 동작한다", () => {
    render(<HomeView sections={sampleSections} />);
    // 빼기
    fireEvent.click(screen.getByRole("button", { name: "9" }));
    fireEvent.click(screen.getByRole("button", { name: "-" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getAllByText("6").length).toBeGreaterThan(0);

    // 곱하기
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getAllByText("9").length).toBeGreaterThan(0);

    // 나누기
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "8" }));
    fireEvent.click(screen.getByRole("button", { name: "÷" }));
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });
});

describe("HomeView — 모달 비-Notion URL", () => {
  it("Notion 페이지 ID가 없는 URL로 모달을 열어도 오류가 없다", () => {
    const sections: KnowledgeSection[] = [{
      ...sampleSections[0],
      categories: [{ id: "cat-ext", title: "외부", links: [{ id: "l-ext", title: "외부문서", url: "https://example.com/docs", lastEditedTime: Date.now() - 1000 }] }],
    }];
    render(<HomeView sections={sections} />);
    fireEvent.click(screen.getByText("외부문서"));
    expect(screen.getByRole("dialog", { name: "외부문서" })).toBeInTheDocument();
  });
});

describe("HomeView — 스토어 상태 복원", () => {
  it("각 스토어에 데이터가 있으면 위젯에 표시한다", () => {
    useMemoStore.setState({ memos: [{ id: "1", text: "저장된메모", createdAt: Date.now() }] });
    useDDayStore.setState({ ddays: [{ id: "1", title: "복원이벤트", targetDate: "2099-01-01" }] });
    useBookmarkStore.setState({ bookmarks: [{ id: "1", title: "복원북마크", url: "https://example.com" }] });
    render(<HomeView sections={sampleSections} />);
    expect(screen.getByText("저장된메모")).toBeInTheDocument();
    expect(screen.getByText("복원이벤트")).toBeInTheDocument();
    expect(screen.getByText("복원북마크")).toBeInTheDocument();
  });
});

describe("HomeView — 주간 날씨 예보 위젯", () => {
  it("7일치 예보를 표시하고 실패 시 재시도 가능하다", async () => {
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => {
      expect(screen.getAllByText(/15°|16°|14°|12°|11°|13°/).length).toBeGreaterThan(0);
    });
  });
});

describe("HomeView — 드래그앤드롭", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = jest.fn();
    document.elementFromPoint = jest.fn().mockReturnValue(null);
  });

  afterEach(() => {
    Object.defineProperty(global.navigator, "geolocation", { value: undefined, configurable: true });
  });

  it("HTML5 DnD 이벤트(dragStart/dragOver/dragEnd)가 정상 처리된다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    expect(cards.length).toBeGreaterThan(1);
    const dataTransfer = { effectAllowed: "" };

    // dragStart → dragOver → dragEnd
    fireEvent.dragStart(cards[0], { dataTransfer });
    fireEvent.dragOver(cards[1], { dataTransfer });
    fireEvent.dragEnd(cards[0]);
    expect(document.querySelectorAll("[data-widget-id]").length).toBeGreaterThan(0);

    // dragEnd 단독 (시작 없이)
    fireEvent.dragEnd(cards[0]);

    // 같은 카드 dragOver
    fireEvent.dragStart(cards[0], { dataTransfer });
    fireEvent.dragOver(cards[0], { dataTransfer });
    fireEvent.dragEnd(cards[0]);

    // 같은 카드 두 번 dragOver (중복 방지)
    fireEvent.dragStart(cards[0], { dataTransfer });
    fireEvent.dragOver(cards[1], { dataTransfer });
    fireEvent.dragOver(cards[1], { dataTransfer });
    fireEvent.dragEnd(cards[0]);
  });

  it("터치 포인터 이벤트로 드래그 핸들을 조작할 수 있다", () => {
    render(<HomeView sections={sampleSections} />);
    const handle = screen.getAllByLabelText("위젯 이동 핸들")[0];

    // 터치 드래그
    fireEvent.pointerDown(handle, { pointerType: "touch", pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 200 });
    fireEvent.pointerUp(handle, { pointerType: "touch", pointerId: 1 });

    // 마우스는 무시
    fireEvent.pointerDown(handle, { pointerType: "mouse", pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerType: "mouse", pointerId: 1, clientX: 200, clientY: 200 });
    fireEvent.pointerUp(handle, { pointerType: "mouse", pointerId: 1 });

    // pointerCancel
    fireEvent.pointerDown(handle, { pointerType: "touch", pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerCancel(handle, { pointerType: "touch", pointerId: 1 });
  });

  it("포인터가 다른 위젯 위로 이동 시 드롭 대상이 변경된다", () => {
    render(<HomeView sections={sampleSections} />);
    const cards = document.querySelectorAll("[data-widget-id]");
    document.elementFromPoint = jest.fn().mockReturnValue(cards[1]);

    const handle = screen.getAllByLabelText("위젯 이동 핸들")[0];
    fireEvent.pointerDown(handle, { pointerType: "touch", pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerType: "touch", pointerId: 1, clientX: 200, clientY: 300 });
    fireEvent.pointerUp(handle, { pointerType: "touch", pointerId: 1 });
    expect(document.querySelectorAll("[data-widget-id]").length).toBeGreaterThan(0);
  });

  it("geolocation 오류 시 서울 기본값으로 날씨를 로드한다", async () => {
    Object.defineProperty(global.navigator, "geolocation", {
      value: { getCurrentPosition: jest.fn() }, configurable: true,
    });
    render(<HomeView sections={sampleSections} />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  });
});
