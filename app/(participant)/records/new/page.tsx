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
    <AppShell title="기록 입력" description="저장 즉시 자동 상태 판정이 적용됩니다." actions={<ParticipantNav />}>
      <Panel title="러닝 기록 입력">
        <AlertMessage message={params.error} />
        <RecordForm action={createRecordAction} challenge={user.challenge_types} />
      </Panel>
    </AppShell>
  );
}
