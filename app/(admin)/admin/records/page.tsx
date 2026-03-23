import { AdminNav } from "@/components/navigation";
import { AppShell, AlertMessage, EmptyState, Panel, StatusBadge, SubmitButton } from "@/components/ui";
import { adminEditRecordAction, changeRecordStatusAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/server";
import { getAdminRecords, getRecentAdminActions } from "@/lib/supabase/queries";
import { formatDate, formatDateTime, formatDistanceNumber, formatPace } from "@/lib/utils/format";
import type { AdminActionType, RecordStatus } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function AdminRecordsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; updated?: string; edited?: string }>;
}) {
  const params = await searchParams;
  await requireRole("admin", "/admin/login");
  const [records, recentActions] = await Promise.all([getAdminRecords(), getRecentAdminActions()]);
  const summary = {
    total: records.length,
    approved: records.filter((record) => record.status === "approved").length,
    warning: records.filter((record) => record.status === "warning").length,
    rejected: records.filter((record) => record.status === "rejected").length
  };

  return (
    <AppShell title="기록 관리" description="참가자 업로드를 빠르게 검토하고 상태 변경 및 기록 수정을 같은 화면에서 처리합니다." actions={<AdminNav />}>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_58%),white]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Review Queue</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">{summary.total}건의 기록을 검토 중입니다</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  기록은 요약 행으로 빠르게 훑고, 필요한 항목만 펼쳐서 상태 변경과 상세 수정을 진행하세요.
                </p>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                최근 작업 {recentActions.length}건
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryStatCard label="전체 기록" value={summary.total.toString()} tone="neutral" />
              <SummaryStatCard label="승인" value={summary.approved.toString()} tone="approved" />
              <SummaryStatCard label="경고" value={summary.warning.toString()} tone="warning" />
              <SummaryStatCard label="거절" value={summary.rejected.toString()} tone="rejected" />
            </div>
          </div>
        </Panel>

        <Panel title="작업 결과" description="최근 관리자 작업 로그입니다. 기록 검토와 참가자 관리 이력이 함께 표시됩니다.">
          <AlertMessage message={params.error} />
          <AlertMessage
            type="success"
            message={params.updated ? "상태가 변경되었습니다." : params.edited ? "기록이 수정되었습니다." : undefined}
          />
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            {recentActions.length === 0 ? (
              <p className="text-sm text-slate-500">아직 기록된 관리자 작업이 없습니다.</p>
            ) : (
              <div className="grid max-h-[34rem] gap-3 overflow-y-auto pr-1">
                {recentActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-100/70"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {getAdminActionLabel(action.actionType)}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{formatDateTime(action.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {action.adminName} · {action.participantName}
                      {action.participantUsername ? ` (@${action.participantUsername})` : ""}
                      {action.participantCode ? ` · ${action.participantCode}` : ""}
                    </p>
                    <div className="mt-2 grid gap-1 text-sm text-slate-600">
                      <p>{getAdminActionContextLabel(action)}</p>
                      {action.previousStatus || action.newStatus ? (
                        <p>
                          상태: {action.previousStatus ? getStatusLabel(action.previousStatus) : "-"} →{" "}
                          {action.newStatus ? getStatusLabel(action.newStatus) : "-"}
                        </p>
                      ) : null}
                      {action.memo ? <p>메모: {action.memo}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </section>

      <Panel title="기록 목록" description="요약 정보로 빠르게 확인하고, 필요한 기록만 펼쳐서 검토하세요.">
        {records.length === 0 ? (
          <EmptyState title="기록이 없습니다." description="입력된 러닝 기록이 생기면 여기에 표시됩니다." />
        ) : (
          <div className="grid gap-3">
            {records.map((record) => (
              <details
                key={record.id}
                className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-100/70 open:border-slate-300 open:shadow-panel"
              >
                <summary className="list-none cursor-pointer px-4 py-4 marker:content-none sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold text-slate-950">
                          {record.users?.name} (@{record.users?.username ?? "-"})
                        </p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {record.users?.participant_code}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(record.run_date)} 업로드</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={record.status} />
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        상세 검토
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-[20px] border border-slate-100 bg-slate-50/80 p-3 md:grid-cols-[0.8fr_0.8fr_1.4fr]">
                    <InlineMetric label="거리" value={`${formatDistanceNumber(record.distance_m)}km`} />
                    <InlineMetric label="평균 페이스" value={`${formatPace(record.pace_sec_per_km)}/km`} />
                    <InlineMetric
                      label={record.warning_reason ? "검토 메모" : "참가자 메모"}
                      value={record.warning_reason ?? record.note ?? "메모 없음"}
                      muted={!(record.warning_reason ?? record.note)}
                    />
                  </div>
                </summary>

                <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:px-5">
                  <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetaChip label="참가자" value={`${record.users?.name} / @${record.users?.username ?? "-"}`} />
                    <MetaChip label="기록일" value={formatDate(record.run_date)} />
                    <MetaChip
                      label="거리 · 페이스"
                      value={`${formatDistanceNumber(record.distance_m)}km · ${formatPace(record.pace_sec_per_km)}/km`}
                    />
                    <MetaChip label="현재 상태" value={getStatusLabel(record.status)} />
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <form action={changeRecordStatusAction} className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/70">
                      <input type="hidden" name="record_id" value={record.id} />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">상태 변경</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">승인, 경고, 거절 상태를 조정하고 작업 메모를 남길 수 있습니다.</p>
                        </div>
                        <StatusBadge status={record.status} />
                      </div>
                      <select
                        name="status"
                        defaultValue={record.status}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                      >
                        <option value="approved">승인</option>
                        <option value="warning">경고</option>
                        <option value="rejected">거절</option>
                      </select>
                      <textarea
                        name="memo"
                        rows={4}
                        placeholder="상태 변경 메모"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                      />
                      <SubmitButton>상태 저장</SubmitButton>
                    </form>

                    <form action={adminEditRecordAction} className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/70">
                      <input type="hidden" name="record_id" value={record.id} />
                      <div>
                        <p className="text-sm font-semibold text-slate-950">기록 수정</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">업로드 값이 잘못된 경우 거리, 페이스, 메모를 직접 수정할 수 있습니다.</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          type="date"
                          name="run_date"
                          defaultValue={record.run_date}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                        />
                        <input
                          type="number"
                          step="0.1"
                          name="distance_km"
                          defaultValue={formatDistanceNumber(record.distance_m)}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                        />
                        <input
                          name="pace"
                          defaultValue={formatPace(record.pace_sec_per_km)}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900"
                        />
                      </div>
                      <textarea
                        name="note"
                        rows={3}
                        defaultValue={record.note ?? ""}
                        placeholder="기록 메모"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                      />
                      <textarea
                        name="memo"
                        rows={3}
                        placeholder="관리자 수정 메모"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
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

function SummaryStatCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "neutral" | "approved" | "warning" | "rejected";
}) {
  const toneClass =
    tone === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "rejected"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-white text-slate-800";

  return (
    <div className={`rounded-[22px] border px-4 py-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs opacity-80">현재 목록 기준</p>
    </div>
  );
}

function InlineMetric({
  label,
  value,
  muted = false
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-sm font-medium ${muted ? "text-slate-400" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
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
  if (actionType === "participant_activate") return "참가자 활성화";
  if (actionType === "participant_deactivate") return "참가자 비활성화";
  if (actionType === "participant_delete") return "참가자 삭제";
  if (actionType === "participant_branch_update") return "지점 변경";
  return "기록 수정";
}

function getAdminActionContextLabel(action: {
  actionType: AdminActionType;
  runDate: string | null;
}) {
  if (action.runDate) {
    return `${formatDate(action.runDate)} 기록`;
  }

  if (action.actionType === "participant_branch_update") {
    return "참가자 지점 변경";
  }

  if (action.actionType === "participant_delete") {
    return "참가자 계정 삭제";
  }

  return "참가자 계정 작업";
}
