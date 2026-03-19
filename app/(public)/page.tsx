import Image from "next/image";

import { SetupNotice } from "@/components/setup-notice";
import { AppShell, ButtonLink, Panel } from "@/components/ui";
import { getCurrentSession } from "@/lib/auth/server";
import { logoutAction } from "@/lib/actions/auth";
import { hasSupabaseEnv } from "@/lib/config/runtime";
import { getPublicSetupData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { challengeTypes } = await getPublicSetupData();
  const session = await getCurrentSession();

  return (
    <AppShell
      hideHeader
    >
      <section className="overflow-hidden rounded-[28px] bg-white shadow-panel">
        <div className="relative min-h-[680px] overflow-hidden lg:min-h-[760px]">
          <Image
            src="/challenge-hero-runner.jpg"
            alt="도심에서 달리는 러너"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,23,42,0.24)_0%,rgba(13,23,42,0.62)_48%,rgba(13,23,42,0.88)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.16),transparent_28%)]" />

          <div className="relative z-10 grid h-full gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="flex flex-col justify-between gap-8">
              <div className="grid gap-6">
                <div className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.24em] text-orange-100 backdrop-blur">
                  ABLE RUNNING CHALLENGE
                </div>
                <div className="flex justify-center lg:justify-start">
                  <Image
                    src="/able-logo.png"
                    alt="CrossFit ABLE"
                    width={360}
                    height={205}
                    className="h-24 w-auto object-contain brightness-[1.08] drop-shadow-[0_8px_30px_rgba(15,23,42,0.55)] sm:h-28"
                  />
                </div>
                <div className="grid gap-4">
                  <h1 className="max-w-3xl text-center text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-5xl sm:leading-[0.98] lg:text-left lg:text-6xl">
                    매일의 한 걸음이,
                    <br />
                    목표 완주를 만듭니다.
                  </h1>
                  <p className="max-w-2xl text-center text-base leading-7 text-slate-200 lg:text-left">
                    오늘의 러닝을 차곡차곡 쌓아 목표 거리에 도전하세요. 내 기록과 순위를 확인하며
                    CrossFit ABLE 회원들과 함께 완주까지 이어가는 챌린지입니다.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/signup">지금 참가하기</ButtonLink>
                  <ButtonLink href="/leaderboard" variant="secondary">
                    현재 리더보드 보기
                  </ButtonLink>
                  {session ? (
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink hover:border-slate-400 sm:w-auto"
                      >
                        로그아웃
                      </button>
                    </form>
                  ) : (
                    <ButtonLink href="/login" variant="secondary">
                      로그인
                    </ButtonLink>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <HeroStat label="챌린지 옵션" value="100km / 100 miles" />
                <HeroStat label="기록 반영 기준" value="승인 기록만 누적" />
                <HeroStat label="완주 목표" value="배지 · 리더보드 · 보상" />
              </div>
            </div>

            <div className="grid gap-4 self-end">
              <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 text-white backdrop-blur-xl">
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
                  <div
                    key={challenge.id}
                    className="rounded-[28px] border border-white/12 bg-white/10 p-5 text-white backdrop-blur-xl"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-100">
                      {challenge.code}
                    </p>
                    <p className="mt-3 text-2xl font-semibold">{challenge.name}</p>
                    <p className="mt-2 text-sm text-slate-200">
                      {challenge.start_date} ~ {challenge.end_date}
                    </p>
                    <p className="mt-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                      목표 {(challenge.target_distance_m / 1000).toFixed(0)}km
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <Panel title="챌린지 참여 혜택">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold tracking-[0.18em] text-accent">참여 시</p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
              <li>협업 스포츠 브랜드 할인쿠폰 증정</li>
              <li>스타트팩 제공 (아미노 바이탈 1만원 상당 제품)</li>
            </ul>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold tracking-[0.18em] text-accent">완주 시</p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
              <li>챌린지 완주 시 럭키드로우 자동 참여권 지급</li>
              <li>챌린지 완주 시 완주 티셔츠 증정</li>
            </ul>
          </div>
        </div>
      </Panel>
      <Panel title="간단 안내">
        <ul className="grid gap-3 text-sm text-slate-700">
          <li>기록 인정 기준은 최소 2km, 평균 페이스 9:00/km 이하입니다.</li>
          <li>승인 기록만 누적 거리, 차트, 리더보드에 반영됩니다.</li>
          <li>트레드밀 기록은 인정되지 않으며 안내 페이지에서 공지됩니다.</li>
          <li>참가자는 실제로 러닝한 올바른 기록만 입력해 주세요.</li>
        </ul>
      </Panel>
    </AppShell>
  );
}

function HeroStat({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-white backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-white">{value}</p>
    </div>
  );
}
