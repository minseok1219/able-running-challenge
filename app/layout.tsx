import "./globals.css";

import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { PublicNav } from "@/components/navigation";

export const metadata: Metadata = {
  title: "ARC",
  description: "ABLE RUNNING CHALLENGE 운영용 MVP",
  applicationName: "ARC",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/able-app-icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/able-app-icon.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ARC"
  }
};

export const viewport: Viewport = {
  themeColor: "#eef4f7",
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="overflow-x-hidden">
        <div className="min-h-[100svh] bg-mist">
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/able-logo.png"
                  alt="CrossFit ABLE"
                  width={168}
                  height={96}
                  className="h-11 w-auto object-contain sm:h-12"
                  priority
                />
              </Link>
              <PublicNav />
            </div>
          </div>
          {children}
          <footer className="mx-auto mt-8 w-full max-w-6xl px-4 pb-8 pt-2 text-center text-sm text-slate-500 sm:px-6">
            Copyright © CrossFit ABLE
          </footer>
        </div>
      </body>
    </html>
  );
}
