/**
 * 루트 레이아웃
 * 다크모드 ThemeProvider를 전체 앱에 적용한다.
 */

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "유팜 기술지원 포털",
  description: "유팜시스템 기술 지원 지식베이스 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased`}>
        {/* 다크모드 기본값 적용, SSR 깜빡임 방지 */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
