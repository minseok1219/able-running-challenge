import Link from "next/link";

import { ParticipantNav } from "@/components/navigation";
import { AppShell, AlertMessage, ButtonLink, EmptyState, Panel, StatusBadge } from "@/components/ui";
import { requireRole, getCurrentUserRow } from "@/lib/auth/server";
import { getParticipantRecords } from "@/lib/supabase/queries";
import { formatDate, formatDistanceKm, formatPace, isEditableToday } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function RecordsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole("participant", "/login");
  const user = await getCurrentUserRow(session);
  const records = await getParticipantRecords(user.id);

  return (
    <AppShell
      title="기록 내역"
      description="본인 기록만 표시되며, 등록 당일에만 수정할 수 있습니다."
      actions={
        <>
          <ParticipantNav />
          <ButtonLink href="/records/new">기록 입력</ButtonLink>
        </>
      }
    >
      <Panel title="안내">
        <AlertMessage message={params.error} />
        <AlertMessage
          type="success"
          message={
            params.saved ? "기록이 저장되었습니다." : params.updated ? "기록이 수정되었습니다." : undefined
          }
        />
      </Panel>
      <Panel title="내 기록">
        {records.length === 0 ? (
          <EmptyState title="입력된 기록이 없습니다." description="첫 기록을 등록해보세요." />
        ) : (
          <div className="grid gap-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <p className="font-semibold">{formatDate(record.run_date)}</p>
                    <p className="text-sm text-slate-600">
                      {formatDistanceKm(record.distance_m)} · {formatPace(record.pace_sec_per_km)}/km
                    </p>
                    {record.note ? <p className="text-sm text-slate-600">메모: {record.note}</p> : null}
                    {record.warning_reason ? (
                      <p className="text-sm text-amber-700">사유: {record.warning_reason}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge status={record.status} />
                    {isEditableToday(record.created_at) ? (
                      <Link
                        href={`/records/${record.id}/edit`}
                        className="text-sm font-medium text-accent underline-offset-4 hover:underline"
                      >
                        수정
                      </Link>
                    ) : null}
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
