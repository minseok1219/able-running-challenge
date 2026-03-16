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
      <Panel title="안내" description="최근 기록과 수정 가능 여부를 한눈에 확인할 수 있습니다.">
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
              <div key={record.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{formatDate(record.run_date)}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {isEditableToday(record.created_at) ? "오늘까지 수정 가능" : "수정 기간 종료"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={record.status} />
                    {isEditableToday(record.created_at) ? (
                      <Link
                        href={`/records/${record.id}/edit`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400"
                      >
                        수정
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">거리</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {formatDistanceKm(record.distance_m)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">평균 페이스</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {formatPace(record.pace_sec_per_km)}/km
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-medium text-slate-500">상태 메모</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {record.warning_reason ?? "정상 기록"}
                    </p>
                  </div>
                </div>
                {record.note ? (
                  <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                    메모: {record.note}
                  </div>
                ) : null}
                {record.warning_reason ? (
                  <p className="mt-3 text-sm text-amber-700">사유: {record.warning_reason}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
