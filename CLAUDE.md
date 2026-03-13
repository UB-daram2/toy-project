# 유팜시스템 지원 포털 대시보드

## 프로젝트 개요

유팜시스템 고객 지원 지식베이스를 트렌디한 대시보드 스타일로 시각화하는 Next.js 16 앱.
Notion 최상위 페이지(`기술지원`)에서 섹션 → 카테고리 → 링크 3단계 계층을 동적으로 파싱하여 카드 UI로 표시하고, 클릭 시 Notion 콘텐츠를 모달로 렌더링한다.

### 해결하는 문제

사내 Notion 지식베이스는 존재하지만 고객/지원 담당자가 빠르게 원하는 문서를 찾기 어려운 구조였다.
이 앱은 Notion 구조를 자동으로 읽어 검색 가능한 대시보드로 변환하고, 페이지를 떠나지 않고 인라인으로 내용을 볼 수 있게 한다.

### 경쟁 솔루션과의 비교

| 기준 | 본 앱 | Notion 기본 UI | Confluence | 커스텀 인트라넷 |
|------|-------|----------------|------------|-----------------|
| **검색 속도** | 실시간 필터 (클라이언트) | 서버 검색, 딜레이 있음 | 서버 검색 | 구현에 따라 다름 |
| **문서 열람** | 모달 인라인 (페이지 이동 없음) | 새 탭/페이지 이동 | 새 페이지 이동 | 구현에 따라 다름 |
| **생산성 위젯** | 11종 (날씨, 환율, 증시, 포모도로 등) | 없음 | 없음 | 구현 비용 큼 |
| **설치/인증** | Vercel 배포, 인증 불필요 | Notion 계정 필요 | 계정 + 라이선스 필요 | 서버 운영 필요 |
| **Notion 구조 반영** | 재배포 시 자동 반영 | 실시간 (Notion 내) | 수동 복사 | 수동 동기화 |
| **오프라인 메모·북마크** | localStorage 영속화 | 없음 | 없음 | DB 필요 |
| **커스터마이징** | 위젯 순서 DnD (localStorage) | 없음 | 제한적 | 구현 비용 큼 |

**차별화 포인트**: Notion을 CMS로 유지하면서 API 키 없이 운영 가능한 최소 비용 대시보드. 지식베이스 탐색 + 업무 생산성 도구(날씨, 환율, 증시, 포모도로, D-Day)를 단일 화면에 통합.

### 핵심 의사결정

- **Notion 공식 API 대신 `loadPageChunk` 비공식 API 사용**: 인증 없이 공개 Notion 페이지에 접근 가능하여 API 키 관리 부담 없음. 위험: Notion 내부 변경에 취약. 마이그레이션 경로: `notion-structure.ts`, `api/notion/[pageId]/route.ts` 교체로 공식 API로 전환 가능
- **Server Component에서 구조 fetch**: 초기 렌더링 시 Notion 계층 구조를 서버에서 로딩하여 클라이언트 waterfall 방지
- **localStorage 기반 열람 추적**: 외부 서버 의존 없이 클라이언트에서 열람 수를 집계
- **Open-Meteo API**: 인증 불필요한 무료 날씨 API로 현재 날씨 + 대기질 + 7일 예보 제공
- **Frankfurter API**: 인증 불필요한 무료 환율 API (1 USD 기준 KRW·EUR·JPY·CNY)
- **Yahoo Finance 프록시**: CORS 제약으로 서버사이드 Next.js API Route(`/api/market`)를 통해 우회
- **date.nager.at API**: 한국 공휴일 데이터 (인증 불필요, CORS 허용)
- **useEffect + eslint-disable로 localStorage 로딩**: `useState` lazy initializer는 SSR 하이드레이션 불일치를 유발하므로 `useEffect`에서 로딩 후 `eslint-disable-next-line react-hooks/set-state-in-effect`로 규칙을 비활성화
- **드래그앤드롭 이중 구현**: 마우스는 HTML5 DnD API, 터치는 Pointer Events API + `setPointerCapture`로 별도 구현 (HTML5 DnD는 터치에서 불안정)

## 기술 스택

- **Next.js 16** (App Router, Async Server Components)
- **TypeScript** (strict mode, `any` 사용 금지)
- **Tailwind CSS v4** (`auto-rows-[300px]` 그리드로 균일 카드 높이)
- **Zustand** (persist 미들웨어로 위젯 순서 상태 관리 + localStorage 자동 영속화)
- **next-themes** (다크모드)
- **lucide-react** (아이콘)
- **Jest + React Testing Library** (테스트, 커버리지 90% 이상 강제)
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

CI/CD: `.github/workflows/ci.yml` — push/PR 시 lint → type-check → test → build 순으로 자동 실행

## 아키텍처

```
src/app/page.tsx              ← Async Server Component: Notion에서 구조 로딩
       └─ Dashboard.tsx       ← Client Component: 상태 관리 (활성 섹션, 검색어)
           ├─ Sidebar.tsx     ← 홈 + 섹션 네비게이션
           ├─ Header.tsx      ← 검색 + 다크모드 토글
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
| 메모 | `MemoWidget` | localStorage (최대 20개) |
| 미니 캘린더 | `CalendarWidget` | date.nager.at (공휴일) |
| D-Day 카운터 | `DDayWidget` | localStorage (날짜 오름차순 정렬) |
| 북마크 | `BookmarkWidget` | localStorage |
| 포모도로 타이머 | `PomodoroWidget` | 내부 상태 (집중 25분 / 휴식 5분) |
| 주간 날씨 예보 | `WeeklyWeatherWidget` | Open-Meteo (7일 daily forecast) |

### 드래그앤드롭 구현

- `widgetOrder` 상태: Zustand `useWidgetStore` (persist 미들웨어로 localStorage `upharm_widget_order` 자동 영속화)
- **마우스 (HTML5 DnD)**: `onDragStart` → `onDragOver` → `onDragEnd`
- **터치 (Pointer Events)**: `onPointerDown` → `onPointerMove` → `onPointerUp`/`onPointerCancel`
  - `setPointerCapture`로 포인터 이벤트를 핸들 요소에 캡처
  - `document.elementFromPoint`로 포인터 아래의 위젯 카드 탐지
- `commitReorder`: `useWidgetStore.reorder(fromId, toId)` 호출로 상태 업데이트 (스테일 클로저 방지)

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

## 작성 규칙

- 실제 동작하는 코드만 작성 (미구현 stub 금지)
- 테스트 커버리지 90% 이상 유지
- 기능을 명확히 나타내는 이름 사용 (약어/모호한 이름 금지)
- 로직 블록마다 반드시 주석 작성
- localStorage는 반드시 `useEffect` 안에서 접근 (`useState` lazy initializer 사용 금지 — SSR 하이드레이션 불일치 유발)

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
