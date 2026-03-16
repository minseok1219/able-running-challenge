import Link from "next/link";

import { MobilePublicMenu } from "@/components/navigation-mobile-menu";
import { logoutAction } from "@/lib/actions/auth";
import { getCurrentSession } from "@/lib/auth/server";
import type { UserRole } from "@/types/db";

function navItemClassName() {
  return "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 hover:bg-slate-50";
}

export function mobileTriggerClassName() {
  return "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition";
}

export function mobilePanelItemClassName() {
  return "inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-ink";
}

export async function PublicNav() {
  const session = await getCurrentSession();
  const role = session?.role ?? null;

  return (
    <>
      <nav className="hidden w-full gap-2 overflow-x-auto pb-1 text-sm font-medium sm:w-auto sm:flex sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0">
        <Link href="/" className={navItemClassName()}>
          홈
        </Link>
        <Link href="/guide" className={navItemClassName()}>
          안내
        </Link>
        <Link href="/leaderboard" className={navItemClassName()}>
          리더보드
        </Link>
        {role === "participant" ? (
          <>
            <Link href="/dashboard" className={navItemClassName()}>
              대시보드
            </Link>
            <form action={logoutAction}>
              <button className={navItemClassName()}>로그아웃</button>
            </form>
          </>
        ) : role === "admin" ? (
          <>
            <Link href="/admin/overview" className={navItemClassName()}>
              관리자
            </Link>
            <form action={logoutAction}>
              <button className={navItemClassName()}>로그아웃</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/signup" className={navItemClassName()}>
              가입
            </Link>
            <Link href="/login" className={navItemClassName()}>
              참가자 로그인
            </Link>
            <Link href="/admin/login" className={navItemClassName()}>
              관리자
            </Link>
          </>
        )}
      </nav>
      <MobilePublicMenu role={role} />
    </>
  );
}

export function ParticipantNav() {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap sm:pb-0">
      <Link href="/dashboard" className={navItemClassName()}>
        대시보드
      </Link>
      <Link href="/records" className={navItemClassName()}>
        기록 내역
      </Link>
      <Link href="/leaderboard" className={navItemClassName()}>
        리더보드
      </Link>
      <form action={logoutAction}>
        <button className={navItemClassName()}>로그아웃</button>
      </form>
    </div>
  );
}

export function AdminNav() {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap sm:pb-0">
      <Link href="/admin/overview" className={navItemClassName()}>
        전체 현황
      </Link>
      <Link href="/admin/participants" className={navItemClassName()}>
        참가자 목록
      </Link>
      <Link href="/admin/records" className={navItemClassName()}>
        기록 관리
      </Link>
      <form action={logoutAction}>
        <button className={navItemClassName()}>로그아웃</button>
      </form>
    </div>
  );
}
