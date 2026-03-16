import Image from "next/image";

import { SetupNotice } from "@/components/setup-notice";
import { AppShell, ButtonLink, Panel } from "@/components/ui";
import { hasSupabaseEnv } from "@/lib/config/runtime";
import { getPublicSetupData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { challengeTypes } = await getPublicSetupData();

  return (
    <AppShell
      title=""
      description="매일의 한 걸음이, 목표 완주를 만듭니다."
    >
      <section className="overflow-hidden rounded-[28px] bg-white shadow-panel">
        <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="grid gap-6">
            <div className="inline-flex w-fit rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-accent">
              ABLE RUNNING CHALLENGE
            </div>
            <div className="grid gap-4">
              <div className="flex justify-center lg:justify-start">
                <Image
                  src="/able-logo.png"
                  alt="CrossFit ABLE"
                  width={360}
                  height={205}
                  className="h-24 w-auto object-contain sm:h-28"
                  priority
                />
              </div>
              <h1 className="text-center text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-left lg:text-5xl">
                매일의 한 걸음이,
                <br />
                목표 완주를 만듭니다.
              </h1>
              <p className="text-center text-base leading-7 text-slate-600 lg:max-w-xl lg:text-left">
                오늘의 러닝을 차곡차곡 쌓아 목표 거리에 도전하세요. 내 기록과 순위를 확인하며
                CrossFit ABLE 회원들과 함께 완주까지 이어가는 챌린지입니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup">지금 참가하기</ButtonLink>
              <ButtonLink href="/leaderboard" variant="secondary">
                현재 리더보드 보기
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                로그인
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[28px] bg-gradient-to-br from-ink via-slate-800 to-slate-700 p-5 text-white">
              <p className="text-xs font-semibold tracking-[0.18em] text-orange-200">CHALLENGE FLOW</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">1. 가입 후 챌린지 선택</p>
                  <p className="mt-1 text-sm text-slate-200">100km 또는 100 miles 중 하나를 선택합니다.</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">2. 러닝 기록 업로드</p>
                  <p className="mt-1 text-sm text-slate-200">매일의 기록이 자동 판정되어 누적됩니다.</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">3. 배지와 리더보드 확인</p>
                  <p className="mt-1 text-sm text-slate-200">내 진행률과 다음 마일스톤을 바로 확인할 수 있습니다.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {challengeTypes.map((challenge) => (
                <div key={challenge.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {challenge.code}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-ink">{challenge.name}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {challenge.start_date} ~ {challenge.end_date}
                  </p>
                  <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink">
                    목표 {(challenge.target_distance_m / 1000).toFixed(0)}km
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <Panel title="간단 안내">
        <ul className="grid gap-3 text-sm text-slate-700">
          <li>기록 인정 기준은 최소 2km, 평균 페이스 9:00/km 이하입니다.</li>
          <li>승인 기록만 누적 거리, 차트, 리더보드에 반영됩니다.</li>
          <li>트레드밀 기록은 인정되지 않으며 안내 페이지에서 공지됩니다.</li>
        </ul>
      </Panel>
    </AppShell>
  );
}
