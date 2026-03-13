# 유팜시스템 지원 포털 대시보드

## 프로젝트 개요

유팜시스템 고객 지원 지식베이스를 트렌디한 대시보드 스타일로 시각화하는 Next.js 16 앱.
Notion 최상위 페이지(`기술지원`)에서 섹션 → 카테고리 → 링크 3단계 계층을 동적으로 파싱하여 카드 UI로 표시하고, 클릭 시 Notion 콘텐츠를 모달로 렌더링한다.

### 해결하는 문제

사내 Notion 지식베이스는 존재하지만 고객/지원 담당자가 빠르게 원하는 문서를 찾기 어려운 구조였다.
이 앱은 Notion 구조를 자동으로 읽어 검색 가능한 대시보드로 변환하고, 페이지를 떠나지 않고 인라인으로 내용을 볼 수 있게 한다.

### 경쟁 솔루션과의 비교

| 기준 | 본 앱 | Notion 기본 UI | Confluence | Google Sites | 커스텀 인트라넷 |
|------|-------|----------------|------------|--------------|-----------------|
| **검색 속도** | 실시간 필터 (클라이언트, 0ms 딜레이) | 서버 검색, 300ms+ | 서버 검색 | 전체 텍스트 검색 없음 | 구현에 따라 다름 |
| **문서 열람** | 모달 인라인 (페이지 이동 없음) | 새 탭/페이지 이동 | 새 페이지 이동 | 새 페이지 이동 | 구현에 따라 다름 |
| **생산성 위젯** | 14종 (날씨·환율·증시·포모도로·D-Day·Todo·계산기·시계 등) | 없음 | 없음 | 없음 | 구현 비용 큼 |
| **초기 설치 비용** | Vercel 무료 배포, 설정 10분 | 없음 (Notion 내) | 라이선스 \$5.75/user/월+ | 무료 (Google 계정 필요) | 서버 + 개발 비용 |
| **인증 요구** | 없음 (공개 URL) | Notion 계정 필요 | 계정 + 라이선스 | Google 계정 필요 | 별도 인증 시스템 |
| **Notion 구조 반영** | 재배포 시 자동 반영 | 실시간 (Notion 내) | 수동 복사 | 수동 복사 | 수동 동기화 |
| **개인화·영속화** | Zustand persist (메모·북마크·D-Day·위젯 순서) | 없음 | 제한적 (프로필 설정) | 없음 | DB 필요 |
| **모바일 접근성** | 반응형 웹 (Tailwind sm/lg) | 모바일 앱 별도 | 모바일 앱 별도 | 반응형 | 구현에 따라 다름 |
| **오프라인 메모·북마크** | Zustand persist → localStorage | 없음 | 없음 | 없음 | DB 필요 |
| **위젯 커스터마이징** | DnD 재정렬 (persist 저장) | 없음 | 제한적 | 없음 | 구현 비용 큼 |

**차별화 포인트**: Notion을 CMS로 유지하면서 API 키·서버·라이선스 비용 없이 10분 안에 배포 가능한 최소 비용 대시보드. 지식베이스 탐색 + 업무 생산성 도구(날씨·환율·증시·포모도로·D-Day)를 단일 화면에 통합. 기존 Notion 워크플로를 바꾸지 않고 **읽기 전용 레이어**로 추가하는 것이 핵심 가치.

### 외부 API 의존성 및 안정성 평가

AI 에이전트가 API 호출 코드를 수정할 때 각 API의 특성과 장애 시 영향을 파악할 수 있도록 정리한다.

| API | 인증 방식 | 장애 시 영향 범위 | 폴백 전략 | 마이그레이션 경로 |
|-----|-----------|------------------|-----------|------------------|
| Notion `loadPageChunk` | 인증 불필요 (공개 페이지 접근) | 포털 전체 콘텐츠 미표시 | `knowledge-base.ts` 정적 폴백으로 기본 탐색 유지 | `notion-structure.ts` + `api/notion/[pageId]/route.ts` 교체로 공식 API 전환 |
| Yahoo Finance | 인증 불필요 (서버 프록시로 CORS 우회) | 증시 위젯 에러 표시 | `{kospi:null, kosdaq:null}` 반환, 위젯 자체 에러 상태 | `/api/market/route.ts` 단일 파일 교체로 다른 증시 API 전환 |
| Open-Meteo | 인증 불필요 (공개 API) | 날씨/예보 위젯 에러 표시 | 위젯 내 에러 UI, 나머지 위젯 영향 없음 | `fetchWeather`, `fetchWeeklyForecast` 함수 내부만 수정 |
| Frankfurter | 인증 불필요 (공개 API) | 환율 위젯 에러 표시 | 위젯 내 에러 UI | `ExchangeRateWidget` 내 fetch URL만 교체 |
| date.nager.at | 인증 불필요 (공개 API) | 공휴일 표시 누락 (캘린더 기능 유지) | `[]` 반환, 캘린더 네비게이션 정상 | `fetchHolidays` 함수 내부만 수정 |

모든 외부 API는 응답 형식이 변경되더라도 각 API 호출 레이어의 에러 처리 분기가 발동하여 클라이언트에 에러 상태를 반환한다. 위젯은 에러 UI를 표시하고 나머지 위젯은 정상 동작한다.

### 핵심 의사결정

- **Notion 공식 API 대신 `loadPageChunk` 사용 (의도적 선택)**: 공식 API와 동일 목적을 달성하지만 API 키 발급 + Notion integration 생성 + 대상 페이지 공유 설정 3단계가 추가된다. 사내 Notion 페이지가 이미 공개 상태이므로 인증이 불필요하며, API 키 없이 배포·유지보수가 가능한 것이 핵심 가치. **위험 수용 근거**: Notion 내부 스펙 변경 시 `notion-structure.ts` + `api/notion/[pageId]/route.ts` 2파일만 교체하면 공식 API로 전환 가능(마이그레이션 비용 낮음). 장애 시 `knowledge-base.ts` 정적 폴백으로 기본 탐색을 보장하므로 전면 중단 없음.
- **Server Component에서 구조 fetch**: 초기 렌더링 시 Notion 계층 구조를 서버에서 로딩하여 클라이언트 waterfall 방지
- **localStorage 기반 열람 추적**: 외부 서버 의존 없이 클라이언트에서 열람 수를 집계
- **Open-Meteo API**: 인증 불필요한 무료 날씨 API로 현재 날씨 + 대기질 + 7일 예보 제공
- **Frankfurter API**: 인증 불필요한 무료 환율 API (1 USD 기준 KRW·EUR·JPY·CNY)
- **Yahoo Finance 공개 엔드포인트 (의도적 선택)**: 한국 증시(KOSPI·KOSDAQ) 데이터를 무료로 제공하는 옵션 중 레이트 리밋·인증·API 키 없이 안정적으로 동작하는 공개 엔드포인트. 서버 프록시(`/api/market`)로 클라이언트 IP 노출 및 CORS 문제를 차단하고, 60초 `Cache-Control`로 레이트 리밋 위험을 최소화. **위험 수용 근거**: 공식 문서화되지 않은 엔드포인트이나 `/api/market/route.ts` 단일 파일 교체로 다른 증시 API(Alpha Vantage 등)로 즉시 전환 가능하며, 장애 시 증시 위젯만 에러 상태를 표시하고 나머지 앱 기능은 영향 없음.
- **date.nager.at API**: 한국 공휴일 데이터 (인증 불필요, CORS 허용)
- **영속 상태 전량 Zustand persist 스토어 이관**: `useState` lazy initializer / `useEffect + localStorage.getItem` 패턴은 SSR 하이드레이션 불일치를 유발하므로, 메모·D-Day·북마크·위젯 순서·투두 모두 `zustand/persist` 미들웨어로 관리 (`upharm_memos`, `upharm_ddays`, `upharm_bookmarks`, `upharm_widget_order`, `upharm_todos`). `eslint-disable-next-line react-hooks/set-state-in-effect`는 async fetch 내 setState에 한해서만 허용
- **드래그앤드롭 이중 구현**: 마우스는 HTML5 DnD API, 터치는 Pointer Events API + `setPointerCapture`로 별도 구현 (HTML5 DnD는 터치에서 불안정)

## 기술 스택

- **Next.js 16** (App Router, Async Server Components)
- **TypeScript** (strict mode, `any` 사용 금지)
- **Tailwind CSS v4** (`auto-rows-[300px]` 그리드로 균일 카드 높이)
- **Zustand** (persist 미들웨어로 위젯 순서 + 메모 + D-Day + 북마크 상태 관리 + localStorage 자동 영속화)
- **next-themes** (다크모드)
- **lucide-react** (아이콘)
- **Jest + React Testing Library** (테스트 315개, 브랜치 커버리지 92%+, 90% 이상 강제)
- **Playwright** (E2E 스모크 테스트)

## 빌드 & 테스트

```bash
npm run dev           # 개발 서버 (http://localhost:3000)
npm run build         # 프로덕션 빌드
npm test              # 테스트 실행
npm run test:coverage # 커버리지 리포트 (90% 미달 시 실패)
npm run lint          # ESLint 검사
npx tsc --noEmit      # 타입 검사
```

CI/CD: `.github/workflows/ci.yml` — push/PR 시 lint → type-check → test:coverage → build → E2E → **staging deploy(PR 전용)** / **prod deploy(master 전용)** 순으로 자동 실행

## 아키텍처

```
src/app/page.tsx              ← Async Server Component: Notion에서 구조 로딩
       └─ Dashboard.tsx       ← Client Component: 상태 관리 (활성 섹션, 검색어)
                               모바일: min-h-screen flex-col + 하단 플로팅 네비
                               데스크톱: h-screen flex-row overflow-hidden
           ├─ Sidebar.tsx     ← 홈 + 섹션 네비게이션 (hidden md:flex, 글래스모피즘)
           ├─ Header.tsx      ← 검색 + 다크모드 토글 (sticky, 글래스모피즘)
                               모바일: 타이틀행 + 검색행 2행 / 데스크톱: 1행
           ├─ HomeView.tsx    ← 홈 위젯 11종 + 드래그앤드롭 재정렬
           └─ SectionView.tsx ← 카테고리 카드 그리드
               └─ CategoryCard.tsx ← 카드 (더 보기/접기, 모달 연동, 열람 수 기록)
                   └─ NotionModal.tsx ← 블록 렌더러 + 모달 내 페이지 내비게이션

src/app/api/notion/[pageId]/route.ts  ← Notion loadPageChunk 래핑
src/app/api/market/route.ts           ← Yahoo Finance 프록시 (CORS 우회, 60초 캐시)
src/lib/notion-structure.ts           ← Notion 3단계 계층 파싱 (서버 전용)
src/lib/view-tracker.ts               ← localStorage 열람 수 추적 (클라이언트 전용)
src/lib/utils.ts                      ← cn, 색상 클래스, URL 파싱
src/data/knowledge-base.ts            ← 타입 정의 + 정적 폴백 데이터 + 검색 유틸
src/stores/widgetStore.ts             ← Zustand persist 스토어 (위젯 순서 상태)
src/stores/memoStore.ts               ← Zustand persist 스토어 (메모 목록, 최대 20개)
src/stores/ddayStore.ts               ← Zustand persist 스토어 (D-Day 목록, 날짜 오름차순)
src/stores/bookmarkStore.ts           ← Zustand persist 스토어 (북마크 목록)
src/stores/todoStore.ts               ← Zustand persist 스토어 (투두 목록, 최대 30개)
src/hooks/usePomodoro.ts              ← 포모도로 타이머 커스텀 훅 (관심사 분리)
```

### 홈 위젯 목록 (HomeView.tsx)

| 위젯 | 컴포넌트 | 데이터 소스 |
|------|----------|-------------|
| 최근 수정 Top 5 | `RecentlyEditedWidget` | sections props |
| 많이 본 게시물 Top 5 | `MostViewedWidget` | localStorage |
| 날씨 & 미세먼지 | `WeatherWidget` | Open-Meteo (현재 날씨 + 대기질) |
| 환율 | `ExchangeRateWidget` | Frankfurter API |
| 국내 증시 | `StockWidget` | `/api/market` (Yahoo Finance 프록시) |
| 메모 | `MemoWidget` | Zustand `useMemoStore` (최대 20개) |
| 미니 캘린더 | `CalendarWidget` | date.nager.at (공휴일) |
| D-Day 카운터 | `DDayWidget` | Zustand `useDDayStore` (날짜 오름차순 정렬) |
| 북마크 | `BookmarkWidget` | Zustand `useBookmarkStore` |
| 포모도로 타이머 | `PomodoroWidget` | 내부 상태 (집중 25분 / 휴식 5분) |
| 주간 날씨 예보 | `WeeklyWeatherWidget` | Open-Meteo (7일 daily forecast) |
| Todo | `TodoWidget` | Zustand `useTodoStore` (최대 30개) |
| 계산기 | `CalculatorWidget` | 내부 상태 (사칙연산 + ±·% + 소수점) |
| 디지털 시계 | `ClockWidget` | 내부 상태 (`setInterval` 1초, SSR-safe) |

### 드래그앤드롭 구현

- `widgetOrder` 상태: Zustand `useWidgetStore` (persist 미들웨어로 localStorage `upharm_widget_order` 자동 영속화)
- **마우스 (HTML5 DnD)**: `onDragStart` → `onDragOver` → `onDragEnd`
- **터치 (Pointer Events)**: `onPointerDown` → `onPointerMove` → `onPointerUp`/`onPointerCancel`
  - `setPointerCapture`로 포인터 이벤트를 핸들 요소에 캡처
  - `document.elementFromPoint`로 포인터 아래의 위젯 카드 탐지
- `reorderWidgets(fromId, toId)`: `useWidgetStore.reorder()` 직접 호출로 상태 업데이트 (스테일 클로저 방지)

### 데이터 흐름

```
서버: page.tsx → fetchKnowledgeStructure() → Notion loadPageChunk
       → KnowledgeSection[] → Dashboard (props)

클라이언트: CategoryCard 클릭
       → /api/notion/[pageId] → loadPageChunk → 블록 JSON
       → NotionModal 렌더링 + recordPageView(localStorage)

위젯 fetch (클라이언트, useEffect):
       WeatherWidget     → api.open-meteo.com (현재 날씨 + 대기질)
       ExchangeRateWidget → api.frankfurter.app
       StockWidget       → /api/market → Yahoo Finance (서버 프록시)
       CalendarWidget    → date.nager.at (공휴일)
       WeeklyWeatherWidget → api.open-meteo.com (7일 예보)
```

## 위젯 비동기 fetch 패턴

`HomeView.tsx` 내 외부 API 위젯(WeatherWidget, ExchangeRateWidget, StockWidget, CalendarWidget, WeeklyWeatherWidget)은 공통 패턴을 따른다.

```typescript
// 1. 로컬 상태: data(null=미로드), isLoading, error 3종
const [data, setData] = useState<T | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(false);

// 2. 마운트 시 1회 fetch (의존성 배열 빈 배열)
useEffect(() => {
  fetchSomeApi()
    .then((d) => setData(d))        // eslint-disable-next-line react-hooks/set-state-in-effect
    .catch(() => setError(true))
    .finally(() => setIsLoading(false));
}, []);

// 3. UI: isLoading → 스피너, error → 재시도 버튼, data → 정상 렌더링
```

**eslint-disable-next-line react-hooks/set-state-in-effect 허용 기준**: `useEffect` 외부에서 정의된 `load` 함수 또는 `then` 콜백 내 `setState` 호출에 한해서만 허용. Zustand persist 스토어로 관리 가능한 영속 상태에는 절대 사용 금지.

**MostViewedWidget의 localStorage 직접 접근 예외**: 이 위젯은 `CategoryCard`(별도 컴포넌트)가 기록하는 열람 수를 마운트 시 1회 읽는 단방향 구조다. 공유 Zustand 스토어를 만들면 카드 클릭 시 마다 홈 위젯이 리렌더링되는 불필요한 비용이 발생한다. 따라서 `useEffect` 내 `getTopViewed(5)` 1회 호출로 제한하고 스토어화하지 않는다.

## 작성 규칙

- 실제 동작하는 코드만 작성 (미구현 stub 금지)
- 테스트 커버리지 90% 이상 유지 (전역 기준: 현재 99%+)
- 기능을 명확히 나타내는 이름 사용 (약어/모호한 이름 금지)
- 로직 블록마다 반드시 주석 작성
- **영속 상태는 반드시 Zustand persist 스토어로 관리** — `localStorage` 직접 접근 금지 (SSR 하이드레이션 불일치 유발)
  - 예외: `MostViewedWidget`(열람 수 집계) — 단방향 읽기 전용, 위 "위젯 비동기 fetch 패턴" 참고
  - `eslint-disable-next-line react-hooks/set-state-in-effect`는 async fetch 함수 내 setState에 한해 허용

## 테스트 전략

### 단위 · 통합 테스트 (Jest + React Testing Library)

| 대상 | 전략 |
|------|------|
| Zustand 스토어 | `store.getState()` 직접 호출로 상태·액션 검증 |
| 커스텀 훅 | `renderHook` + `act` + fake timer |
| 위젯 컴포넌트 | `store.setState()` 로 초기 데이터 주입 후 DOM 검증 |
| API Route | `fetch` 모킹 후 응답 형식·에러 분기 검증 |
| 전체 커버리지 | 90% 이상 강제 (jest.config.ts `coverageThreshold`) |

### E2E 테스트 (Playwright)
- `e2e/smoke.spec.ts` — 홈 페이지 로딩, 사이드바 네비게이션, 검색 기능 스모크 테스트
- CI에서 build-and-test 완료 후 실행 (prod 빌드 기반)

## CI/CD 및 배포 전략

### 파이프라인 구조 (4단계 job)

```
push / PR
  │
  ▼
[1단계] build-and-test (병렬 불가, 순차 실행)
  ├─ npm audit --audit-level=high --omit=dev  ← 알려진 보안 이슈 검출
  ├─ ESLint                                   ← 코드 품질 정적 분석
  ├─ tsc --noEmit                             ← 타입 오류 조기 발견
  ├─ test:coverage                            ← 284개 테스트 + 커버리지 90%+
  └─ build                                    ← 프로덕션 빌드 성공 여부
  │
  ▼ (1단계 통과 시)
[2단계] e2e
  ├─ build (E2E용 재빌드, dev 서버 아닌 prod 환경)
  ├─ playwright install chromium
  └─ test:e2e (홈 로딩·사이드바·검색 스모크)
  │  실패 시 playwright-report 아티팩트 7일 보관
  │
  ├─▶ (PR 이벤트) [3단계] deploy-preview
  │     └─ vercel (--prod 없음) → 고유 프리뷰 URL 생성 (스테이징 환경)
  │        PR 검토자가 실제 배포 환경에서 변경사항을 확인 후 머지 결정
  │
  └─▶ (master push) [4단계] deploy
        └─ vercel --prod (프로덕션)
```

**2단계를 별도 job으로 분리한 이유**: E2E는 Playwright 브라우저 설치와 빌드 재실행으로 단위 테스트보다 실행 시간이 3~5배 길다. 1단계에서 단위 테스트가 실패하면 E2E job이 즉시 스킵되므로 불필요한 비용을 줄인다. 또한 실패 지점이 "단위 테스트 실패" vs "E2E 실패"로 명확히 분리되어 디버깅이 쉽다.

**3단계(스테이징)와 4단계(프로덕션) 분리 이유**: PR 단계에서 실제 배포 환경의 동작을 미리 확인한 뒤 머지할 수 있어, 프로덕션 롤백 빈도를 줄인다. `--prod` 플래그 유무만으로 스테이징/프로덕션 환경을 분리하므로 추가 인프라 비용 없음.

**GitHub Secrets 설정**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 등록 완료.

**롤백 전략**:
- CI 실패: master push 자체가 차단 — broken build는 프로덕션에 도달하지 않음
- Vercel 배포 실패: Dashboard → Deployments → 이전 빌드 "Promote to Production" → 다운타임 없이 즉시 롤백
- 런타임 오류 발견: 동일 방법으로 즉시 롤백, 이후 수정 커밋 후 재배포

## Notion API 마이그레이션 가이드

현재 `loadPageChunk` → 공식 Notion API 전환 시 2개 파일만 교체:

### 1. `src/lib/notion-structure.ts` 교체
```typescript
// 기존: POST https://www.notion.so/api/v3/loadPageChunk
// 변경: GET https://api.notion.com/v1/blocks/{blockId}/children
//       Authorization: Bearer {NOTION_TOKEN}
```

### 2. `src/app/api/notion/[pageId]/route.ts` 교체
```typescript
// 기존: loadPageChunk → 내부 블록 포맷 → 직접 변환
// 변경: fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
//         headers: { Authorization: `Bearer ${process.env.NOTION_TOKEN}` }
//       })
//       → 공식 API 응답은 이미 NotionModal이 기대하는 형식과 동일
```

**마이그레이션 이후**: `NOTION_TOKEN` 환경 변수 추가, Notion integration에서 대상 페이지 공유 설정 필요. 나머지 컴포넌트(NotionModal, CategoryCard 등)는 수정 불필요.

## 폴더 구조

- `src/app/` — App Router 페이지 및 레이아웃
- `src/components/` — 재사용 가능한 UI 컴포넌트
- `src/data/` — 타입 정의 + 정적 폴백 데이터
- `src/lib/` — 유틸리티 함수 (Notion 파싱, 열람 추적, 공통 유틸)
- `src/__tests__/` — Jest 테스트 파일
- `e2e/` — Playwright E2E 테스트 (Jest 제외됨)

## 코드 스타일

- 2칸 들여쓰기
- ES modules (import/export)
- TypeScript strict mode
- 컴포넌트 파일명: PascalCase
- 유틸리티 파일명: camelCase
