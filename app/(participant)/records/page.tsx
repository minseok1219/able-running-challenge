import Link from "next/link";

import { ParticipantNav } from "@/components/navigation";
import { AppShell, AlertMessage, ButtonLink, EmptyState, Panel, StatusBadge } from "@/components/ui";
import { deleteRecordAction } from "@/lib/actions/participant";
import { requireRole, getCurrentUserRow } from "@/lib/auth/server";
import { getParticipantRecords } from "@/lib/supabase/queries";
import { formatDate, formatDateTime, formatDistanceKm, formatPace, isEditableToday } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function RecordsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string; updated?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole("participant", "/login");
  const user = await getCurrentUserRow(session);
  const records = await getParticipantRecords(user.id);
  const approvedCount = records.filter((record) => record.status === "approved").length;
  const warningCount = records.filter((record) => record.status === "warning").length;
  const rejectedCount = records.filter((record) => record.status === "rejected").length;

  return (
    <AppShell
      title="기록 내역"
      description="본인 기록만 표시되며, 등록 당일에만 수정하거나 삭제할 수 있습니다."
      actions={
        <>
          <ParticipantNav />
          <ButtonLink href="/records/new">기록 입력</ButtonLink>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[30px] bg-gradient-to-br from-ink via-slate-800 to-slate-700 p-6 text-white shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Record History</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">내 러닝 기록을 한눈에 확인하세요</h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            최근 기록, 수정 가능 여부, 상태 사유를 빠르게 확인하고 필요한 기록은 당일 안에 바로 수정할 수 있습니다.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <HistorySummaryCard label="승인" value={`${approvedCount}건`} tone="approved" />
            <HistorySummaryCard label="경고" value={`${warningCount}건`} tone="warning" />
            <HistorySummaryCard label="거절" value={`${rejectedCount}건`} tone="rejected" />
          </div>
        </div>
        <Panel title="안내" className="bg-gradient-to-br from-white via-slate-50 to-slate-50">
          <AlertMessage message={params.error} />
          <AlertMessage
            type="success"
            message={
              params.saved
                ? "기록이 저장되었습니다."
                : params.updated
                  ? "기록이 수정되었습니다."
                  : params.deleted
                    ? "기록이 삭제되었습니다."
                    : undefined
            }
          />
          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            <p>기록은 러닝한 당일에만 입력할 수 있습니다.</p>
            <p>기록은 등록 당일에만 수정하거나 삭제할 수 있습니다.</p>
            <p>승인 기록만 누적 거리와 리더보드에 반영됩니다.</p>
            <p>경고나 거절 사유가 있으면 각 기록 카드에서 바로 확인할 수 있습니다.</p>
          </div>
        </Panel>
      </section>
      <Panel title="내 기록">
        {records.length === 0 ? (
          <EmptyState title="입력된 기록이 없습니다." description="첫 기록을 등록해보세요." />
        ) : (
          <div className="grid gap-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-50 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                        {formatDate(record.run_date)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isEditableToday(record.created_at)
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isEditableToday(record.created_at) ? "오늘까지 수정 가능" : "수정 기간 종료"}
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-slate-900">
                      {formatDistanceKm(record.distance_m)} · {formatPace(record.pace_sec_per_km)}/km
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {record.note ? "메모가 포함된 기록입니다." : "메모 없는 간단 기록입니다."}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">업로드: {formatDateTime(record.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={record.status} />
                    {isEditableToday(record.created_at) ? (
                      <>
                        <Link
                          href={`/records/${record.id}/edit`}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-400"
                        >
                          수정
                        </Link>
                        <form action={deleteRecordAction.bind(null, record.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                          >
                            삭제
                          </button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-[0.9fr_0.9fr_1.2fr]">
                  <RecordMiniCard label="거리" value={formatDistanceKm(record.distance_m)} />
                  <RecordMiniCard label="평균 페이스" value={`${formatPace(record.pace_sec_per_km)}/km`} />
                  <RecordMiniCard
                    label="상태 메모"
                    value={record.warning_reason ?? "정상 기록"}
                    subtle
                  />
                </div>
                {record.note ? (
                  <div className="mt-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Note</p>
                    <p className="mt-2">메모: {record.note}</p>
                  </div>
                ) : null}
                {record.warning_reason ? (
                  <div className="mt-3 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    사유: {record.warning_reason}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

function HistorySummaryCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "approved" | "warning" | "rejected";
}) {
  const toneClassName =
    tone === "approved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className={`rounded-[24px] border px-4 py-4 ${toneClassName}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RecordMiniCard({
  label,
  value,
  subtle = false
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-2 ${subtle ? "text-sm font-medium text-slate-700" : "text-base font-semibold text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
