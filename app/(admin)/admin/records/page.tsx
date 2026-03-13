import { AdminNav } from "@/components/navigation";
import { AppShell, AlertMessage, EmptyState, Panel, StatusBadge, SubmitButton } from "@/components/ui";
import { adminEditRecordAction, changeRecordStatusAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/server";
import { getAdminRecords } from "@/lib/supabase/queries";
import { formatDate, formatDistanceNumber, formatPace } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function AdminRecordsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; updated?: string; edited?: string }>;
}) {
  const params = await searchParams;
  await requireRole("admin", "/admin/login");
  const records = await getAdminRecords();

  return (
    <AppShell title="기록 관리" description="상태 변경과 기록 수정을 같은 화면에서 처리합니다." actions={<AdminNav />}>
      <Panel title="작업 결과">
        <AlertMessage message={params.error} />
        <AlertMessage
          type="success"
          message={params.updated ? "상태가 변경되었습니다." : params.edited ? "기록이 수정되었습니다." : undefined}
        />
      </Panel>
      <Panel title="기록 목록">
        {records.length === 0 ? (
          <EmptyState title="기록이 없습니다." description="입력된 러닝 기록이 생기면 여기에 표시됩니다." />
        ) : (
          <div className="grid gap-4">
            {records.map((record) => (
              <div key={record.id} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {record.users?.name} (@{record.users?.username ?? "-"} · {record.users?.participant_code})
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(record.run_date)} · {formatDistanceNumber(record.distance_m)}km ·{" "}
                      {formatPace(record.pace_sec_per_km)}/km
                    </p>
                    {record.note ? <p className="mt-1 text-sm text-slate-600">메모: {record.note}</p> : null}
                    {record.warning_reason ? (
                      <p className="mt-1 text-sm text-amber-700">사유: {record.warning_reason}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={record.status} />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <form action={changeRecordStatusAction} className="grid gap-3 rounded-3xl bg-white p-4">
                    <input type="hidden" name="record_id" value={record.id} />
                    <p className="text-sm font-semibold">상태 변경</p>
                    <select name="status" defaultValue={record.status} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <option value="approved">approved</option>
                      <option value="warning">warning</option>
                      <option value="rejected">rejected</option>
                    </select>
                    <textarea
                      name="memo"
                      rows={2}
                      placeholder="상태 변경 메모"
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <SubmitButton>상태 저장</SubmitButton>
                  </form>

                  <form action={adminEditRecordAction} className="grid gap-3 rounded-3xl bg-white p-4">
                    <input type="hidden" name="record_id" value={record.id} />
                    <p className="text-sm font-semibold">기록 수정</p>
                    <input
                      type="date"
                      name="run_date"
                      defaultValue={record.run_date}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <input
                      type="number"
                      step="0.1"
                      name="distance_km"
                      defaultValue={formatDistanceNumber(record.distance_m)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <input
                      name="pace"
                      defaultValue={formatPace(record.pace_sec_per_km)}
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <textarea
                      name="note"
                      rows={2}
                      defaultValue={record.note ?? ""}
                      placeholder="기록 메모"
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <textarea
                      name="memo"
                      rows={2}
                      placeholder="관리자 수정 메모"
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                    />
                    <SubmitButton>기록 수정 저장</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
