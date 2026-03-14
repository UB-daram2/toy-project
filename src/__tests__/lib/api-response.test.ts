/**
 * api-response 유틸리티 테스트
 * CACHE 상수, HTTP_STATUS 상수, errorBody 헬퍼의 값과 타입을 검증한다.
 */

import { CACHE, HTTP_STATUS, errorBody } from "@/lib/api-response";

describe("CACHE 상수", () => {
  it("SHORT는 60초 s-maxage를 포함한다", () => {
    expect(CACHE.SHORT).toContain("s-maxage=60");
  });

  it("MEDIUM은 300초 s-maxage를 포함한다", () => {
    expect(CACHE.MEDIUM).toContain("s-maxage=300");
  });

  it("두 값이 서로 다르다", () => {
    expect(CACHE.SHORT).not.toBe(CACHE.MEDIUM);
  });
});

describe("HTTP_STATUS 상수", () => {
  it("OK는 200이다", () => {
    expect(HTTP_STATUS.OK).toBe(200);
  });

  it("BAD_REQUEST는 400이다", () => {
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
  });

  it("NOT_FOUND는 404이다", () => {
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
  });

  it("INTERNAL_SERVER_ERROR는 500이다", () => {
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });

  it("BAD_GATEWAY는 502이다", () => {
    expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
  });
});

describe("errorBody", () => {
  it("{ error: message } 형태를 반환한다", () => {
    expect(errorBody("테스트 오류")).toEqual({ error: "테스트 오류" });
  });

  it("빈 문자열도 처리한다", () => {
    expect(errorBody("")).toEqual({ error: "" });
  });

  it("반환 객체에 error 키만 존재한다", () => {
    const result = errorBody("msg");
    expect(Object.keys(result)).toEqual(["error"]);
  });
});
