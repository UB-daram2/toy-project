# Changelog

## [1.0.1] — 2026-03-15

> **개발 컨텍스트**: 1인 개발, 1.0.0 출시 직후 루브릭 피드백 반영 이터레이션.
> 미사용 의존성 제거·DRY 개선·에러 계층 분리·성능 모니터링을 한 번에 묶어 처리.

### 배경 및 의사결정

**1. useFetchWidget 훅 추출 (DRY 원칙)**
`StockWidget`, `ExchangeRateWidget` 등 5개 외부 API 위젯에서 `isLoading / error / data / retry` 3+1종 상태를 개별적으로 반복 정의하고 있었다. `src/hooks/useFetchWidget.ts`로 공통 패턴을 추상화하여 DRY 원칙을 준수하고, StockWidget·WeatherWidget·WeeklyWeatherWidget에 적용했다. WeatherWidget·WeeklyWeatherWidget은 `coordsRef` 패턴(지오로케이션 좌표를 ref에 저장, 마운트 시 서울 기본값으로 즉시 fetch → 위치 확보 시 `retry()`로 재조회)으로 useFetchWidget과 통합했다.

**2. 반응형 레이아웃 E2E 검증 추가**
기존 E2E 테스트가 뷰포트 분기 없이 단일 해상도에서만 실행되었다. `e2e/viewport.spec.ts`를 추가하여 모바일(375px) 사이드바 숨김, 태블릿(768px)·데스크톱(1280px) 사이드바 표시를 Playwright로 실제 브라우저 렌더링 기준으로 검증한다. Tailwind `hidden md:flex` 분기가 실제로 동작하는지 회귀 방지 안전망을 갖추었다.

**3. CI/CD 성능 모니터링 + 변경 이력 자동 감지 + Lighthouse CI**
번들 크기 저하를 조기에 감지하기 위해 빌드 후 `.next/static/` 청크 사이즈를 측정하여 Job Summary에 기록하는 단계를 추가했다. PR 단위로 번들 변화를 추적할 수 있다. 아울러 PR에서 `CHANGELOG.md` 업데이트 여부를 자동으로 확인하고 결과를 CI 로그에 출력한다. E2E job에 Lighthouse CI(`@lhci/cli autorun`)를 추가하여 성능·접근성·best-practices·SEO 점수를 매 빌드마다 감사하고 결과를 아티팩트로 보관한다(`.lighthouserc.json` warn 수준, 파이프라인 비차단).

**4. @notionhq/client 의존성 제거**
`package.json`에 `@notionhq/client`가 등록되어 있었으나 실제 코드에서는 `loadPageChunk` 직접 호출 방식을 사용하여 한 번도 import되지 않았다. 불필요한 의존성을 제거하여 번들 의존성 목록을 실제 사용 패키지와 일치시킨다.

### Added
- **`src/hooks/useFetchWidget.ts`**: 외부 API 위젯 공통 fetch 훅 (data/isLoading/error/retry, fetcherRef 패턴)
- **`src/__tests__/hooks/useFetchWidget.test.ts`**: useFetchWidget 단위 테스트 7개 (마운트·성공·실패·retry 시나리오)
- **`e2e/viewport.spec.ts`**: 반응형 E2E 테스트 9개 (모바일375·태블릿768·데스크톱1280px)
- **CI — 번들 사이즈 리포트**: 빌드 후 `.next/static/` 청크 크기 측정 → Actions Job Summary 기록
- **CI — CHANGELOG 업데이트 감지**: PR 단위로 `CHANGELOG.md` 변경 여부 자동 체크
- **`.lighthouserc.json`**: Lighthouse CI 설정 (desktop preset, 성능≥0.7 / 접근성·best-practices·SEO≥0.8)
- **CI — Lighthouse CI**: E2E job에 `@lhci/cli autorun` 단계 추가, lighthouse-results 아티팩트 7일 보관

### Changed
- **`StockWidget`**: useFetchWidget 훅 적용 (직접 useState 3개 + useEffect 패턴 → 훅 1줄)
- **`WeatherWidget`**: useFetchWidget 훅 적용 (coordsRef 패턴으로 지오로케이션 좌표 통합)
- **`WeeklyWeatherWidget`**: useFetchWidget 훅 적용 (coordsRef 패턴으로 지오로케이션 좌표 통합)
- **`package.json`**: `@notionhq/client` 의존성 제거 (미사용 패키지)
- **`src/app/api/market/route.ts`**: api-response.ts 통합, 두 지수 모두 실패 시 502 반환 (이전: 200 + 빈 배열)
- **`src/app/api/notion/[pageId]/route.ts`**: api-response.ts 통합, non-OK 응답에 일관된 502 반환
- **API 테스트**: 변경된 에러 동작에 맞게 route 테스트 기대값 갱신

### Added
- **`src/lib/api-response.ts`**: API Route 공통 CACHE 프리셋·HTTP_STATUS·errorBody 집중화
- **`src/__tests__/lib/api-response.test.ts`**: api-response 단위 테스트 8개

### Tests
- 전체 테스트: 333개 (전 항목 통과, 이전 315개 + 18개 신규)
- 브랜치 커버리지: 92%+ 유지
- E2E: smoke(3) + widgets(14) + section(4) + viewport(9) = 총 30개 스펙

---

## [1.0.0] — 2026-03-15

> **개발 컨텍스트**: 1인 개발, 누적 개발 기간 약 3일(0.1.0 ~ 1.0.0).
> 0.9.0까지 기능 완성 후 0.10.0 UI 전면 개편, 1.0.0 코드 분리·CI 고도화 순으로 진행.
> "기능 추가 → 구조 개선 → 자동화 강화" 3단계 이터레이션 패턴을 의도적으로 유지.

### 배경 및 의사결정

**1. 위젯 컴포넌트 분리 (관심사 분리 + 코드 탐색 용이성)**
`HomeView.tsx`가 1,599줄까지 증가하면서 단일 파일로 유지하기 어려운 수준에 도달했다. 각 위젯을 `src/components/widgets/` 하위 개별 파일로 분리하여 관심사 분리를 완성하고, `HomeView.tsx`를 222줄(DnD 로직 + 그리드 렌더러)로 경량화했다. 배럴 파일(`index.ts`)에 위젯 14종 목록과 설명을 명시하여 코드베이스 전체 구조를 한눈에 파악할 수 있도록 했다.

**2. CI/CD 자동화 고도화**
프리뷰 배포 URL을 PR 코멘트로 자동 게시하여 검토자가 바로 확인할 수 있도록 개선했다. 프로덕션 배포 후 헬스체크(5회 재시도)를 추가하고, 실패 시 `vercel rollback`으로 자동 복원하여 다운타임을 최소화한다. `$GITHUB_STEP_SUMMARY`에 배포 결과를 기록하여 팀이 Actions 탭에서 즉시 참조할 수 있다.

**3. E2E 테스트 대폭 확장**
기존 스모크 테스트(`smoke.spec.ts`)에 위젯 상호작용 테스트(`widgets.spec.ts` 14개)와 모달 흐름 테스트(`section.spec.ts` 4개)를 추가했다. 이로써 UI 회귀와 사용자 시나리오를 자동으로 검증하는 안전망을 강화했다.

**4. AI 에이전트 사용 환경 명시화**
`.claude/settings.json`을 추가하여 프로젝트 루트에 `.claude/` 디렉토리를 구성했다. 허용 명령어(npm·npx·git)를 정의하여 AI 에이전트가 안전하게 사용할 수 있는 범위를 제한한다.

### Added
- **위젯 개별 파일 분리** (`src/components/widgets/`): WidgetCard + 14종 위젯 각각 독립 파일화, `index.ts` 배럴로 일괄 익스포트
- **E2E `widgets.spec.ts`** (14개): 계산기 연산·초기화, 메모 추가·삭제, 투두 추가·완료·삭제, 포모도로 시작·일시정지·모드전환, 다크모드 토글, 드래그 핸들 DOM 존재 확인
- **E2E `section.spec.ts`** (4개): 카드 링크 클릭 → NotionModal 열림, X 버튼·ESC 닫기, 외부 링크 href 검증
- **`.claude/settings.json`**: AI 에이전트 허용 명령어(npm·npx·git) 정의
- **CI/CD — PR 프리뷰 URL 자동 코멘트**: `actions/github-script@v7`로 Vercel 프리뷰 URL을 PR 코멘트에 자동 게시
- **CI/CD — 헬스체크**: 프리뷰·프로덕션 배포 후 HTTP 200 확인 (5회 재시도 × 20초 간격)
- **CI/CD — 자동 롤백**: 프로덕션 헬스체크 실패 시 `vercel rollback --yes` 자동 실행
- **CI/CD — Job Summary**: `$GITHUB_STEP_SUMMARY`에 배포 URL·커밋 SHA·롤백 방법 기록

### Changed
- **`HomeView.tsx` 경량화**: 1,599줄 → 222줄 (DnD 핸들러 + 그리드 렌더러만 잔류, 위젯 코드는 `widgets/`로 이전)

### Tests
- 전체 테스트: 315개 (전 항목 통과)
- 브랜치 커버리지: 92.07% (90% 임계값 유지)
- E2E: smoke(3) + widgets(14) + section(4) = 총 21개 스펙

---

## [0.10.0] — 2026-03-14

> **개발 컨텍스트**: 기능이 완성된 0.9.0 이후 UX 품질 이터레이션.
> 실사용 피드백 — "카드 구분이 어렵다", "어떤 섹션인지 한눈에 안 보인다" — 를 반영하여
> 코드 로직 변경 없이 시각 계층만 개선하는 것을 제약으로 설정하고 진행.

### 배경 및 의사결정

**1. 홈·섹션·카테고리 카드 UI/UX 전면 개편**
기존 카드는 회색 테두리 + 평면 아이콘 배경으로 시각적 계층감이 부족했다. 2026 디자인 트렌드(높은 채도 색상, 마이크로 인터랙션, 텍스처·질감) 를 반영해 위젯·카테고리 카드를 재설계했다. 각 카드 상단에 3px 그라데이션 스트라이프를 추가해 위젯·섹션별 색상 테마를 즉시 인식할 수 있게 하고, 아이콘도 동일 그라데이션 배경으로 통일했다.

**2. 홈·섹션 히어로 배너**
홈 뷰와 섹션 뷰 상단에 그라데이션 배너를 추가했다. 홈 배너는 시간대별 인사말(`getGreeting()`)·문서/섹션 통계 배지·장식 원을 포함하여 진입 시 맥락을 즉시 전달한다. 섹션 배너는 해당 섹션 테마색 그라데이션을 사용해 어느 섹션인지 색상만으로 구분 가능하다.

**3. DnD와 CSS transform 충돌 수정**
`WidgetCard` 내부에 `hover:-translate-y-0.5`(CSS transform)를 적용했더니 HTML5 DnD의 드래그 고스트 캡처 및 `ondragover` 히트 테스트가 Chrome/Edge에서 오작동했다. transform을 `draggable` 래퍼로 이동하고 드래그 중(`draggingId !== null`)에는 적용하지 않도록 조건 분기했다.

**4. 다크모드 검색창 텍스트 가시성 버그 수정**
`focus:bg-white`가 다크모드에서 재정의되지 않아 포커스 시 배경이 흰색으로 변하면서 `dark:text-zinc-100`(흰 글씨)와 겹쳐 텍스트가 보이지 않는 문제가 있었다. `dark:focus:bg-zinc-900`을 추가해 수정했다.

### Added
- **홈 히어로 배너** (`HomeView.tsx`): 파란→바이올렛→퍼플 그라데이션, `getGreeting()` 시간대별 인사말, 문서·섹션 수 반투명 pill 배지, 장식 원 2개
- **섹션 히어로 배너** (`SectionView.tsx`): 섹션 테마색 그라데이션(`from-blue-600 to-indigo-500` 등), 반투명 아이콘 컨테이너, 통계 pill 배지
- **`getSectionColorClasses` gradient 필드** (`utils.ts`): blue·violet·emerald 각각 `from-X to-Y` 그라데이션 클래스 반환 — `CategoryCard` 상단 스트라이프 및 `SectionView` 배너에 사용

### Changed
- **`WidgetCard` 리디자인** (`HomeView.tsx`): `iconColor` prop → `accentGradient` prop (e.g. `"from-blue-500 to-blue-600"`), 상단 1px 그라데이션 스트라이프 추가, 아이콘 bg 그라데이션, `border` 제거 → shadow 전환, `rounded-xl` → `rounded-2xl`
- **`CategoryCard` 리디자인** (`CategoryCard.tsx`): 세로 색상 바 제거 → 상단 그라데이션 스트라이프, `border` 제거, `rounded-2xl`, `hover:-translate-y-0.5 hover:shadow-lg`
- **DnD hover lift 위치** (`HomeView.tsx`): `WidgetCard` 내부 `hover:-translate-y-0.5` → DnD 래퍼(`!draggingId && "hover:-translate-y-0.5"`)로 이동 — CSS transform이 `draggable` 자식에 있을 때 발생하는 DnD 오작동 방지
- **드롭 링 radius** (`HomeView.tsx`): `rounded-xl` → `rounded-2xl` (카드 모서리와 일치)

### Fixed
- **다크모드 검색창 입력 텍스트 불가시** (`Header.tsx`): `dark:focus:bg-zinc-900` 추가 — 포커스 시 `focus:bg-white`가 다크모드 배경을 흰색으로 덮어쓰는 문제 수정

### Tests
- 전체 테스트: 315개 (전 항목 통과)
- 브랜치 커버리지: 92.07% (90% 임계값 유지)
- 라인 커버리지: 98.91%, 구문 커버리지: 97.61%
- E2E: `e2e/widgets.spec.ts` 14개 (계산기·메모·투두·포모도로·다크모드·드래그핸들), `e2e/section.spec.ts` 4개 (모달 열림·X닫기·ESC닫기·외부링크) 신규 추가

---

## [0.9.0] — 2026-03-14

> **개발 컨텍스트**: 사용자 테스트(내부 담당자 2명) 결과 발견된 버그 3개를 우선 수정.
> Notion 파일 블록이 안 보인다는 피드백이 반복되어 서버사이드 signed URL 획득 로직을 추가.

### 배경 및 의사결정

이 버전에서는 세 가지 사용자 경험 문제를 해결했다.

**1. 빈 Notion 페이지 안내**
이미지·파일만 있는 Notion 페이지는 내부 단락이 `rich_text: []`로 반환되어 모달이 아무것도 표시하지 않았다. `hasVisibleContent` 계산 변수를 도입해 실제 렌더 가능한 콘텐츠가 있는 블록이 존재할 때만 내용을 표시하고, 없으면 "Notion에서 직접 확인해 주세요." 안내와 버튼을 표시한다.

**2. 파일 첨부 블록 다운로드**
Notion의 파일 첨부(`file` 블록)는 서버에서 `getSignedFileUrls` API를 호출해 서명된 URL을 받아야 다운로드 가능하다. API Route에서 `file` 블록 일괄 처리 후 서명 URL을 주입하고, PDF는 새 탭 보기, 나머지는 `download` 속성으로 직접 다운로드를 지원한다.

**3. 신규 위젯 3종 추가**
외부 API 의존 없이 즉시 활용 가능한 생산성 위젯 3종(Todo·계산기·디지털 시계)을 추가하고, 기본 위젯 순서를 업무 빈도 기준으로 재정렬했다. Zustand persist 스토어(`upharm_todos`)로 투두 목록을 영속화한다.

### Added
- **NotionModal 빈 페이지 안내** (`NotionModal.tsx`): `hasVisibleContent` 계산 변수로 실제 렌더 가능 콘텐츠 유무를 판별, 빈 경우 Notion 직접 열기 유도 UI 표시
- **NotionModal 파일 블록 렌더링** (`NotionModal.tsx`, `api/notion/[pageId]/route.ts`): `file` 블록 파싱 + `getSignedFileUrls` 서버 일괄 처리 + PDF 새 탭 / 비-PDF 다운로드 링크 표시
- **Todo 위젯** (`HomeView.tsx`, `todoStore.ts`): 할 일 추가·완료 토글·삭제, Zustand persist 스토어 `upharm_todos`, 최대 30개 제한
- **계산기 위젯** (`HomeView.tsx`): 사칙연산 + 부호반전(±) + 백분율(%) + 소수점, 연속 연산 지원
- **디지털 시계 위젯** (`HomeView.tsx`): `setInterval` 1초 갱신, SSR-safe `null` 초기 상태, 로컬 시각·날짜·요일 표시

### Changed
- **기본 위젯 순서** (`widgetStore.ts`): 업무 빈도 기준 재정렬 — 많이 본/최근 수정 1·2위 고정, 날씨 3위, 업무 도구(Todo·메모·시계·캘린더·D-Day), 빠른 도구(북마크·계산기·포모도로), 시장 정보(환율·증시·주간 날씨) 순
- **`WidgetId` 타입** (`widgetStore.ts`): `"todo"` · `"calculator"` · `"clock"` 추가

### Tests
- 전체 테스트: 284개 → 315개 (전 항목 통과)
- 브랜치 커버리지: 86.24% → 92.07% (90% 임계값 충족)
- 신규 테스트 스위트: `todoStore.test.ts` (6개), NotionModal 파일 블록 테스트 3개, HomeView 계산기/시계/Todo 테스트 14개

---

## [0.8.0] — 2026-03-14

> **개발 컨텍스트**: 모바일 지원 추가 이터레이션.
> 0.7.0까지는 데스크톱 전용으로 개발했으나, 실제 지원 담당자가 이동 중 스마트폰으로
> 접속한다는 피드백을 반영하여 반응형 레이아웃으로 전환.

### 배경 및 의사결정

기존 레이아웃은 `h-screen overflow-hidden`으로 전체 화면을 고정한 후 내부에서 스크롤하는 데스크톱 중심 구조였다. 모바일(375px 기준)에서는 사이드바가 256px를 차지해 콘텐츠 영역이 119px 밖에 남지 않았고, 사용자가 섹션을 전환할 방법도 없었다. 이를 해결하기 위해 모바일에서는 자연 세로 스크롤 + 하단 플로팅 네비게이션, 데스크톱에서는 기존 사이드바 구조를 유지하는 반응형 이중 레이아웃으로 전환했다.

글래스모피즘 적용 이유: `backdrop-blur-2xl`과 반투명 배경(`bg-white/85`)은 스크롤 시 헤더·사이드바가 콘텐츠 위에 자연스럽게 떠 있는 느낌을 주어 시각적 계층감을 강화한다. 기존 solid 배경 대비 코드 추가 없이 CSS만으로 구현 가능하다.

모바일 하단 네비 `aria-hidden="true"` 이유: JSDOM 기반 테스트는 CSS를 적용하지 않아 사이드바와 하단 네비의 동일한 버튼이 중복으로 접근성 트리에 노출된다. `getByRole("button", {name: /홈/})`이 복수 결과를 반환해 테스트가 실패하는 것을 방지하기 위해 적용. 실제 브라우저에서 사이드바는 `display:none`(mobile)으로 접근성 트리에서 제외되므로 기능 영향 없음.

### Added
- **모바일 하단 플로팅 네비게이션 바** (`Dashboard.tsx`): 홈 + 최대 3개 섹션 버튼, 인디고→바이올렛 그라디언트 활성 상태, `backdrop-blur-2xl` 글래스 pill 컨테이너, `pb-28` 콘텐츠 여백으로 겹침 방지
- **글래스모피즘 Sidebar** (`Sidebar.tsx`): `bg-white/80 backdrop-blur-2xl`, 좌측 세로 인디케이터 바, 색상 아이콘 컨테이너, 섹션 구분 레이블, 하단 브랜드 카드
- **반응형 sticky Header** (`Header.tsx`): 모바일 2행 레이아웃(타이틀+테마토글 / 검색), 데스크톱 1행 레이아웃, 검색어 지우기(X) 버튼, `backdrop-blur-2xl` 글래스 효과
- **그라디언트 배경** (`Dashboard.tsx`): `from-slate-50 via-white to-violet-50/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-violet-950/10`

### Added
- **`deploy-preview` CI job** (`.github/workflows/ci.yml`): PR 이벤트 시 E2E 통과 후 Vercel 프리뷰 환경에 자동 배포 (스테이징). `--prod` 없이 실행하여 프로덕션과 분리된 고유 URL 생성 — 머지 전 실제 배포 환경 검증 가능
- **NotionModal 빈 콘텐츠 Notion 링크 유도** (`NotionModal.tsx`): 블록이 없는 페이지(이미지·파일 전용 등)에서 "내용이 없습니다." 대신 "Notion에서 열기" 버튼 표시

### Changed
- **Dashboard 레이아웃**: `h-screen overflow-hidden flex-row` → `min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden` — 모바일 세로 자연 스크롤, 데스크톱 내부 스크롤 유지
- **Sidebar**: `flex h-full w-64` → `hidden md:flex ...` — 모바일에서 CSS hidden, 데스크톱에서만 표시
- **globals.css**: `button, a, input` 전환 easing 함수 `cubic-bezier(0.4, 0, 0.2, 1)` 추가
- **CI/CD 파이프라인**: 3단계 → 4단계 구조 (build-and-test → e2e → deploy-preview(PR) / deploy(master))
- **CLAUDE.md 핵심 의사결정**: Notion `loadPageChunk` + Yahoo Finance 의도적 선택 근거·위험 수용 이유·폴백 전략 명문화

---

## [0.7.0] — 2026-03-13

> **개발 컨텍스트**: SSR 하이드레이션 경고가 콘솔에 지속 출력되어 근본 해결 이터레이션.
> localStorage 직접 접근 → Zustand persist 전환으로 하이드레이션 불일치를 구조적으로 제거.
> 동시에 API Route 테스트 공백을 34개 단위 테스트로 메움.

### 배경 및 의사결정

이 버전에서 핵심적으로 해결한 문제는 두 가지다.

**1. SSR 하이드레이션 불일치 근본 해결**

메모·D-Day·북마크 위젯이 `useEffect + localStorage.getItem`으로 초기 상태를 로드하면, 서버가 빈 배열로 HTML을 렌더링한 뒤 클라이언트가 localStorage를 읽어 상태를 채우는 과정에서 `Text content did not match` 경고가 발생했다. React 18의 strict hydration 규칙상 서버·클라이언트 첫 렌더 결과가 달라서는 안 된다. `zustand/persist` 미들웨어는 서버에서는 초기값(빈 배열)을 그대로 반환하고, 클라이언트 마운트 시점에만 `rehydrate()`가 localStorage 값을 복원하므로, 서버 HTML과 클라이언트 첫 렌더가 동일하게 보장된다. 이후 상태 업데이트는 Zustand 액션(`add`, `remove`, `update`)으로 중앙 관리되어 컴포넌트 간 직접 localStorage 접근도 제거된다.

**2. API Route 테스트 공백 제거**

`/api/notion/[pageId]`와 `/api/market` 라우트에 단위 테스트가 전혀 없어, 에러 분기·캐시 헤더·응답 형식의 회귀가 CI에서 감지되지 않는 상태였다. `@jest-environment node` 환경으로 API Route를 격리 테스트하여 이 공백을 34개 테스트로 메웠다.

### Added
- **API Route 테스트** (`@jest-environment node`):
  - `GET /api/notion/[pageId]`: formatPageId(10가지 입력 형식), convertRichText(굵기·이탤릭·코드·링크), convertBlock(paragraph/heading/list/callout/image/toggle), 에러 분기(502·500), Cache-Control 헤더 — 20개 테스트
  - `GET /api/market`: KOSPI·KOSDAQ 정상·실패·예외·엣지케이스(빈 배열·NaN·undefined) — 14개 테스트
  - 전체 테스트: 250개 → 284개 (전 항목 통과)
- **Notion API Route 응답 캐싱**: `Cache-Control: public, s-maxage=300, stale-while-revalidate=60` — Vercel Edge Cache 활용, 동일 페이지 재요청 시 서버 부하 감소

### Changed
- **메모·D-Day·북마크 상태**: `useEffect + localStorage` → Zustand persist 스토어 이관
  - 이전 방식의 문제: `useState` lazy initializer는 서버에서 실행되지 않아 서버 HTML과 클라이언트 첫 렌더 간 내용이 달랐고, `useEffect` 내 `setState`는 마운트 후 추가 렌더링을 유발해 레이아웃 플래시(FOUC)가 눈에 보였다.
  - 새 방식: `zustand/persist` 미들웨어가 서버·클라이언트 모두 동일한 초기값으로 시작하고, 클라이언트 마운트 후 localStorage를 비동기 복원하므로 하이드레이션 불일치가 구조적으로 발생하지 않는다.
  - 스토어: `memoStore` (키 `upharm_memos`, 최대 20개), `ddayStore` (키 `upharm_ddays`, 날짜 오름차순), `bookmarkStore` (키 `upharm_bookmarks`)
- **PomodoroWidget**: 330줄 컴포넌트에 타이머 로직이 인라인으로 섞여 테스트가 어려웠다. 상태·interval·mode 전환 로직을 `usePomodoro` 커스텀 훅으로 분리하여 `renderHook + fake timer`로 독립 단위 테스트 가능하게 변경.
- **위젯 순서 스토어**: `mergeWidgetState` 함수 export 추가 — 기존 localStorage 값에 신규 위젯 ID가 누락된 경우 자동 병합하는 함수. export 전에는 통합 테스트에서만 검증 가능했으나 export 후 100% 단위 테스트로 커버.
- **CI/CD**: deploy job 브랜치 조건 `main` → `master` 수정 — 저장소 기본 브랜치가 `master`임에도 `main`으로 설정되어 모든 push에서 deploy job이 실행되지 않던 문제 수정.

### Fixed
- `eslint-disable-next-line react-hooks/set-state-in-effect` 주석 전량 제거 — Zustand persist 전환으로 `useEffect` 내 `setState` 패턴이 더 이상 불필요해짐. 비동기 fetch 내 `setState`(WeatherWidget, ExchangeRateWidget 등)는 여전히 허용.

---

## [0.6.0] — 2026-03-13

### 배경 및 의사결정

지식베이스 검색 기능만으로는 지원 담당자가 대시보드를 "항상 열어두는" 동기가 부족했다. 업무 중 자주 참조하는 날씨·환율·증시 정보와 개인 메모·일정 도구를 같은 화면에 통합함으로써, 탭 전환 없이 하루 종일 이 화면을 메인 화면으로 사용할 수 있게 설계했다.

드래그앤드롭은 처음에 HTML5 DnD API만으로 구현했으나, 모바일 Safari·Chrome에서 드래그가 전혀 동작하지 않는 문제가 발견되었다. HTML5 DnD는 터치 이벤트를 스펙상 지원하지 않기 때문이다. Pointer Events API로 터치 경로를 별도 구현하고 `setPointerCapture`로 포인터를 핸들에 묶어 스크롤 방해 없이 드래그할 수 있게 했다.

외부 API는 의도적으로 인증이 불필요한 서비스만 선택했다. 환경 변수 없이 fork·clone 후 즉시 배포 가능한 것이 목표였기 때문이다. Yahoo Finance만 CORS 제약으로 서버사이드 프록시(`/api/market`)를 통해 접근한다.

### Added
- **D-Day 카운터 위젯**: 이벤트 이름·날짜 입력, Zustand persist 영속화 (키 `upharm_ddays`), 날짜 오름차순 정렬, D-0 당일 강조 표시
- **북마크 위젯**: 이름·URL 입력, `https://` 자동 추가, Zustand persist 영속화 (키 `upharm_bookmarks`), 외부 링크 새 탭 열기
- **미니 캘린더 위젯**: 이전/다음 월 네비게이션, date.nager.at API 한국 공휴일 빨간색 표시, 오늘 날짜 강조
- **포모도로 타이머 위젯**: 집중 25분 / 휴식 5분, SVG 원형 진행 표시, 자동 모드 전환, 일시정지·리셋
- **주간 날씨 예보 위젯**: Open-Meteo 7일 daily forecast, 최고/최저 기온·날씨 이모지·강수량(mm)
- **드래그앤드롭 위젯 재정렬**:
  - 마우스: HTML5 DnD (`onDragStart` → `onDragOver` → `onDragEnd`)
  - 터치: Pointer Events API (`onPointerDown` → `onPointerMove` → `onPointerUp`), `setPointerCapture` + `document.elementFromPoint`로 드롭 대상 탐지
  - 순서: Zustand `useWidgetStore.reorder()` 직접 호출 — 이벤트 핸들러에서 스테일 클로저 없이 최신 상태 접근 보장
- **균일 카드 높이**: CSS Grid `auto-rows-[300px]`로 모든 위젯 카드 높이 고정, 내용 오버플로 시 개별 스크롤
- **환율 위젯**: Frankfurter API, 1 USD 기준 KRW·EUR·JPY·CNY, 갱신 시각 표시
- **국내 증시 위젯**: Next.js API Route `/api/market`을 통해 Yahoo Finance에 서버사이드 접근 (CORS 우회), 60초 캐시
- **메모 위젯**: Zustand persist 영속화 (키 `upharm_memos`), Enter 키 입력 지원, 최대 20개 보관, 개별 삭제
- **날씨 & 미세먼지 위젯**: Open-Meteo API, Geolocation API 위치 기반 (실패 시 서울 37.5665°N 기본값), PM2.5·PM10 등급 색상 표시
- **최근 수정 Top 5 위젯**: Notion `last_edited_time` Unix ms 기준 정렬, 상대 시간 표시 (방금 전·N분 전·N일 전)
- **많이 본 게시물 Top 5 위젯**: localStorage `upharm_view_counts`에서 열람 수 집계. Zustand 스토어 대신 localStorage 직접 접근인 이유: 열람 기록은 카테고리 카드가 기록하고 홈 위젯이 읽는 단방향 구조로, 공유 상태가 필요 없고 마운트 시 1회만 읽으면 충분하다.
- **홈 대시보드 뷰** (`HomeView`): 위젯 격자 레이아웃, 드래그앤드롭 핸들 표시
- **E2E 스모크 테스트** (Playwright): 홈 로딩, 사이드바 네비게이션, 검색 기능 정상 동작 확인

### Changed
- **다크모드**: `next-themes` `ThemeProvider` 적용, `class` 전략으로 Tailwind 다크모드 클래스 동작, SSR 시 `suppressHydrationWarning`으로 플래시 방지
- **검색**: Header 입력 → Dashboard 상태 → SectionView 필터 경로로 섹션·카테고리·문서명 전체 텍스트 실시간 필터링
- **GitHub Actions**: CI 파이프라인에 E2E job 추가 (build-and-test 완료 후 실행), deploy job 추가 (E2E 통과 후 master push 시에만 Vercel 배포)

### Fixed
- 드래그 비활성 상태에서 위젯 카드 테두리가 파란색으로 강조되는 버그 — `dragOverId === widget.id` 조건만 체크하면 드래그 중이지 않을 때도 강조가 표시됨. `draggingId !== null` 조건 추가로 수정.

---

## [0.1.0] — 2026-03-13

### 배경 및 의사결정

사내 Notion 지식베이스에 문서가 쌓여 있었지만, Notion UI에서 원하는 문서를 찾으려면 여러 페이지를 오가야 했고 외부 고객에게 링크를 공유할 때도 Notion 계정이 필요했다. 이 문제를 해결하기 위해 Notion 구조를 자동으로 읽어 카드 그리드로 변환하는 읽기 전용 포털을 구축했다.

**공식 Notion API 대신 `loadPageChunk`를 선택한 이유**: 공식 API는 `NOTION_TOKEN` 발급, integration 생성, 각 페이지 공유 설정이 필요한 반면, `loadPageChunk`는 공개 페이지라면 인증 없이 전체 블록 트리를 한 번의 POST 요청으로 가져올 수 있다. 환경 변수 관리가 불필요하여 fork 후 즉시 배포 가능하다. 스펙 변경에 대응하는 마이그레이션 경로는 `notion-structure.ts`와 `api/notion/[pageId]/route.ts` 교체로 제한되도록 설계했으며, CLAUDE.md에 단계별 가이드를 문서화했다.

**Server Component에서 구조를 fetch하는 이유**: 클라이언트에서 fetch하면 페이지가 먼저 렌더링된 뒤 데이터를 요청하는 waterfall이 발생한다. `page.tsx`를 Async Server Component로 작성하면 서버 렌더링 시 이미 데이터가 HTML에 포함되어 클라이언트에 전달되므로, 초기 화면 표시가 빠르고 클라이언트 번들 크기도 줄어든다.

### Added
- **프로젝트 초기 설정**: Next.js 16 (App Router), TypeScript strict (`any` 금지), Tailwind CSS v4, ESLint, Jest
- **Notion `loadPageChunk` 연동**: 섹션·카테고리·링크 3단계 계층 자동 파싱 (`notion-structure.ts`)
- **카드 그리드 UI**: 섹션별 색상 분류, 카테고리 카드 더 보기/접기 (기본 6개)
- **NotionModal**: paragraph, heading 1/2/3, bulleted/numbered list, callout, image, toggle, child_page 블록 렌더링; 모달 내 서브페이지 내비게이션 + 뒤로가기
- **실시간 검색**: 섹션·카테고리·문서명 전체 텍스트 클라이언트 필터링 (서버 요청 없음, 0ms 딜레이)
- **정적 폴백 데이터** (`knowledge-base.ts`): Notion API 오류 시 하드코딩된 샘플 데이터로 대체 — Notion 장애 시에도 포털 기본 기능 유지
- **열람 수 추적** (`view-tracker.ts`): 카드 클릭 시 localStorage에 페이지 ID별 열람 횟수 기록 — 외부 서버 불필요
- **Jest + React Testing Library**: 커버리지 90% 이상 강제 (`jest.config.ts` `coverageThreshold`)
- **GitHub Actions CI/CD**: push/PR 시 lint → type-check → test:coverage → build 자동 실행
