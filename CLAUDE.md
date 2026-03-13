# 유팜시스템 지원 포털 대시보드

## 프로젝트 개요
유팜시스템 고객 지원 지식베이스를 트렌디한 대시보드 스타일로 시각화하는 Next.js 16 앱.
처리방법 / 사용방법 / 파일다운로드 세 섹션을 탐색하고 검색할 수 있다.

## 기술 스택
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- next-themes (다크모드)
- lucide-react (아이콘)
- Jest + React Testing Library (테스트)

## 빌드 & 테스트
- 개발 서버: `npm run dev`
- 빌드: `npm run build`
- 테스트: `npm test`
- 테스트 커버리지: `npm run test:coverage`
- 린트: `npm run lint`

## 작성 규칙
- 실제 동작하는 코드만 작성 (미구현 stub 금지)
- 테스트 커버리지 90% 이상 유지
- 기능을 명확히 나타내는 이름 사용 (약어/모호한 이름 금지)
- 로직 블록마다 반드시 주석 작성

## 폴더 구조
- `src/app/` — App Router 페이지 및 레이아웃
- `src/components/` — 재사용 가능한 UI 컴포넌트
- `src/data/` — 정적 지식베이스 데이터
- `src/lib/` — 유틸리티 함수
- `src/__tests__/` — Jest 테스트 파일

## 코드 스타일
- 2칸 들여쓰기
- ES modules (import/export)
- TypeScript strict mode
- 컴포넌트 파일명: PascalCase
- 유틸리티 파일명: camelCase
