/**
 * 루트 페이지 (Async Server Component)
 * Notion 기술지원 페이지에서 지식베이스 구조를 서버사이드에서 가져와 Dashboard에 전달한다.
 * 조회 실패(빈 배열) 시 knowledge-base.ts 정적 데이터로 폴백하여 기본 UI를 보장한다.
 * 클라이언트에서 useKnowledgeStructure 훅이 추가로 백그라운드 갱신 + localStorage 캐싱을 담당한다.
 */

import { Dashboard } from "@/components/Dashboard";
import { fetchKnowledgeStructure } from "@/lib/notion-structure";
import { knowledgeSections } from "@/data/knowledge-base";

export default async function HomePage() {
  // Notion에서 동적으로 구조를 가져온다
  const dynamicSections = await fetchKnowledgeStructure();

  // 조회 실패(빈 배열) 시 정적 데이터로 폴백 — 사이드바·섹션 탐색은 항상 동작
  const sections =
    dynamicSections.length > 0 ? dynamicSections : knowledgeSections;

  return <Dashboard initialSections={sections} />;
}
