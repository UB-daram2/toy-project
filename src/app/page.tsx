/**
 * 루트 페이지 (Async Server Component)
 * Notion 기술지원 페이지에서 지식베이스 구조를 동적으로 가져와 Dashboard에 전달한다.
 * 조회 실패 시 knowledge-base.ts 정적 데이터로 폴백한다.
 */

import { Dashboard } from "@/components/Dashboard";
import { fetchKnowledgeStructure } from "@/lib/notion-structure";
import { knowledgeSections } from "@/data/knowledge-base";

export default async function HomePage() {
  // Notion에서 동적으로 구조를 가져온다
  const dynamicSections = await fetchKnowledgeStructure();

  // 조회 실패(빈 배열) 시 정적 데이터로 폴백
  const sections =
    dynamicSections.length > 0 ? dynamicSections : knowledgeSections;

  return <Dashboard sections={sections} />;
}
