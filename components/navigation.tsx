import Link from "next/link";

import { logoutAction } from "@/lib/actions/auth";
import { getCurrentSession } from "@/lib/auth/server";

export async function PublicNav() {
  const session = await getCurrentSession();

  return (
    <nav className="flex flex-wrap gap-3 text-sm font-medium">
      <Link href="/" className="hover:text-accent">
        홈
      </Link>
      <Link href="/guide" className="hover:text-accent">
        안내
      </Link>
      <Link href="/leaderboard" className="hover:text-accent">
        리더보드
      </Link>
      {session?.role === "participant" ? (
        <>
          <Link href="/dashboard" className="hover:text-accent">
            대시보드
          </Link>
          <form action={logoutAction}>
            <button className="hover:text-accent">로그아웃</button>
          </form>
        </>
      ) : session?.role === "admin" ? (
        <>
          <Link href="/admin/overview" className="hover:text-accent">
            관리자
          </Link>
          <form action={logoutAction}>
            <button className="hover:text-accent">로그아웃</button>
          </form>
        </>
      ) : (
        <>
          <Link href="/signup" className="hover:text-accent">
            가입
          </Link>
          <Link href="/login" className="hover:text-accent">
            참가자 로그인
          </Link>
          <Link href="/admin/login" className="hover:text-accent">
            관리자
          </Link>
        </>
      )}
    </nav>
  );
}

export function ParticipantNav() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/dashboard" className="text-sm font-medium hover:text-accent">
        대시보드
      </Link>
      <Link href="/records" className="text-sm font-medium hover:text-accent">
        기록 내역
      </Link>
      <Link href="/leaderboard" className="text-sm font-medium hover:text-accent">
        리더보드
      </Link>
      <form action={logoutAction}>
        <button className="text-sm font-medium hover:text-accent">로그아웃</button>
      </form>
    </div>
  );
}

export function AdminNav() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/admin/overview" className="text-sm font-medium hover:text-accent">
        전체 현황
      </Link>
      <Link href="/admin/participants" className="text-sm font-medium hover:text-accent">
        참가자 목록
      </Link>
      <Link href="/admin/records" className="text-sm font-medium hover:text-accent">
        기록 관리
      </Link>
      <form action={logoutAction}>
        <button className="text-sm font-medium hover:text-accent">로그아웃</button>
      </form>
    </div>
  );
}
