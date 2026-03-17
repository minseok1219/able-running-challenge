import Image from "next/image";

import { SetupNotice } from "@/components/setup-notice";
import { AppShell, Panel } from "@/components/ui";
import { hasSupabaseEnv } from "@/lib/config/runtime";
import { getPublicSetupData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const { challengeTypes } = await getPublicSetupData();

  return (
    <AppShell title="챌린지 안내" description="운영 규칙과 기록 기준을 한 화면에서 확인할 수 있습니다.">
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <section className="overflow-hidden rounded-[28px] bg-white shadow-panel">
        <div className="relative min-h-[360px] overflow-hidden sm:min-h-[420px]">
          <Image
            src="/challenge-hero-runner.jpg"
            alt="러닝 챌린지 가이드 배경"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.16)_0%,rgba(15,23,42,0.56)_58%,rgba(15,23,42,0.82)_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-end px-6 py-7 sm:px-8 sm:py-8">
            <div className="max-w-3xl rounded-[28px] border border-white/12 bg-white/10 p-5 text-white backdrop-blur-xl sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">GUIDE</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                규칙을 이해하고,
                <br />
                끝까지 완주에 집중하세요
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
                챌린지 일정, 기록 인정 기준, 참여 혜택과 입력 방식을 한 번에 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Panel title="챌린지 설명">
        <p className="text-sm leading-6 text-slate-700">
          가입 후 지점과 챌린지 타입을 선택하고, 날짜별 러닝 기록을 직접 입력합니다. 시스템은
          입력 즉시 자동 판정하여 승인, 경고, 거절 상태를 계산합니다.
        </p>
      </Panel>
      <Panel title="챌린지 혜택 안내">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-accent">참여 시</p>
            <ul className="mt-3 grid gap-2 text-slate-700">
              <li>협업 스포츠 브랜드 할인쿠폰 증정</li>
              <li>스타트팩 제공 (아미노 바이탈 1만원 상당 제품)</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-accent">완주 시</p>
            <ul className="mt-3 grid gap-2 text-slate-700">
              <li>챌린지 완주 시 럭키드로우 자동 참여권 지급</li>
              <li>챌린지 완주 시 완주 티셔츠 증정</li>
            </ul>
          </div>
        </div>
      </Panel>
      <Panel title="일정">
        <div className="grid gap-3">
          {challengeTypes.map((challenge) => (
            <div key={challenge.id} className="rounded-3xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold">{challenge.name}</p>
              <p className="mt-1 text-slate-600">
                {challenge.start_date} ~ {challenge.end_date}
              </p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="기록 인정 기준">
        <ul className="grid gap-2 text-sm text-slate-700">
          <li>최소 2km 이상</li>
          <li>평균 페이스 9:00/km 이하</li>
          <li>하루 여러 기록 합산 가능</li>
          <li>트레드밀 기록 인정 불가</li>
          <li>트레드밀 여부는 시스템에서 검사하지 않음</li>
          <li>참가자는 실제로 러닝한 올바른 기록만 입력해 주세요.</li>
        </ul>
      </Panel>
      <Panel title="기록 입력 방식">
        <ul className="grid gap-2 text-sm text-slate-700">
          <li>거리는 km 단위로 입력하고 저장 시 m 정수로 변환됩니다.</li>
          <li>평균 페이스는 mm:ss 형식으로 입력하고 저장 시 초 단위로 변환됩니다.</li>
          <li>참가자는 등록 당일에만 본인 기록을 수정할 수 있습니다.</li>
        </ul>
      </Panel>
    </AppShell>
  );
}
