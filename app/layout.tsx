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
    icon: [{ url: "/able-logo.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/able-logo.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ARC"
  }
};

export const viewport: Viewport = {
  themeColor: "#eef4f7"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-mist">
          <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <Link href="/" className="flex items-center">
                <Image
                  src="/able-logo.png"
                  alt="CrossFit ABLE"
                  width={168}
                  height={96}
                  className="h-12 w-auto object-contain"
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
