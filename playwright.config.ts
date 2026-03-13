/**
 * Playwright E2E 테스트 설정
 * CI에서는 빌드된 앱을 기준으로, 로컬에서는 dev 서버를 자동 시작한다.
 */

import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // CI에서만 실패 시 2회 재시도
  retries: process.env.CI ? 2 : 0,
  // CI에서는 단일 워커로 실행
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // 로컬 실행 시 빌드된 앱 서버를 자동 시작, CI에서는 빌드 후 직접 실행
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "npm start" : "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
