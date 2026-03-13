/**
 * Jest 설정
 * Next.js 내장 jest 설정을 기반으로 TypeScript와 path alias를 지원한다.
 */

import type { Config } from "jest";
import nextJest from "next/jest.js";

// Next.js 앱 루트를 기반으로 Jest 기본 설정 생성
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",

  // 테스트 실행 전 jest-dom 매처를 전역으로 등록
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // @ 경로 alias를 실제 경로로 매핑
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // 커버리지 수집 대상 파일
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/layout.tsx",
    "!src/app/page.tsx",
  ],

  // 90% 이상 커버리지 강제
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
    },
  },
};

export default createJestConfig(config);
