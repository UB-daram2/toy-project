/**
 * 유팜시스템 지원 포털 지식베이스 데이터
 * 세 가지 메인 섹션(처리방법 / 사용방법 / 파일필요)과 각 카테고리 링크를 정의한다.
 */

/** 개별 Notion 문서 링크 */
export interface KnowledgeLink {
  id: string;
  title: string;
  url: string;
  /** Notion 블록의 마지막 수정 시각 (Unix ms). 동적 로딩 시 채워진다 */
  lastEditedTime?: number;
}

/** 카테고리 그룹 (예: 유팜시스템, VAN Plus) */
export interface KnowledgeCategory {
  id: string;
  title: string;
  links: KnowledgeLink[];
}

/** 메인 섹션 (처리방법 / 사용방법 / 파일필요) */
export interface KnowledgeSection {
  id: string;
  title: string;
  description: string;
  /** Lucide 아이콘 이름 */
  icon: string;
  /** Tailwind 색상 키 (accent 용도) */
  colorKey: "blue" | "violet" | "emerald";
  categories: KnowledgeCategory[];
}

/** 전체 지식베이스 데이터 */
export const knowledgeSections: KnowledgeSection[] = [
  {
    id: "how-to-process",
    title: "처리방법이 궁금해요",
    description: "유팜시스템 기능별 처리 방법 안내",
    icon: "BookOpen",
    colorKey: "blue",
    categories: [
      {
        id: "prescription-dispensing",
        title: "처방조제",
        links: [{ id: "prescription-dispensing-link", title: "처방조제", url: "https://www.notion.so/87e1f915cdf083ca827e812ef3a5a3e0" }],
      },
      {
        id: "prescription-check",
        title: "처방점검",
        links: [{ id: "prescription-check-link", title: "처방점검", url: "https://www.notion.so/0051f915cdf083c1aa73810085450e09" }],
      },
      {
        id: "insurance-claim",
        title: "보험청구",
        links: [{ id: "insurance-claim-link", title: "보험청구", url: "https://www.notion.so/1ce1f915cdf0826db8978162a514694a" }],
      },
      {
        id: "simple-sales",
        title: "단순판매",
        links: [{ id: "simple-sales-link", title: "단순판매", url: "https://www.notion.so/0761f915cdf083a0857901c91a13813a" }],
      },
      {
        id: "consulting-statistics",
        title: "컨설팅통계",
        links: [{ id: "consulting-statistics-link", title: "컨설팅통계", url: "https://www.notion.so/da01f915cdf082758d4b819eeb7d4c02" }],
      },
      {
        id: "inventory-management",
        title: "재고관리",
        links: [{ id: "inventory-management-link", title: "재고관리", url: "https://www.notion.so/1611f915cdf08320919b013cbd77036a" }],
      },
      {
        id: "customer-management",
        title: "고객관리",
        links: [{ id: "customer-management-link", title: "고객관리", url: "https://www.notion.so/d0f1f915cdf082e7bc50014abebf37ff" }],
      },
      {
        id: "medication-counseling",
        title: "복약지도실",
        links: [{ id: "medication-counseling-link", title: "복약지도실", url: "https://www.notion.so/1691f915cdf0822aa7d901d55320d5ce" }],
      },
      {
        id: "payment",
        title: "수납",
        links: [{ id: "payment-link", title: "수납", url: "https://www.notion.so/6cc1f915cdf0832ea4a9811ed97f5b43" }],
      },
      {
        id: "diabetes-support",
        title: "당뇨 소모성 재료요양비 지원",
        links: [{ id: "diabetes-support-link", title: "당뇨 소모성 재료요양비 지원", url: "https://www.notion.so/d611f915cdf0839bb9d481fc48f7ad89" }],
      },
      {
        id: "narcotics-system",
        title: "마약류통합관리시스템",
        links: [{ id: "narcotics-system-link", title: "마약류통합관리시스템", url: "https://www.notion.so/59d1f915cdf0821dbdd301d8d6dafd89" }],
      },
      {
        id: "auto-purchase",
        title: "자동사입(3초입고)",
        links: [{ id: "auto-purchase-link", title: "자동사입(3초입고)", url: "https://www.notion.so/3-f911f915cdf0833ea1a681d2e71c974f" }],
      },
      {
        id: "printer",
        title: "프린터",
        links: [{ id: "printer-link", title: "프린터", url: "https://www.notion.so/00e1f915cdf083128e648142a60a7dc3" }],
      },
      {
        id: "label",
        title: "라벨",
        links: [{ id: "label-link", title: "라벨", url: "https://www.notion.so/21c1f915cdf08371bfa6016e51440dbf" }],
      },
      {
        id: "settings",
        title: "환경설정",
        links: [{ id: "settings-link", title: "환경설정", url: "https://www.notion.so/e5b1f915cdf0824ca20901eb9ae04e7e" }],
      },
      {
        id: "update",
        title: "업데이트",
        links: [{ id: "update-link", title: "업데이트", url: "https://www.notion.so/c291f915cdf082cd963001c3f4ef9ff5" }],
      },
      {
        id: "database",
        title: "DB",
        links: [{ id: "database-link", title: "DB", url: "https://www.notion.so/DB-eca1f915cdf082918fc70105a19bc644" }],
      },
      {
        id: "content-management",
        title: "컨텐츠관리",
        links: [{ id: "content-management-link", title: "컨텐츠관리", url: "https://www.notion.so/4751f915cdf082afb437010736e199c2" }],
      },
      {
        id: "barcode-2d",
        title: "2D바코드 관련",
        links: [{ id: "barcode-2d-link", title: "2D바코드 관련", url: "https://www.notion.so/2D-2411f915cdf083ea9af6815b7ad2cc08" }],
      },
      {
        id: "scanner",
        title: "스캐너(Scanner)",
        links: [{ id: "scanner-link", title: "스캐너(Scanner)", url: "https://www.notion.so/Scanner-05e1f915cdf08391ae420137a53c8bda" }],
      },
      {
        id: "medicine-management",
        title: "약품관리",
        links: [{ id: "medicine-management-link", title: "약품관리", url: "https://www.notion.so/a2c1f915cdf083cc857c812ff889da57" }],
      },
      {
        id: "firewall-sub-pc",
        title: "방화벽 설정 후 보조PC 사용방법",
        links: [{ id: "firewall-sub-pc-link", title: "방화벽 설정 후 보조PC 사용방법", url: "https://www.notion.so/PC-test-af41f915cdf082f2bfaf010d989f88b0" }],
      },
      {
        id: "van-plus-process",
        title: "VAN Plus",
        links: [{ id: "van-plus-process-link", title: "VAN Plus", url: "https://www.notion.so/VAN-Plus-fbe1f915cdf0838bb5ad016165c5c443" }],
      },
      {
        id: "upharm-pos-process",
        title: "유팜포스",
        links: [{ id: "upharm-pos-process-link", title: "유팜포스", url: "https://www.notion.so/3ce1f915cdf0823194b701430a3c1cbb" }],
      },
      {
        id: "general-terminal",
        title: "일반 단말기(밴)",
        links: [{ id: "general-terminal-link", title: "일반 단말기(밴)", url: "https://www.notion.so/0f21f915cdf0838bbf298146c9d2507c" }],
      },
      {
        id: "sql-query",
        title: "쿼리문",
        links: [{ id: "sql-query-link", title: "쿼리문", url: "https://www.notion.so/78c1f915cdf08391b8b601c99f1e9707" }],
      },
      {
        id: "conversion-methods",
        title: "컨버전 처리 방법 모음",
        links: [{ id: "conversion-methods-link", title: "컨버전 처리 방법 모음", url: "https://www.notion.so/4ca1f915cdf082a284eb01a835e436d5" }],
      },
      {
        id: "process-other",
        title: "기타",
        links: [{ id: "process-other-link", title: "기타", url: "https://www.notion.so/65c1f915cdf08358ba94016d15dd09f6" }],
      },
    ],
  },
  {
    id: "how-to-use",
    title: "사용방법이 궁금해요",
    description: "제품별 사용방법 가이드",
    icon: "HelpCircle",
    colorKey: "violet",
    categories: [
      {
        id: "upharm-system-usage",
        title: "유팜시스템",
        links: [
          {
            id: "upharm-system-usage-link",
            title: "유팜시스템",
            url: "https://www.notion.so/2fb1f915cdf082f5849881436325a518",
          },
        ],
      },
      {
        id: "van-plus-usage",
        title: "VAN Plus",
        links: [
          {
            id: "van-plus-usage-link",
            title: "VAN Plus",
            url: "https://www.notion.so/VAN-Plus-04a1f915cdf0835593c201d4ff93e957",
          },
        ],
      },
      {
        id: "upharm-pos-usage",
        title: "유팜포스",
        links: [
          {
            id: "upharm-pos-usage-link",
            title: "유팜포스",
            url: "https://www.notion.so/67c1f915cdf0821f982e811290039c13",
          },
        ],
      },
      {
        id: "barcode-2d-usage",
        title: "2D바코드",
        links: [
          {
            id: "barcode-2d-usage-link",
            title: "2D바코드",
            url: "https://www.notion.so/2D-db01f915cdf083e39f918161403780f4",
          },
        ],
      },
      {
        id: "sql-server-usage",
        title: "SQL Server 관련",
        links: [
          {
            id: "sql-server-usage-link",
            title: "SQL Server 관련",
            url: "https://www.notion.so/SQL-Server-4161f915cdf0833e9375018e51482303",
          },
        ],
      },
      {
        id: "medical-expense-deduction",
        title: "의료비소득공제",
        links: [
          {
            id: "medical-expense-link",
            title: "의료비소득공제",
            url: "https://www.notion.so/39f1f915cdf0837e8dee013ca4424906",
          },
        ],
      },
      {
        id: "vat-filing",
        title: "부가가치세 신고 관련",
        links: [
          {
            id: "vat-filing-link",
            title: "부가가치세 신고 관련",
            url: "https://www.notion.so/9a31f915cdf08342b73c818ad578b685",
          },
        ],
      },
      {
        id: "usage-other",
        title: "기타",
        links: [
          {
            id: "usage-other-link",
            title: "기타",
            url: "https://www.notion.so/2b81f915cdf082f9872481892996ce90",
          },
        ],
      },
    ],
  },
  {
    id: "files",
    title: "파일이 필요해요",
    description: "제품별 설치 파일 및 관련 자료 다운로드",
    icon: "Download",
    colorKey: "emerald",
    categories: [
      {
        id: "upharm-system-files",
        title: "유팜시스템 관련",
        links: [
          {
            id: "upharm-system-files-link",
            title: "유팜시스템 관련",
            url: "https://www.notion.so/6f51f915cdf083f6839d01dd4cec053e",
          },
        ],
      },
      {
        id: "van-plus-files",
        title: "VAN Plus 관련",
        links: [
          {
            id: "van-plus-files-link",
            title: "VAN Plus 관련",
            url: "https://www.notion.so/VAN-Plus-0a91f915cdf0827aaafd81ba72b3c05c",
          },
        ],
      },
      {
        id: "upharm-pos-files",
        title: "유팜포스 관련",
        links: [
          {
            id: "upharm-pos-files-link",
            title: "유팜포스 관련",
            url: "https://www.notion.so/c4e1f915cdf0831d94c801e3673a32a3",
          },
        ],
      },
      {
        id: "barcode-2d-files",
        title: "2D바코드 관련",
        links: [
          {
            id: "barcode-2d-files-link",
            title: "2D바코드 관련",
            url: "https://www.notion.so/2D-7c21f915cdf08274b7d8011b19ca56e8",
          },
        ],
      },
      {
        id: "conversion-tool-files",
        title: "컨버전 툴 관련",
        links: [
          {
            id: "conversion-tool-files-link",
            title: "컨버전 툴 관련",
            url: "https://www.notion.so/80d1f915cdf0830e8b1b8175211d47ca",
          },
        ],
      },
      {
        id: "sql-server-files",
        title: "SQL Server 관련",
        links: [
          {
            id: "sql-server-files-link",
            title: "SQL Server 관련",
            url: "https://www.notion.so/SQL-Server-b231f915cdf0837e9d1c01dd6060955e",
          },
        ],
      },
      {
        id: "label-printer-files",
        title: "라벨 프린터 관련",
        links: [
          {
            id: "label-printer-files-link",
            title: "라벨 프린터 관련",
            url: "https://www.notion.so/8211f915cdf082dfa207811b6b10ad45",
          },
        ],
      },
      {
        id: "integrated-tool-files",
        title: "통합 툴 관련",
        links: [
          {
            id: "integrated-tool-files-link",
            title: "통합 툴 관련",
            url: "https://www.notion.so/5611f915cdf083c4a22c81c0aa732f64",
          },
        ],
      },
      {
        id: "scanner-files",
        title: "스캐너(Scanner)",
        links: [
          {
            id: "scanner-files-link",
            title: "스캐너(Scanner)",
            url: "https://www.notion.so/Scanner-0251f915cdf082f9aa3501d0e1a75e5c",
          },
        ],
      },
      {
        id: "individual-files",
        title: "개별파일",
        links: [
          {
            id: "individual-files-link",
            title: "개별파일",
            url: "https://www.notion.so/49f1f915cdf0824b9b1c818f1f35a333",
          },
        ],
      },
      {
        id: "files-other",
        title: "기타",
        links: [
          {
            id: "files-other-link",
            title: "기타",
            url: "https://www.notion.so/30e1f915cdf0838ab55701791a7c7bcb",
          },
        ],
      },
    ],
  },
];

/**
 * 전체 링크 수를 계산한다.
 * 섹션 > 카테고리 > 링크를 순회하여 합산한다.
 */
export function countTotalLinks(sections: KnowledgeSection[]): number {
  return sections.reduce((sectionTotal, section) => {
    const sectionLinkCount = section.categories.reduce(
      (categoryTotal, category) => categoryTotal + category.links.length,
      0
    );
    return sectionTotal + sectionLinkCount;
  }, 0);
}

/**
 * 검색어로 전체 데이터를 필터링한다.
 * 섹션 제목, 카테고리 제목, 링크 제목을 대소문자 구분 없이 검색한다.
 */
export function searchKnowledge(
  sections: KnowledgeSection[],
  query: string
): KnowledgeSection[] {
  // 빈 검색어이면 전체 반환
  if (!query.trim()) return sections;

  const normalizedQuery = query.toLowerCase();

  return sections
    .map((section) => {
      // 카테고리 내 링크를 검색어로 필터링
      const matchedCategories = section.categories
        .map((category) => {
          const matchedLinks = category.links.filter(
            (link) =>
              link.title.toLowerCase().includes(normalizedQuery) ||
              category.title.toLowerCase().includes(normalizedQuery) ||
              section.title.toLowerCase().includes(normalizedQuery)
          );
          return matchedLinks.length > 0
            ? { ...category, links: matchedLinks }
            : null;
        })
        .filter((category): category is KnowledgeCategory => category !== null);

      return matchedCategories.length > 0
        ? { ...section, categories: matchedCategories }
        : null;
    })
    .filter((section): section is KnowledgeSection => section !== null);
}
