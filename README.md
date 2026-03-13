# 유팜 지원 포털

유팜시스템 고객 지원 지식베이스를 대시보드 스타일로 시각화하는 Next.js 앱입니다.
Notion 최상위 페이지에서 구조를 동적으로 읽어 카드로 표시하고, 클릭 시 Notion 내용을 모달로 렌더링합니다.

## 주요 기능

- **동적 구조 로딩** — `기술지원` Notion 페이지에서 섹션 → 카테고리 → 링크 계층을 자동으로 파싱
- **Notion 콘텐츠 모달** — 카드 클릭 시 페이지 내용 인라인 렌더링 (paragraph, heading, list, callout, image, toggle 등)
- **모달 내 페이지 내비게이션** — 중첩된 서브페이지 클릭 시 모달 내에서 이동, 뒤로가기 지원
- **더 보기 / 접기** — 링크가 많은 카테고리 카드는 6개만 미리보기 후 확장 가능
- **전체 텍스트 검색** — 섹션 / 카테고리 / 문서 이름으로 실시간 필터링
- **다크모드** — `next-themes` 기반 라이트 / 다크 토글
- **Notion API 무인증 접근** — 공개 페이지에 인증 없이 접근하는 `loadPageChunk` API 사용

## 기술 스택

| 항목 | 버전 |
|------|------|
| Next.js (App Router) | 16 |
| TypeScript | 5 |
| Tailwind CSS | v4 |
| next-themes | 최신 |
| lucide-react | 최신 |
| Jest + React Testing Library | 최신 |

## 시작하기

```bash
npm install
npm run dev        # http://localhost:3000
```

## 스크립트

```bash
npm run dev            # 개발 서버 실행
npm run build          # 프로덕션 빌드
npm test               # 테스트 실행
npm run test:coverage  # 커버리지 리포트 (90% 이상 유지)
npm run lint           # ESLint 검사
```

## 폴더 구조

```
src/
├── app/
│   ├── api/notion/[pageId]/route.ts   # Notion 블록 조회 API (인증 불필요)
│   ├── layout.tsx
│   └── page.tsx                       # Async Server Component — Notion에서 구조 로딩
├── components/
│   ├── CategoryCard.tsx               # 카테고리 카드 (더 보기 / 모달 연동)
│   ├── Dashboard.tsx                  # 상태 관리 루트 컴포넌트
│   ├── Header.tsx                     # 검색 + 다크모드 토글
│   ├── NotionModal.tsx                # 블록 렌더러 + 페이지 내비게이션
│   ├── SectionView.tsx                # 섹션 카드 그리드
│   └── Sidebar.tsx                    # 섹션 네비게이션
├── data/
│   └── knowledge-base.ts             # 타입 정의 + 정적 폴백 데이터 + 검색 유틸
└── lib/
    ├── notion-structure.ts            # Notion 계층 구조 동적 파싱
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

## 환경 변수

현재 Notion API 키는 사용하지 않습니다 (공개 페이지 직접 접근 방식 사용).

## 테스트

```bash
npm test                  # 전체 테스트
npm run test:coverage     # 커버리지 (전역 90% 이상 강제)
```

커버리지 기준 미달 시 빌드가 실패합니다 (`jest.config.ts` 참고).
