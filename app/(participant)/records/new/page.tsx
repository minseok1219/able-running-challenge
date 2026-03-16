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
      <div className="grid gap-4 lg:grid-cols-[1fr_0.34fr]">
        <Panel title="러닝 기록 입력" description="오늘의 러닝을 간단히 남겨보세요.">
          <AlertMessage message={params.error} />
          <RecordForm action={createRecordAction} challenge={user.challenge_types} />
        </Panel>
        <Panel title="입력 기준">
          <div className="grid gap-3 text-sm text-slate-600">
            <p>최소 인정 거리는 2km입니다.</p>
            <p>평균 페이스 9:00/km 이하만 승인 대상입니다.</p>
            <p>경고나 거절 기록은 리더보드와 누적 거리에 반영되지 않습니다.</p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
