/**
 * 섹션 뷰 · 모달 E2E 테스트
 * 카테고리 카드 링크 클릭으로 NotionModal이 열리고 정상적으로 닫히는 흐름을 검증한다.
 * 폴백 데이터(knowledge-base.ts)에 "처방조제" 링크가 정의되어 있으므로
 * Notion API 가용 여부와 무관하게 링크 버튼이 항상 표시된다.
 */

import { test, expect } from "@playwright/test";

test.describe("섹션 뷰 — 카테고리 카드", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // "처리방법이 궁금해요" 섹션으로 이동
    await page.getByRole("button", { name: /처리방법이 궁금해요/ }).click();
    await expect(
      page.getByRole("heading", { name: /처리방법이 궁금해요/ })
    ).toBeVisible();
  });

  test("카드 링크 클릭 시 NotionModal이 열린다", async ({ page }) => {
    // "처방조제" 링크 버튼 클릭 → 모달 오픈
    await page.getByRole("button", { name: "처방조제" }).click();
    // role="dialog" 요소가 나타나야 한다
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  });

  test("모달 닫기(X) 버튼 클릭 시 모달이 닫힌다", async ({ page }) => {
    await page.getByRole("button", { name: "처방조제" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    // 닫기 버튼 클릭
    await page.getByLabel("닫기").click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("ESC 키 입력 시 모달이 닫힌다", async ({ page }) => {
    await page.getByRole("button", { name: "처방조제" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});

test.describe("섹션 뷰 — 외부 링크 아이콘", () => {
  test("Notion에서 열기 링크가 올바른 Notion URL을 가진다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /처리방법이 궁금해요/ }).click();
    // 처방조제 행에서 외부 링크 아이콘의 href가 notion.so 도메인인지 확인
    const externalLink = page.getByLabel("처방조제 Notion에서 열기");
    await expect(externalLink).toHaveAttribute("href", /notion\.so/);
  });
});
