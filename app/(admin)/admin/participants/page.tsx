import { AdminNav } from "@/components/navigation";
import { AppShell, EmptyState, Panel } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { getAdminParticipants } from "@/lib/supabase/queries";
import { formatDistanceKm, formatPercent } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function AdminParticipantsPage() {
  await requireRole("admin", "/admin/login");
  const participants = await getAdminParticipants();

  return (
    <AppShell title="참가자 목록" description="참가자별 누적 거리와 경고 건수를 확인합니다." actions={<AdminNav />}>
      <Panel title="참가자">
        {participants.length === 0 ? (
          <EmptyState title="참가자가 없습니다." description="가입된 참가자가 생기면 여기에 표시됩니다." />
        ) : (
          <div className="grid gap-3">
            {participants.map((participant) => (
              <div key={participant.id} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{participant.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      @{participant.username} · {participant.participantCode} · {participant.branchName} · {participant.challengeName}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatDistanceKm(participant.approvedDistanceM)}</p>
                    <p className="text-slate-600">{formatPercent(participant.progress)}</p>
                    <p className="text-amber-700">warning {participant.warningCount}건</p>
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
