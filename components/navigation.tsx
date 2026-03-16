import Link from "next/link";

import { logoutAction } from "@/lib/actions/auth";
import { getCurrentSession } from "@/lib/auth/server";

function navItemClassName() {
  return "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 hover:bg-slate-50";
}

function mobileTriggerClassName() {
  return "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition";
}

function mobilePanelItemClassName() {
  return "inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-ink";
}

export async function PublicNav() {
  const session = await getCurrentSession();

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
        {session?.role === "participant" ? (
          <>
            <Link href="/dashboard" className={navItemClassName()}>
              대시보드
            </Link>
            <form action={logoutAction}>
              <button className={navItemClassName()}>로그아웃</button>
            </form>
          </>
        ) : session?.role === "admin" ? (
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
      <details className="group w-full sm:hidden">
        <summary className={`${mobileTriggerClassName()} list-none`}>
          메뉴
        </summary>
        <div className="mt-3 grid gap-2 rounded-[24px] border border-slate-200 bg-white p-3 shadow-panel">
          <Link href="/" className={mobilePanelItemClassName()}>
            홈
          </Link>
          <Link href="/guide" className={mobilePanelItemClassName()}>
            안내
          </Link>
          <Link href="/leaderboard" className={mobilePanelItemClassName()}>
            리더보드
          </Link>
          {session?.role === "participant" ? (
            <>
              <Link href="/dashboard" className={mobilePanelItemClassName()}>
                대시보드
              </Link>
              <form action={logoutAction}>
                <button className={mobilePanelItemClassName()}>로그아웃</button>
              </form>
            </>
          ) : session?.role === "admin" ? (
            <>
              <Link href="/admin/overview" className={mobilePanelItemClassName()}>
                관리자
              </Link>
              <form action={logoutAction}>
                <button className={mobilePanelItemClassName()}>로그아웃</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signup" className={mobilePanelItemClassName()}>
                가입
              </Link>
              <Link href="/login" className={mobilePanelItemClassName()}>
                참가자 로그인
              </Link>
              <Link href="/admin/login" className={mobilePanelItemClassName()}>
                관리자
              </Link>
            </>
          )}
        </div>
      </details>
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
