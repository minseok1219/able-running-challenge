"use client";

import Link from "next/link";
import { useEffect } from "react";

type ParticipantErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ParticipantError({ error, reset }: ParticipantErrorProps) {
  useEffect(() => {
    console.error("Participant route error", {
      message: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-6xl flex-col gap-4 px-0 py-4 sm:gap-6 sm:px-6 sm:py-6">
      <section className="rounded-[24px] bg-white p-5 shadow-panel sm:rounded-[28px] sm:p-6">
        <p className="text-sm font-medium text-accent">ABLE RUNNING CHALLENGE</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">참가자 페이지를 불러오지 못했습니다.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          일시적인 서버 응답 문제일 수 있습니다. 잠시 후 다시 시도하거나 홈에서 다시 진입해
          주세요.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs font-medium text-slate-400">오류 코드: {error.digest}</p>
        ) : null}
      </section>

      <section className="rounded-[24px] bg-white p-5 shadow-panel sm:rounded-[28px] sm:p-6">
        <div className="grid gap-3 text-sm leading-6 text-slate-600">
          <p>기록 입력이나 대시보드 진입 중 잠깐 오류가 생기면 새로고침 후 정상 복구되는 경우가 많습니다.</p>
          <p>같은 문제가 반복되면 다시 로그인한 뒤 이용해 주세요.</p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            다시 시도
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink hover:border-slate-400"
          >
            대시보드로 이동
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink hover:border-slate-400"
          >
            홈으로 이동
          </Link>
        </div>
      </section>
    </main>
  );
}
