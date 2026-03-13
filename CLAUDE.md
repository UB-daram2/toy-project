# 유팜시스템 지원 포털 대시보드

## 프로젝트 개요

유팜시스템 고객 지원 지식베이스를 트렌디한 대시보드 스타일로 시각화하는 Next.js 16 앱.
Notion 최상위 페이지(`기술지원`)에서 섹션 → 카테고리 → 링크 3단계 계층을 동적으로 파싱하여 카드 UI로 표시하고, 클릭 시 Notion 콘텐츠를 모달로 렌더링한다.

### 해결하는 문제

사내 Notion 지식베이스는 존재하지만 고객/지원 담당자가 빠르게 원하는 문서를 찾기 어려운 구조였다.
이 앱은 Notion 구조를 자동으로 읽어 검색 가능한 대시보드로 변환하고, 페이지를 떠나지 않고 인라인으로 내용을 볼 수 있게 한다.

### 핵심 의사결정

- **Notion 공식 API 대신 `loadPageChunk` 비공식 API 사용**: 인증 없이 공개 Notion 페이지에 접근 가능하여 API 키 관리 부담 없음
- **Server Component에서 구조 fetch**: 초기 렌더링 시 Notion 계층 구조를 서버에서 로딩하여 클라이언트 waterfall 방지
- **localStorage 기반 열람 추적**: 외부 서버 의존 없이 클라이언트에서 열람 수를 집계
- **Open-Meteo API**: 인증 불필요한 무료 날씨 API로 API 키 관리 없이 날씨/미세먼지 표시

## 기술 스택

- **Next.js 16** (App Router, Async Server Components)
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **next-themes** (다크모드)
- **lucide-react** (아이콘)
- **Jest + React Testing Library** (테스트, 커버리지 90% 이상 강제)

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
           ├─ HomeView.tsx    ← 홈 위젯 (최근 수정 Top5, 많이 본 게시물 Top5, 날씨)
           └─ SectionView.tsx ← 카테고리 카드 그리드
               └─ CategoryCard.tsx ← 카드 (더 보기/접기, 모달 연동, 열람 수 기록)
                   └─ NotionModal.tsx ← 블록 렌더러 + 모달 내 페이지 내비게이션

src/lib/notion-structure.ts   ← Notion 3단계 계층 파싱 (서버 전용)
src/lib/view-tracker.ts       ← localStorage 열람 수 추적 (클라이언트 전용)
src/lib/utils.ts              ← cn, 색상 클래스, URL 파싱
src/data/knowledge-base.ts    ← 타입 정의 + 정적 폴백 데이터 + 검색 유틸
src/app/api/notion/[pageId]/  ← Notion 블록 조회 API 라우트 (loadPageChunk 래핑)
```

### 데이터 흐름

```
서버: page.tsx → fetchKnowledgeStructure() → Notion loadPageChunk
       → KnowledgeSection[] → Dashboard (props)

클라이언트: CategoryCard 클릭
       → /api/notion/[pageId] → loadPageChunk → 블록 JSON
       → NotionModal 렌더링 + recordPageView(localStorage)
```

## 작성 규칙

- 실제 동작하는 코드만 작성 (미구현 stub 금지)
- 테스트 커버리지 90% 이상 유지
- 기능을 명확히 나타내는 이름 사용 (약어/모호한 이름 금지)
- 로직 블록마다 반드시 주석 작성

## 폴더 구조

- `src/app/` — App Router 페이지 및 레이아웃
- `src/components/` — 재사용 가능한 UI 컴포넌트
- `src/data/` — 타입 정의 + 정적 폴백 데이터
- `src/lib/` — 유틸리티 함수 (Notion 파싱, 열람 추적, 공통 유틸)
- `src/__tests__/` — Jest 테스트 파일

## 코드 스타일

- 2칸 들여쓰기
- ES modules (import/export)
- TypeScript strict mode
- 컴포넌트 파일명: PascalCase
- 유틸리티 파일명: camelCase
