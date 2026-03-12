import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { PublicNav } from "@/components/navigation";

export const metadata: Metadata = {
  title: "ABLE RUNNING CHALLENGE MVP",
  description: "ABLE RUNNING CHALLENGE 운영용 MVP"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="text-base font-semibold">
              ABLE RUNNING CHALLENGE
            </Link>
            <PublicNav />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
