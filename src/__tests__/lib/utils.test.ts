/**
 * utils.ts 유틸리티 함수 테스트
 */

import { cn, getSectionColorClasses } from "@/lib/utils";

describe("cn (클래스명 조합)", () => {
  it("단일 클래스를 그대로 반환한다", () => {
    expect(cn("text-blue-500")).toBe("text-blue-500");
  });

  it("여러 클래스를 공백으로 합쳐서 반환한다", () => {
    expect(cn("text-blue-500", "bg-zinc-900")).toBe("text-blue-500 bg-zinc-900");
  });

  it("falsy 값(undefined, null, false)을 제거한다", () => {
    expect(cn("text-blue-500", undefined, null, false, "bg-zinc-900")).toBe(
      "text-blue-500 bg-zinc-900"
    );
  });

  it("모두 falsy이면 빈 문자열을 반환한다", () => {
    expect(cn(undefined, null, false)).toBe("");
  });
});

describe("getSectionColorClasses (섹션 색상 클래스)", () => {
  it("blue 키에 대해 blue 계열 클래스를 반환한다", () => {
    const classes = getSectionColorClasses("blue");
    expect(classes.text).toContain("blue");
    expect(classes.badge).toContain("blue");
    expect(classes.accent).toContain("blue");
    expect(classes.hover).toContain("blue");
    expect(classes.border).toContain("blue");
  });

  it("violet 키에 대해 violet 계열 클래스를 반환한다", () => {
    const classes = getSectionColorClasses("violet");
    expect(classes.text).toContain("violet");
    expect(classes.badge).toContain("violet");
  });

  it("emerald 키에 대해 emerald 계열 클래스를 반환한다", () => {
    const classes = getSectionColorClasses("emerald");
    expect(classes.text).toContain("emerald");
    expect(classes.badge).toContain("emerald");
  });

  it("반환 객체에 badge, accent, hover, border, text 키가 모두 있다", () => {
    const classes = getSectionColorClasses("blue");
    expect(classes).toHaveProperty("badge");
    expect(classes).toHaveProperty("accent");
    expect(classes).toHaveProperty("hover");
    expect(classes).toHaveProperty("border");
    expect(classes).toHaveProperty("text");
  });
});
