/**
 * 위젯 상호작용 E2E 테스트
 * 홈 뷰의 핵심 위젯(계산기·메모·투두·포모도로)과 다크모드 토글, 드래그 핸들을 검증한다.
 * 각 test는 독립된 browser context(빈 localStorage)로 실행된다.
 */

import { test, expect } from "@playwright/test";

// ── 계산기 위젯 ──────────────────────────────────────────────────────────────

test.describe("계산기 위젯", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("숫자 버튼 연속 클릭 시 다자릿수가 디스플레이에 표시된다", async ({ page }) => {
    // 7 → 3 순서로 클릭하면 디스플레이가 "73"을 표시해야 한다
    await page.getByRole("button", { name: "7" }).click();
    await page.getByRole("button", { name: "3" }).click();
    // "73"은 버튼에 없는 조합이므로 디스플레이에만 표시된다
    await expect(page.getByText("73")).toBeVisible();
  });

  test("사칙연산 결과가 올바르게 계산된다", async ({ page }) => {
    // 6 × 3 = 18 (18은 버튼에 없는 값이므로 디스플레이 고유 텍스트)
    await page.getByRole("button", { name: "6" }).click();
    await page.getByRole("button", { name: "×" }).click();
    await page.getByRole("button", { name: "3" }).click();
    await page.getByRole("button", { name: "=" }).click();
    await expect(page.getByText("18")).toBeVisible();
  });

  test("C 버튼 클릭 시 디스플레이가 초기화된다", async ({ page }) => {
    // 73 입력 후 C 클릭 → "73"이 사라진다
    await page.getByRole("button", { name: "7" }).click();
    await page.getByRole("button", { name: "3" }).click();
    await expect(page.getByText("73")).toBeVisible();
    await page.getByRole("button", { name: "C" }).click();
    await expect(page.getByText("73")).not.toBeVisible();
  });
});

// ── 메모 위젯 ────────────────────────────────────────────────────────────────

test.describe("메모 위젯", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("메모를 입력하고 추가하면 목록에 표시된다", async ({ page }) => {
    await page.getByPlaceholder("메모를 입력하세요...").fill("E2E 테스트 메모");
    await page.getByLabel("메모 추가").click();
    await expect(page.getByText("E2E 테스트 메모")).toBeVisible();
  });

  test("Enter 키로도 메모를 추가할 수 있다", async ({ page }) => {
    await page.getByPlaceholder("메모를 입력하세요...").fill("Enter 키 추가 테스트");
    await page.getByPlaceholder("메모를 입력하세요...").press("Enter");
    await expect(page.getByText("Enter 키 추가 테스트")).toBeVisible();
  });

  test("삭제 버튼 클릭 시 해당 메모가 목록에서 제거된다", async ({ page }) => {
    await page.getByPlaceholder("메모를 입력하세요...").fill("삭제할 메모");
    await page.getByLabel("메모 추가").click();
    await expect(page.getByText("삭제할 메모")).toBeVisible();
    await page.getByLabel("메모 삭제").click();
    await expect(page.getByText("삭제할 메모")).not.toBeVisible();
  });
});

// ── 투두 위젯 ────────────────────────────────────────────────────────────────

test.describe("투두 위젯", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("할 일을 입력하고 추가하면 목록에 표시된다", async ({ page }) => {
    await page.getByPlaceholder("할 일을 입력하세요...").fill("E2E 할 일 테스트");
    await page.getByLabel("투두 추가").click();
    await expect(page.getByText("E2E 할 일 테스트")).toBeVisible();
  });

  test("완료 표시 클릭 시 버튼 레이블이 '완료 취소'로 변경된다", async ({ page }) => {
    await page.getByPlaceholder("할 일을 입력하세요...").fill("완료 토글 테스트");
    await page.getByLabel("투두 추가").click();
    // 초기 상태: "완료 표시" 버튼
    await page.getByLabel("완료 표시").click();
    // 완료 상태: 버튼 레이블이 "완료 취소"로 전환
    await expect(page.getByLabel("완료 취소")).toBeVisible();
  });

  test("삭제 클릭 시 항목이 목록에서 제거된다", async ({ page }) => {
    await page.getByPlaceholder("할 일을 입력하세요...").fill("삭제 테스트 항목");
    await page.getByLabel("투두 추가").click();
    await expect(page.getByText("삭제 테스트 항목")).toBeVisible();
    await page.getByLabel("삭제").click();
    await expect(page.getByText("삭제 테스트 항목")).not.toBeVisible();
  });
});

// ── 포모도로 타이머 위젯 ──────────────────────────────────────────────────────

test.describe("포모도로 타이머 위젯", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("시작 버튼 클릭 시 일시정지 버튼으로 전환된다", async ({ page }) => {
    await expect(page.getByRole("button", { name: "시작" })).toBeVisible();
    await page.getByRole("button", { name: "시작" }).click();
    await expect(page.getByRole("button", { name: "일시정지" })).toBeVisible();
  });

  test("일시정지 버튼 클릭 시 시작 버튼으로 복귀된다", async ({ page }) => {
    await page.getByRole("button", { name: "시작" }).click();
    await page.getByRole("button", { name: "일시정지" }).click();
    await expect(page.getByRole("button", { name: "시작" })).toBeVisible();
  });

  test("휴식 5분 탭 클릭 시 타이머 모드 레이블이 '휴식'으로 변경된다", async ({ page }) => {
    // 기본 집중 모드
    await expect(page.getByText("집중")).toBeVisible();
    // 휴식 모드로 전환
    await page.getByRole("button", { name: "휴식 5분" }).click();
    await expect(page.getByText("휴식")).toBeVisible();
  });
});

// ── 다크모드 토글 ────────────────────────────────────────────────────────────

test.describe("다크모드 토글", () => {
  test("테마 전환 버튼 클릭 시 html 요소에 dark 클래스가 추가된다", async ({ page }) => {
    await page.goto("/");
    // 데스크톱 뷰포트에서는 aria-label="테마 전환" 버튼이 표시된다
    await page.getByLabel("테마 전환").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("다크모드에서 재클릭 시 라이트모드로 전환된다", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("테마 전환").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByLabel("테마 전환").click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

// ── 드래그 핸들 ──────────────────────────────────────────────────────────────

test.describe("위젯 드래그 핸들", () => {
  test("홈 뷰에 14개 위젯의 드래그 핸들이 DOM에 존재한다", async ({ page }) => {
    await page.goto("/");
    const handles = page.getByLabel("위젯 이동 핸들");
    // opacity-0이지만 DOM에 존재해야 드래그앤드롭이 동작한다
    await expect(handles.first()).toBeAttached();
    const count = await handles.count();
    expect(count).toBe(14);
  });
});
