import { AdminNav } from "@/components/navigation";
import { AppShell, AlertMessage, EmptyState, Panel, StatusBadge, SubmitButton } from "@/components/ui";
import { adminEditRecordAction, changeRecordStatusAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/server";
import { getAdminRecords, getRecentAdminActions } from "@/lib/supabase/queries";
import { formatDate, formatDateTime, formatDistanceNumber, formatPace } from "@/lib/utils/format";
import type { AdminActionLog, AdminActionType, RecordStatus } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function AdminRecordsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; updated?: string; edited?: string }>;
}) {
  const params = await searchParams;
  await requireRole("admin", "/admin/login");
  const [records, recentActions] = await Promise.all([getAdminRecords(), getRecentAdminActions()]);

  return (
    <AppShell title="기록 관리" description="상태 변경과 기록 수정을 같은 화면에서 처리합니다." actions={<AdminNav />}>
      <Panel title="작업 결과">
        <AlertMessage message={params.error} />
        <AlertMessage
          type="success"
          message={params.updated ? "상태가 변경되었습니다." : params.edited ? "기록이 수정되었습니다." : undefined}
        />
        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">최근 관리자 작업 로그</p>
          {recentActions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">아직 기록된 관리자 작업이 없습니다.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {recentActions.map((action) => (
                <div key={action.id} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">
                    {getAdminActionLabel(action.actionType)} · {action.participantName}
                    {action.participantUsername ? ` (@${action.participantUsername})` : ""}
                    {action.participantCode ? ` · ${action.participantCode}` : ""}
                  </p>
                  <p className="mt-1 text-slate-600">
                    {action.runDate ? `${formatDate(action.runDate)} 기록` : "기록"} · {formatDateTime(action.createdAt)} ·{" "}
                    {action.adminName}
                  </p>
                  {action.previousStatus || action.newStatus ? (
                    <p className="mt-1 text-slate-600">
                      상태: {action.previousStatus ? getStatusLabel(action.previousStatus) : "-"} →{" "}
                      {action.newStatus ? getStatusLabel(action.newStatus) : "-"}
                    </p>
                  ) : null}
                  {action.memo ? <p className="mt-1 text-slate-600">메모: {action.memo}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
      <Panel title="기록 목록">
        {records.length === 0 ? (
          <EmptyState title="기록이 없습니다." description="입력된 러닝 기록이 생기면 여기에 표시됩니다." />
        ) : (
          <div className="grid gap-4">
            {records.map((record) => (
              <details key={record.id} className="group rounded-3xl border border-slate-200 bg-slate-50 open:bg-white">
                <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-4 marker:content-none">
                  <div>
                    <p className="font-semibold text-slate-900">
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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={record.status} />
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition group-open:rotate-180">
                      펼치기
                    </span>
                  </div>
                </summary>

                <div className="border-t border-slate-200 px-4 pb-4 pt-4">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <form action={changeRecordStatusAction} className="grid gap-3 rounded-3xl bg-slate-50 p-4">
                      <input type="hidden" name="record_id" value={record.id} />
                      <p className="text-sm font-semibold">상태 변경</p>
                      <select
                        name="status"
                        defaultValue={record.status}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <option value="approved">승인</option>
                        <option value="warning">경고</option>
                        <option value="rejected">거절</option>
                      </select>
                      <textarea
                        name="memo"
                        rows={2}
                        placeholder="상태 변경 메모"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      />
                      <SubmitButton>상태 저장</SubmitButton>
                    </form>

                    <form action={adminEditRecordAction} className="grid gap-3 rounded-3xl bg-slate-50 p-4">
                      <input type="hidden" name="record_id" value={record.id} />
                      <p className="text-sm font-semibold">기록 수정</p>
                      <input
                        type="date"
                        name="run_date"
                        defaultValue={record.run_date}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      />
                      <input
                        type="number"
                        step="0.1"
                        name="distance_km"
                        defaultValue={formatDistanceNumber(record.distance_m)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      />
                      <input
                        name="pace"
                        defaultValue={formatPace(record.pace_sec_per_km)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      />
                      <textarea
                        name="note"
                        rows={2}
                        defaultValue={record.note ?? ""}
                        placeholder="기록 메모"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      />
                      <textarea
                        name="memo"
                        rows={2}
                        placeholder="관리자 수정 메모"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      />
                      <SubmitButton>기록 수정 저장</SubmitButton>
                    </form>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

function getStatusLabel(status: RecordStatus) {
  if (status === "approved") return "승인";
  if (status === "warning") return "경고";
  return "거절";
}

function getAdminActionLabel(actionType: AdminActionType) {
  if (actionType === "approve") return "상태 승인";
  if (actionType === "warn") return "상태 경고";
  if (actionType === "reject") return "상태 거절";
  return "기록 수정";
}
