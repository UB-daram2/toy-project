/**
 * E2E 스모크 테스트
 * 배포된 앱의 핵심 기능(홈 로딩, 사이드바 내비게이션, 검색)을 검증한다.
 */

import { test, expect } from "@playwright/test";

test.describe("스모크 테스트 — 앱 로딩", () => {
  test("홈 대시보드가 정상 로드된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /유팜 기술지원 포털/ })).toBeVisible();
  });

  test("사이드바에 세 개의 섹션 버튼이 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /처리방법이 궁금해요/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /사용방법이 궁금해요/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /파일이 필요해요/ })
    ).toBeVisible();
  });

  test("홈 위젯 세 개가 모두 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("최근 수정 Top 5")).toBeVisible();
    await expect(page.getByText("많이 본 게시물 Top 5")).toBeVisible();
    await expect(page.getByText("날씨 & 미세먼지")).toBeVisible();
  });
});

test.describe("스모크 테스트 — 내비게이션", () => {
  test("섹션 버튼 클릭 시 해당 섹션 콘텐츠로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /처리방법이 궁금해요/ }).click();
    await expect(
      page.getByRole("heading", { name: /처리방법이 궁금해요/ })
    ).toBeVisible();
  });

  test("홈 버튼 클릭 시 홈 뷰로 돌아온다", async ({ page }) => {
    await page.goto("/");
    // 섹션으로 이동 후 홈 버튼 클릭
    await page.getByRole("button", { name: /처리방법이 궁금해요/ }).click();
    await page.getByRole("button", { name: /홈/ }).click();
    await expect(page.getByRole("heading", { name: /유팜 기술지원 포털/ })).toBeVisible();
  });
});

test.describe("스모크 테스트 — 검색", () => {
  test("검색어 입력 시 결과가 표시된다", async ({ page }) => {
    await page.goto("/");
    await page
      .getByPlaceholder("처리방법, 카테고리, 문서 이름 검색...")
      .fill("처방");
    // 검색 결과 레이블이 나타난다
    await expect(page.getByText("(검색 결과)")).toBeVisible();
  });

  test("존재하지 않는 검색어는 결과 없음 메시지를 표시한다", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByPlaceholder("처리방법, 카테고리, 문서 이름 검색...")
      .fill("xyz_존재하지_않는_검색어_abc");
    await expect(page.getByText("검색 결과 없음")).toBeVisible();
  });
});
