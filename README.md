# 유팜 지원 포털

유팜시스템 고객 지원 지식베이스를 대시보드 스타일로 시각화하는 Next.js 앱입니다.

[![CI/CD](https://github.com/UB-daram2/toy-project/actions/workflows/ci.yml/badge.svg)](https://github.com/UB-daram2/toy-project/actions/workflows/ci.yml)

**배포 URL: https://toy-project-phi.vercel.app/**

## 문제 정의 (PRD)

### 배경

유팜시스템 고객 지원팀은 Notion에 방대한 지식베이스를 보유하고 있으나, Notion 기본 UI의 특성상 **원하는 문서를 빠르게 탐색하기 어렵고**, 담당자가 문서를 공유할 때마다 Notion 페이지를 별도 탭에서 열어야 하는 불편함이 있었다.

### 목표

| # | 목표 | 달성 방법 |
|---|------|-----------|
| 1 | 지식베이스 탐색 속도 향상 | 섹션/카테고리 계층을 카드 그리드로 시각화 |
| 2 | 인라인 문서 열람 | 카드 클릭 시 모달로 Notion 내용 표시 |
| 3 | 실시간 검색 | 섹션·카테고리·문서 이름 전체 텍스트 필터링 |
| 4 | 운영 부담 없는 자동 반영 | Notion 구조 변경 시 재배포만으로 즉시 반영 |
| 5 | 사용 현황 파악 | 많이 열람된 문서·최근 수정 문서 Top 5 위젯 |
| 6 | 생산성 향상 도구 | D-Day, 북마크, 포모도로, 날씨 예보 위젯 |

### 기능 명세

- **동적 구조 로딩** — `기술지원` Notion 페이지에서 섹션 → 카테고리 → 링크 계층 자동 파싱
- **Notion 콘텐츠 모달** — 카드 클릭 시 paragraph, heading, list, callout, image, toggle 등 블록 렌더링
- **모달 내 페이지 내비게이션** — 중첩된 서브페이지 클릭 시 모달 내에서 이동, 뒤로가기 지원
- **더 보기 / 접기** — 링크가 많은 카테고리 카드는 6개만 미리보기 후 확장
- **전체 텍스트 검색** — 섹션 / 카테고리 / 문서 이름으로 실시간 필터링
- **홈 대시보드 위젯 (11종)**
  - 최근 수정 게시물 Top 5 (Notion `last_edited_time` 기반)
  - 많이 본 게시물 Top 5 (localStorage 열람 수 집계)
  - 현재 날씨 & 미세먼지 (Open-Meteo API, 위치 기반)
  - 환율 (Frankfurter API, 1 USD 기준 4개 통화)
  - 국내 증시 (KOSPI · KOSDAQ, Yahoo Finance 프록시)
  - 메모 (Zustand persist 영속화, 최대 20개)
  - 미니 캘린더 + 공휴일 (date.nager.at API)
  - D-Day 카운터 (Zustand persist 영속화, 날짜 오름차순 정렬)
  - 북마크 (Zustand persist 영속화, 자동 https:// 추가)
  - 포모도로 타이머 (집중 25분 / 휴식 5분, 자동 모드 전환)
  - 주간 날씨 예보 (Open-Meteo 7일 예보, 위치 기반)
- **드래그앤드롭 위젯 재정렬** — HTML5 DnD (마우스) + Pointer Events API (터치), Zustand persist로 순서 저장
- **균일 카드 레이아웃** — CSS Grid `auto-rows-[300px]`로 모든 카드 높이 고정, 내용 오버플로 시 스크롤
- **다크모드** — `next-themes` 기반 라이트 / 다크 토글
- **Notion API 무인증 접근** — 공개 페이지에 인증 없이 접근하는 `loadPageChunk` API 사용

## 기술 스택

| 항목 | 버전 | 선택 이유 |
|------|------|-----------|
| Next.js (App Router) | 16 | 서버 컴포넌트로 Notion 구조 초기 로딩, 라우트 핸들러로 API 프록시 |
| TypeScript | 5 | 타입 안전성, 엄격 모드 (`any` 사용 금지) |
| Tailwind CSS | v4 | 빠른 UI 구현, 다크모드, `auto-rows-[300px]` 그리드 레이아웃 |
| next-themes | 최신 | SSR-safe 다크모드 전환 |
| lucide-react | 최신 | 일관된 아이콘 셋 |
| Zustand | 최신 | 위젯 순서·메모·D-Day·북마크 상태 persist (localStorage 자동 영속화, SSR-safe) |
| Jest + React Testing Library | 최신 | 250개 테스트, 커버리지 99%+, 90% 강제 |
| Playwright | 최신 | E2E 스모크 테스트 (홈 로딩, 내비게이션, 검색) |

### 외부 API (인증 불필요)

| API | 용도 | 비고 |
|-----|------|------|
| Open-Meteo | 현재 날씨 + 대기질 + 7일 예보 | CORS 허용, 무료 |
| Frankfurter | 환율 (1 USD 기준) | CORS 허용, 무료 |
| Yahoo Finance | 국내 증시 | 서버사이드 프록시 (`/api/market`) |
| date.nager.at | 한국 공휴일 | CORS 허용, 무료 |
| Notion `loadPageChunk` | 지식베이스 구조 + 콘텐츠 | 인증 불필요 (공개 페이지) |

## 시작하기

```bash
npm install
npm run dev        # http://localhost:3000
```

## 스크립트

```bash
npm run dev            # 개발 서버 실행
npm run build          # 프로덕션 빌드
npm test               # 테스트 실행 (250개)
npm run test:coverage  # 커버리지 리포트 (90% 이상 유지)
npm run test:e2e       # E2E 스모크 테스트 (Playwright)
npm run lint           # ESLint 검사
npx tsc --noEmit       # 타입 검사
```

## 폴더 구조

```
src/
├── app/
│   ├── api/
│   │   ├── notion/[pageId]/route.ts   # Notion 블록 조회 API (인증 불필요)
│   │   └── market/route.ts            # Yahoo Finance 프록시 (CORS 우회)
│   ├── layout.tsx
│   └── page.tsx                       # Async Server Component — Notion에서 구조 로딩
├── components/
│   ├── CategoryCard.tsx               # 카테고리 카드 (더 보기 / 모달 연동 / 열람 수 기록)
│   ├── Dashboard.tsx                  # 상태 관리 루트 컴포넌트
│   ├── Header.tsx                     # 검색 + 다크모드 토글
│   ├── HomeView.tsx                   # 홈 위젯 11종 + 드래그앤드롭 재정렬
│   ├── NotionModal.tsx                # 블록 렌더러 + 페이지 내비게이션
│   ├── SectionView.tsx                # 섹션 카드 그리드
│   └── Sidebar.tsx                    # 홈 + 섹션 네비게이션
├── data/
│   └── knowledge-base.ts             # 타입 정의 + 정적 폴백 데이터 + 검색 유틸
├── stores/
│   ├── widgetStore.ts                 # Zustand persist — 위젯 순서 (DnD)
│   ├── memoStore.ts                   # Zustand persist — 메모 목록 (최대 20개)
│   ├── ddayStore.ts                   # Zustand persist — D-Day 목록 (날짜 오름차순)
│   └── bookmarkStore.ts               # Zustand persist — 북마크 목록
├── hooks/
│   └── usePomodoro.ts                 # 포모도로 타이머 커스텀 훅
└── lib/
    ├── notion-structure.ts            # Notion 계층 구조 동적 파싱 (서버 전용)
    ├── view-tracker.ts                # localStorage 열람 수 추적 (클라이언트 전용)
    └── utils.ts                       # cn, 색상 클래스, URL 파싱
```

## Notion 구조 연동 방식

인증이 필요한 공식 Notion API 대신 공개 페이지에 인증 없이 접근하는 `loadPageChunk` API를 사용합니다.

> **참고**: 비공식 API이므로 Notion의 내부 변경에 영향을 받을 수 있습니다. 공식 Notion API 마이그레이션 시 `src/lib/notion-structure.ts`와 `src/app/api/notion/[pageId]/route.ts`만 교체하면 됩니다.

```
기술지원 (루트 페이지 ID: 40e1f915...)
  └─ 처리방법이 궁금해요  →  blue
       └─ 유팜시스템 (카테고리)
            └─ 처방조제, VAN Plus, ...  (링크)
  └─ 사용방법이 궁금해요  →  violet
  └─ 파일이 필요해요      →  emerald
```

Notion 구조 변경 시 앱을 재배포하면 자동으로 반영됩니다.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`)를 통해 `main` 브랜치 push 및 PR 시 자동으로 실행됩니다.

```
CI:  lint → type-check → test (coverage 90%+) → build
E2E: E2E 스모크 테스트 (Playwright, build-and-test 완료 후 실행)
CD:  Vercel 프로덕션 배포 (main push + CI/E2E 통과 시)
```

CD 설정: GitHub 저장소 Secrets에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 등록 필요.

## 테스트

```bash
npm test                  # 전체 테스트 (250개)
npm run test:coverage     # 커버리지 (전역 90% 이상 강제)
```

| 지표 | 수치 |
|------|------|
| 테스트 수 | 250개 |
| 구문 커버리지 | 99.1% |
| 브랜치 커버리지 | 95.9% |
| 함수 커버리지 | 100% |
| 라인 커버리지 | 99.8% |

커버리지 기준 미달 시 CI가 실패합니다 (`jest.config.ts` 참고).

### 테스트 전략

| 대상 | 전략 |
|------|------|
| Zustand 스토어 | `store.getState()` 직접 호출로 상태·액션 검증 |
| 커스텀 훅 | `renderHook` + `act` + fake timer |
| 위젯 컴포넌트 | `store.setState()`로 초기 데이터 주입 후 DOM 검증 |
| API Route | `fetch` 모킹 후 응답 형식·에러 분기 검증 |
| E2E (Playwright) | 홈 로딩, 사이드바 내비게이션, 검색 스모크 테스트 |
