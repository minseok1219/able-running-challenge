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
      <Panel title="챌린지 설명">
        <p className="text-sm leading-6 text-slate-700">
          가입 후 지점과 챌린지 타입을 선택하고, 날짜별 러닝 기록을 직접 입력합니다. 시스템은
          입력 즉시 자동 판정하여 approved, warning, rejected 상태를 계산합니다.
        </p>
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
