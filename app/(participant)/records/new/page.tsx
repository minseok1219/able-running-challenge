import { RecordForm } from "@/components/forms";
import { ParticipantNav } from "@/components/navigation";
import { AppShell, AlertMessage, Panel } from "@/components/ui";
import { createRecordAction } from "@/lib/actions/participant";
import { requireRole, getCurrentUserRow } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function NewRecordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole("participant", "/login");
  const user = await getCurrentUserRow(session);

  if (!user.challenge_types) {
    throw new Error("챌린지 정보가 없습니다.");
  }

  return (
    <AppShell
      title="기록 입력"
      description="러닝 기록을 간단히 입력하면 저장 즉시 자동 판정이 적용됩니다."
      actions={<ParticipantNav />}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_0.36fr]">
        <Panel
          title="러닝 기록 입력"
          description="오늘의 러닝을 차분하게 입력하고 바로 결과를 확인해보세요."
          className="overflow-hidden"
        >
          <AlertMessage message={params.error} />
          <RecordForm action={createRecordAction} challenge={user.challenge_types} />
        </Panel>
        <div className="grid gap-4">
          <Panel title="입력 기준" className="bg-gradient-to-br from-white via-slate-50 to-slate-50">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <p>최소 인정 거리는 2km입니다.</p>
              <p>평균 페이스 9:00/km 이하만 승인 대상입니다.</p>
              <p>경고나 거절 기록은 리더보드와 누적 거리에 반영되지 않습니다.</p>
            </div>
          </Panel>
          <Panel title="입력 팁" className="bg-gradient-to-br from-orange-50/70 via-white to-white">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <p>러닝 직후 바로 입력하면 날짜와 페이스를 더 정확히 남길 수 있습니다.</p>
              <p>메모에는 코스나 컨디션을 짧게 남겨두면 나중에 기록을 보기 편합니다.</p>
              <p>실제로 러닝한 기록만 입력해 주세요.</p>
            </div>
          </Panel>
          <div className="rounded-[28px] border border-slate-200 bg-ink p-5 text-white shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Challenge Goal</p>
            <p className="mt-3 text-2xl font-semibold">{user.challenge_types.name}</p>
            <p className="mt-2 text-sm text-slate-200">
              {user.challenge_types.start_date} ~ {user.challenge_types.end_date}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
