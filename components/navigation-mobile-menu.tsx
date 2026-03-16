"use client";

import Link from "next/link";
import { useRef } from "react";

import { logoutAction } from "@/lib/actions/auth";
import type { UserRole } from "@/types/db";

function mobileTriggerClassName() {
  return "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition";
}

function mobilePanelItemClassName() {
  return "inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-ink";
}

export function MobilePublicMenu({ role }: { role: UserRole | null }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  };

  return (
    <details ref={detailsRef} className="group w-full sm:hidden">
      <summary className={`${mobileTriggerClassName()} list-none`}>메뉴</summary>
      <div className="mt-3 grid gap-2 rounded-[24px] border border-slate-200 bg-white p-3 shadow-panel">
        <Link href="/" className={mobilePanelItemClassName()} onClick={closeMenu}>
          홈
        </Link>
        <Link href="/guide" className={mobilePanelItemClassName()} onClick={closeMenu}>
          안내
        </Link>
        <Link href="/leaderboard" className={mobilePanelItemClassName()} onClick={closeMenu}>
          리더보드
        </Link>
        {role === "participant" ? (
          <>
            <Link href="/dashboard" className={mobilePanelItemClassName()} onClick={closeMenu}>
              대시보드
            </Link>
            <form
              action={async () => {
                closeMenu();
                await logoutAction();
              }}
            >
              <button className={mobilePanelItemClassName()}>로그아웃</button>
            </form>
          </>
        ) : role === "admin" ? (
          <>
            <Link href="/admin/overview" className={mobilePanelItemClassName()} onClick={closeMenu}>
              관리자
            </Link>
            <form
              action={async () => {
                closeMenu();
                await logoutAction();
              }}
            >
              <button className={mobilePanelItemClassName()}>로그아웃</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/signup" className={mobilePanelItemClassName()} onClick={closeMenu}>
              가입
            </Link>
            <Link href="/login" className={mobilePanelItemClassName()} onClick={closeMenu}>
              참가자 로그인
            </Link>
            <Link href="/admin/login" className={mobilePanelItemClassName()} onClick={closeMenu}>
              관리자
            </Link>
          </>
        )}
      </div>
    </details>
  );
}
