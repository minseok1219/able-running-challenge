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
      description="가입, 기록 입력, 자동 판정, 리더보드, 관리자 운영까지 한 흐름으로 연결된 1차 버전입니다."
      actions={
        <>
          <ButtonLink href="/signup">참가자 가입</ButtonLink>
          <ButtonLink href="/login" variant="secondary">
            참가자 로그인
          </ButtonLink>
        </>
      }
    >
      <div className="-mb-2 flex justify-center">
        <Image
          src="/able-logo.png"
          alt="CrossFit ABLE"
          width={360}
          height={205}
          className="h-24 w-auto object-contain sm:h-28"
          priority
        />
      </div>
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <Panel title="챌린지 기간" description="참가자는 한 가지 챌린지만 선택할 수 있습니다.">
        <div className="grid gap-4 md:grid-cols-2">
          {challengeTypes.map((challenge) => (
            <div key={challenge.id} className="rounded-3xl bg-slate-50 p-5">
              <p className="text-lg font-semibold">{challenge.name}</p>
              <p className="mt-2 text-sm text-slate-600">
                {challenge.start_date} ~ {challenge.end_date}
              </p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="간단 안내">
        <ul className="grid gap-3 text-sm text-slate-700">
          <li>기록 인정 기준은 최소 2km, 평균 페이스 9:00/km 이하입니다.</li>
          <li>approved 기록만 누적 거리, 차트, 리더보드에 반영됩니다.</li>
          <li>트레드밀 기록은 인정되지 않으며 안내 페이지에서 공지됩니다.</li>
        </ul>
      </Panel>
    </AppShell>
  );
}
