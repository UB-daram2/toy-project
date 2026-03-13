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
- **모바일 반응형 레이아웃** — 모바일: 세로 자연 스크롤 + 하단 플로팅 네비게이션 바 / 데스크톱: 좌측 사이드바 고정
- **글래스모피즘 UI** — `backdrop-blur-2xl` + 반투명 배경으로 헤더·사이드바·하단 네비 계층감 구현, 인디고→바이올렛 그라디언트 활성 상태

## 사용자 시나리오

### 시나리오 1 — 고객 문의 즉시 대응

> 지원 담당자 A씨가 전화 중에 "처방조제 관련 오류"를 문의받는다.

1. 대시보드를 이미 열어둔 상태에서 Header 검색창에 "처방조제" 입력 (0ms 클라이언트 필터)
2. 검색 결과에서 해당 카테고리 카드 확인 → 링크 클릭
3. Notion 페이지 내용이 모달로 즉시 표시 — 탭 전환 없음
4. 서브페이지가 있는 경우 모달 내에서 이동, 뒤로가기로 복귀
5. 통화 종료 후 해당 문서가 "많이 본 게시물"에 자동 집계

**핵심 가치**: Notion 계정 없이, 탭 전환 없이, 지연 없이 문서 내용을 확인

### 시나리오 2 — 팀원 개인화 워크플로

> 담당자 B씨는 날씨·증시·환율을 매일 확인하고, D-Day로 제품 업데이트 일정을 관리한다.

1. 첫 접속 시 기본 위젯 배열에서 자주 쓰는 위젯(날씨, 증시)을 드래그로 상단으로 이동
2. D-Day 위젯에 "VAN Plus v2.0 출시" 이벤트 추가 → 오늘부터 D-14 카운트다운 표시
3. 북마크 위젯에 사내 인트라넷·공급사 URL 저장
4. 브라우저 종료 후 재접속해도 위젯 순서·D-Day·북마크가 복원됨 (Zustand persist → localStorage)

**핵심 가치**: 한 화면에서 지식베이스 탐색 + 업무 생산성 도구 통합, 개인 설정 영속화

### 시나리오 3 — Notion 문서 구조 업데이트

> Notion에서 새 섹션 "원격지원 방법"을 추가했다.

1. Notion에서 `기술지원` 페이지 하위에 새 섹션·카테고리·링크 추가 (기존 방식 그대로)
2. GitHub에 push → CI 통과 → Vercel 자동 재배포 (약 2분)
3. 배포 후 대시보드 새로고침 시 새 섹션이 자동 반영

**핵심 가치**: 운영자가 Notion 워크플로를 바꾸지 않아도 포털에 자동 반영

## 기술 스택

| 항목 | 버전 | 선택 이유 |
|------|------|-----------|
| Next.js (App Router) | 16 | 서버 컴포넌트로 Notion 구조 초기 로딩, 라우트 핸들러로 API 프록시 |
| TypeScript | 5 | 타입 안전성, 엄격 모드 (`any` 사용 금지) |
| Tailwind CSS | v4 | 빠른 UI 구현, 다크모드, `auto-rows-[300px]` 그리드 레이아웃 |
| next-themes | 최신 | SSR-safe 다크모드 전환 |
| lucide-react | 최신 | 일관된 아이콘 셋 |
| Zustand | 최신 | 위젯 순서·메모·D-Day·북마크 상태 persist (localStorage 자동 영속화, SSR-safe) |
| Jest + React Testing Library | 최신 | 284개 테스트 (API Route 포함), 커버리지 99%+, 90% 강제 |
| Playwright | 최신 | E2E 스모크 테스트 (홈 로딩, 내비게이션, 검색) |

### 외부 API 의존성 및 안정성 평가

| API | 용도 | 인증 | 비용 | 장애 시 영향 | 대응 전략 |
|-----|------|------|------|-------------|----------|
| Notion `loadPageChunk` | 지식베이스 구조 + 콘텐츠 | 불필요 | 무료 | 포털 전체 콘텐츠 미표시 | 정적 폴백 데이터(`knowledge-base.ts`)로 기본 기능 유지 |
| Open-Meteo | 현재 날씨 + 7일 예보 | 불필요 | 무료 | 날씨 위젯 에러 표시 | 위젯 내 에러 상태 처리, 나머지 위젯 영향 없음 |
| Frankfurter | 환율 | 불필요 | 무료 | 환율 위젯 에러 표시 | 위젯 내 에러 상태 처리 |
| Yahoo Finance | 국내 증시 | 불필요 (인증 없는 공개 엔드포인트) | 무료 | 증시 위젯 에러 표시 | `/api/market`에서 에러 시 `{kospi:null, kosdaq:null}` 반환, 위젯 자체 에러 상태 표시 |
| date.nager.at | 한국 공휴일 | 불필요 | 무료 | 공휴일 표시 누락 (캘린더 기능 유지) | `fetch` 실패 시 빈 배열 반환, 캘린더 네비게이션은 정상 동작 |

**마이그레이션 유연성**: Notion `loadPageChunk`와 Yahoo Finance는 인증 없이 접근하는 공개 엔드포인트로, 응답 형식이 변경될 경우 각각 `notion-structure.ts` + `api/notion/[pageId]/route.ts`, `api/market/route.ts` 단일 파일 교체만으로 다른 API로 전환 가능하다. 마이그레이션 경로는 CLAUDE.md에 상세 문서화했다.

## 개인화 기능 가이드 (Zustand persist)

브라우저의 localStorage에 자동 저장되므로 서버·회원가입 없이 개인 설정이 유지된다.

| 기능 | 저장 키 | 저장 내용 | 최대 용량 |
|------|---------|-----------|----------|
| 위젯 순서 | `upharm_widget_order` | 위젯 ID 배열 (드래그앤드롭 결과) | 11개 ID |
| 메모 | `upharm_memos` | `{id, content, createdAt}[]` | 최대 20개 |
| D-Day | `upharm_ddays` | `{id, name, date}[]` (날짜 오름차순) | 제한 없음 |
| 북마크 | `upharm_bookmarks` | `{id, name, url}[]` | 제한 없음 |

**데이터 초기화**: 브라우저 개발자 도구 → Application → Local Storage에서 위 키를 삭제하면 초기화된다.

**기기 이전**: 현재 localStorage 기반이므로 기기 간 동기화는 지원하지 않는다. 향후 공식 Notion API 전환 시 서버사이드 저장으로 확장 가능하다.

## 시작하기

```bash
npm install
npm run dev        # http://localhost:3000
```

## 스크립트

```bash
npm run dev            # 개발 서버 실행
npm run build          # 프로덕션 빌드
npm test               # 테스트 실행 (284개)
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

```
기술지원 (루트 페이지 ID: 40e1f915...)
  └─ 처리방법이 궁금해요  →  blue
       └─ 유팜시스템 (카테고리)
            └─ 처방조제, VAN Plus, ...  (링크)
  └─ 사용방법이 궁금해요  →  violet
  └─ 파일이 필요해요      →  emerald
```

Notion 구조 변경 시 앱을 재배포하면 자동으로 반영됩니다.

## CI/CD 파이프라인

GitHub Actions (`.github/workflows/ci.yml`)를 통해 `master` 브랜치 push 및 PR 시 자동으로 실행됩니다.

### 파이프라인 단계

```
push / PR
  │
  ▼
[1단계] build-and-test
  ├─ ESLint       — 코드 품질 정적 분석
  ├─ tsc --noEmit — 런타임 전 타입 오류 검출
  ├─ test:coverage — Jest 284개 + 커버리지 90% 미달 시 실패
  └─ build        — Next.js 프로덕션 빌드 성공 여부 확인
  │
  ▼ (build-and-test 통과 시)
[2단계] e2e
  ├─ build        — E2E 전용 빌드 (프로덕션 환경과 동일 조건)
  ├─ playwright install chromium
  └─ test:e2e     — 홈 로딩·사이드바 네비게이션·검색 스모크 테스트
  │               실패 시 playwright-report 아티팩트 7일 보관
  │
  ▼ (master push + 1·2단계 모두 통과 시)
[3단계] deploy
  └─ vercel --prod — Vercel 프로덕션 배포
```

### 2단계 테스트 전략의 이유

단위 테스트(1단계)와 E2E 테스트(2단계)를 분리한 이유:

- **단위 테스트**: Zustand 스토어·커스텀 훅·API Route·위젯 컴포넌트를 격리하여 빠르게 실행 (284개, 약 30초). 함수/분기 수준의 회귀를 조기 발견.
- **E2E 테스트**: 실제 빌드된 앱을 Chromium 브라우저로 실행하여 사용자 흐름 전체를 검증. 단위 테스트로는 검출 불가능한 라우팅·하이드레이션·렌더링 문제를 잡는다.
- **순서 보장**: E2E job이 build-and-test job에 `needs: build-and-test`로 의존하므로, 단위 테스트 실패 시 E2E 실행 자체가 스킵된다. 불필요한 Playwright 빌드 비용을 줄이는 동시에 실패 지점을 명확히 한다.

### 롤백 전략

| 상황 | 대응 |
|------|------|
| CI 실패 | master push 자체가 차단 — broken build는 프로덕션에 도달하지 않음 |
| Vercel 배포 실패 | Dashboard → Deployments → 이전 빌드 "Promote to Production" → 다운타임 없이 즉시 롤백 |
| 런타임 오류 발견 | 동일 방법으로 이전 배포로 즉시 롤백, 이후 수정 후 재배포 |

CD 설정: GitHub 저장소 Secrets에 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 등록 완료.

## 테스트

```bash
npm test                  # 전체 테스트 (284개)
npm run test:coverage     # 커버리지 (전역 90% 이상 강제)
```

| 지표 | 수치 |
|------|------|
| 테스트 수 | 284개 (API Route 포함) |
| 구문 커버리지 | 99.1% |
| 브랜치 커버리지 | 95.9% |
| 함수 커버리지 | 100% |
| 라인 커버리지 | 99.8% |

커버리지 기준 미달 시 CI가 실패합니다 (`jest.config.ts` 참고).

### 테스트 전략

| 대상 | 전략 | 이유 |
|------|------|------|
| Zustand 스토어 | `store.getState()` 직접 호출로 상태·액션 검증 | 컴포넌트 렌더링 없이 스토어 로직만 격리 테스트 |
| 커스텀 훅 | `renderHook` + `act` + fake timer | 비동기 상태 변화를 동기적으로 검증 |
| 위젯 컴포넌트 | `store.setState()`로 초기 데이터 주입 후 DOM 검증 | 실제 localStorage 접근 없이 렌더링 결과 검증 |
| API Route | `fetch` 모킹 후 응답 형식·에러 분기 검증 | `@jest-environment node`로 Node.js 환경 격리 |
| E2E (Playwright) | 홈 로딩, 사이드바 내비게이션, 검색 스모크 테스트 | 실제 브라우저에서 사용자 흐름 전체 검증 |
