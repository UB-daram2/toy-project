/**
 * 반응형 레이아웃 E2E 테스트
 * 모바일(375×667), 태블릿(768×1024), 데스크톱(1280×800) 뷰포트에서
 * 핵심 UI 요소의 표시 여부와 레이아웃을 검증한다.
 *
 * Tailwind 브레이크포인트: md = 768px
 * - < 768px: aside.hidden → display:none (모바일 사이드바 숨김)
 * - ≥ 768px: aside.md:flex → display:flex (사이드바 표시)
 */

import { test, expect } from "@playwright/test";

test.describe("반응형 — 모바일(375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("홈 대시보드가 정상 로드된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /홈/ })).toBeVisible();
  });

  test("검색 인풋이 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByPlaceholder("처리방법, 카테고리, 문서 이름 검색...")
    ).toBeVisible();
  });

  test("데스크톱 사이드바가 숨겨진다", async ({ page }) => {
    await page.goto("/");
    // Tailwind hidden md:flex → 375px에서 aside는 display:none
    await expect(page.locator("aside").first()).not.toBeVisible();
  });
});

test.describe("반응형 — 태블릿(768px)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("홈 대시보드가 정상 로드된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /홈/ })).toBeVisible();
  });

  test("768px 이상에서 데스크톱 사이드바가 표시된다", async ({ page }) => {
    await page.goto("/");
    // Tailwind md:flex → 768px에서 aside는 display:flex
    await expect(page.locator("aside").first()).toBeVisible();
  });

  test("검색 인풋이 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByPlaceholder("처리방법, 카테고리, 문서 이름 검색...")
    ).toBeVisible();
  });
});

test.describe("반응형 — 데스크톱(1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("홈 대시보드가 정상 로드된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /홈/ })).toBeVisible();
  });

  test("데스크톱에서 사이드바가 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("aside").first()).toBeVisible();
  });

  test("섹션 네비게이션이 동작한다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /처리방법이 궁금해요/ }).click();
    await expect(
      page.getByRole("heading", { name: /처리방법이 궁금해요/ })
    ).toBeVisible();
  });
});
