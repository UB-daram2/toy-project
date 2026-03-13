# Changelog

## [0.7.0] — 2026-03-13

### Added
- **API Route 테스트** (`@jest-environment node`):
  - `GET /api/notion/[pageId]`: formatPageId, convertRichText, convertBlock, 에러 분기, Cache-Control 헤더 — 20개 테스트
  - `GET /api/market`: KOSPI·KOSDAQ 정상·실패·예외·엣지케이스 — 14개 테스트
  - 전체 테스트: 250개 → 284개
- **Notion API Route 응답 캐싱**: `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`

### Changed
- **메모·D-Day·북마크 상태**: `useEffect + localStorage` → Zustand persist 스토어 (`memoStore`, `ddayStore`, `bookmarkStore`) 이관 — SSR 하이드레이션 불일치 근본 해결
- **PomodoroWidget**: 상태 로직을 `usePomodoro` 커스텀 훅으로 분리 (관심사 분리)
- **위젯 순서 스토어**: `mergeWidgetState` 함수 export 추가 (100% 단위 테스트 가능)
- CI/CD: deploy job 브랜치 조건 `main` → `master` 수정 (Vercel 자동 배포 정상 동작)

### Fixed
- `eslint-disable-next-line react-hooks/set-state-in-effect` 패턴 제거 (Zustand persist 전환으로 불필요)

---

## [0.6.0] — 2026-03-13

### Added
- **D-Day 카운터 위젯**: 이벤트 이름·날짜 입력, Zustand persist 영속화, 날짜 오름차순 정렬
- **북마크 위젯**: 이름·URL 입력, https:// 자동 추가, Zustand persist 영속화
- **미니 캘린더 위젯**: 월 네비게이션, date.nager.at API 한국 공휴일 표시
- **포모도로 타이머 위젯**: 집중 25분 / 휴식 5분, 원형 진행 표시, 자동 모드 전환
- **주간 날씨 예보 위젯**: Open-Meteo 7일 daily forecast, 최고/최저 기온·날씨 아이콘·강수량
- **드래그앤드롭 위젯 재정렬**: HTML5 DnD (마우스) + Pointer Events API (터치) 이중 구현
- **균일 카드 높이**: CSS Grid `auto-rows-[300px]`로 모든 카드 높이 고정, 내용 오버플로 스크롤
- **환율 위젯**: Frankfurter API (1 USD 기준 KRW · EUR · JPY · CNY)
- **국내 증시 위젯**: Yahoo Finance 비공식 API, Next.js API Route `/api/market`으로 CORS 우회
- **메모 위젯**: Zustand persist 영속화, Enter키 입력 지원, 최대 20개 보관
- **날씨 & 미세먼지 위젯**: Open-Meteo API, 위치 기반(Geolocation), 서울 기본값 / PM2.5·PM10 등급 색상 표시
- **최근 수정 Top 5 위젯**: Notion `last_edited_time` 기반 정렬
- **많이 본 게시물 Top 5 위젯**: localStorage 열람 수 집계
- **홈 대시보드 뷰** (`HomeView`): 위젯 레이아웃 기반 메인 화면
- E2E 스모크 테스트 (Playwright): 홈 로딩, 사이드바 네비게이션, 검색

### Changed
- 다크모드: `next-themes` SSR-safe 토글 적용
- 검색: 섹션 · 카테고리 · 문서명 전체 텍스트 실시간 필터링
- GitHub Actions CI/CD: lint → type-check → test(coverage 90%+) → build → E2E → Vercel deploy

### Fixed
- 드래그 비활성 상태에서 링 강조 표시되는 버그 수정 (`draggingId !== null` 조건 추가)

---

## [0.1.0] — 2026-03-13

### Added
- 프로젝트 초기 설정: Next.js 16, TypeScript strict, Tailwind CSS v4
- Notion `loadPageChunk` 비공식 API로 지식베이스 구조 동적 파싱
- 섹션 · 카테고리 · 링크 3단계 계층 카드 UI
- Notion 콘텐츠 모달 (`NotionModal`): paragraph, heading, list, callout, image, toggle, child_page 블록 렌더링
- 모달 내 서브페이지 내비게이션 (뒤로가기 지원)
- 카테고리 카드 더 보기 / 접기 (기본 6개, 확장 시 전체 표시)
- 사이드바 네비게이션 + 헤더 검색
- 정적 폴백 데이터 (`knowledge-base.ts`)
- Jest + React Testing Library 기반 테스트 환경, 커버리지 90% 이상 강제
- GitHub Actions CI/CD 파이프라인
