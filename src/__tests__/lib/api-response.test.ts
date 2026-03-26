/**
 * api-response 유틸리티 테스트
 * CACHE 프리셋, HTTP_STATUS 상수, errorBody 헬퍼를 검증한다.
 */

import { CACHE, HTTP_STATUS, errorBody } from "@/lib/api-response";

describe("api-response", () => {
  /** CACHE 프리셋이 SHORT·MEDIUM 키를 가지며 각각 올바른 s-maxage를 포함한다 */
  it("CACHE 프리셋이 기대하는 키와 s-maxage 값을 갖는다", () => {
    expect(CACHE.SHORT).toContain("s-maxage=60");
    expect(CACHE.MEDIUM).toContain("s-maxage=300");
    expect(CACHE.SHORT).not.toBe(CACHE.MEDIUM);
  });

  /** HTTP_STATUS가 모든 상태 코드 키를 올바른 숫자값으로 갖는다 */
  it("HTTP_STATUS가 기대하는 상태 코드를 갖는다", () => {
    expect(HTTP_STATUS).toEqual({
      OK: 200,
      BAD_REQUEST: 400,
      NOT_FOUND: 404,
      INTERNAL_SERVER_ERROR: 500,
      BAD_GATEWAY: 502,
    });
  });

  /** errorBody가 { error: message } 형태만 반환한다 */
  it("errorBody가 올바른 에러 객체를 반환한다", () => {
    expect(errorBody("테스트 오류")).toEqual({ error: "테스트 오류" });
    expect(errorBody("")).toEqual({ error: "" });
    expect(Object.keys(errorBody("msg"))).toEqual(["error"]);
  });
});
