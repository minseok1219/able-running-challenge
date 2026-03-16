import { AdminNav } from "@/components/navigation";
import { AppShell, AlertMessage, EmptyState, Panel, SubmitButton } from "@/components/ui";
import { toggleParticipantActiveAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/server";
import { getAdminParticipants } from "@/lib/supabase/queries";
import { formatDistanceKm, formatPercent } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const params = await searchParams;
  await requireRole("admin", "/admin/login");
  const participants = await getAdminParticipants();

  return (
    <AppShell title="참가자 목록" description="참가자별 누적 거리와 경고 건수를 확인합니다." actions={<AdminNav />}>
      <Panel title="작업 결과">
        <AlertMessage message={params.error} />
        <AlertMessage
          type="success"
          message={
            params.updated === "deactivated"
              ? "참가자가 비활성화되었습니다."
              : params.updated === "activated"
                ? "참가자가 다시 활성화되었습니다."
                : undefined
          }
        />
      </Panel>
      <Panel title="참가자">
        {participants.length === 0 ? (
          <EmptyState title="참가자가 없습니다." description="가입된 참가자가 생기면 여기에 표시됩니다." />
        ) : (
          <div className="grid gap-3">
            {participants.map((participant) => (
              <div key={participant.id} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {participant.name}
                      {!participant.isActive ? (
                        <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                          비활성
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      @{participant.username} · {participant.participantCode} · {participant.branchName} · {participant.challengeName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3 text-right text-sm">
                    <div>
                      <p>{formatDistanceKm(participant.approvedDistanceM)}</p>
                      <p className="text-slate-600">{formatPercent(participant.progress)}</p>
                      <p className="text-amber-700">경고 {participant.warningCount}건</p>
                    </div>
                    <form action={toggleParticipantActiveAction}>
                      <input type="hidden" name="user_id" value={participant.id} />
                      <input type="hidden" name="next_active" value={participant.isActive ? "false" : "true"} />
                      <SubmitButton>{participant.isActive ? "비활성화" : "다시 활성화"}</SubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
