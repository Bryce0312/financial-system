import "./globals.css";

import type { Metadata } from "next";
import { ReactNode } from "react";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "智能报账平台",
  description: "员工报销与管理后台"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

