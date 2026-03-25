/**
 * 루트 페이지
 * Dashboard가 마운트 시 직접 /api/knowledge-structure 에서 데이터를 가져온다.
 */

import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  return <Dashboard />;
}
