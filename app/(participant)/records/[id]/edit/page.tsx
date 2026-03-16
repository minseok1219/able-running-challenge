import { RecordForm } from "@/components/forms";
import { ParticipantNav } from "@/components/navigation";
import { AppShell, AlertMessage, Panel } from "@/components/ui";
import { getEditableRecord, updateRecordAction } from "@/lib/actions/participant";
import { formatDate, formatDistanceKm, formatPace } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const routeParams = await params;
  const queryParams = await searchParams;
  const { user, record, canEdit } = await getEditableRecord(routeParams.id);

  return (
    <AppShell
      title="기록 수정"
      description="등록 당일에만 수정 가능하며, 저장 후 상태가 다시 판정됩니다."
      actions={<ParticipantNav />}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.34fr]">
        <Panel title="수정 폼" description="날짜, 거리, 페이스를 다시 입력해 저장하세요.">
          <AlertMessage message={queryParams.error} />
          {canEdit ? (
            <RecordForm
              action={updateRecordAction.bind(null, record.id)}
              challenge={user.challenge_types!}
              record={record}
            />
          ) : (
            <AlertMessage message="이 기록은 등록 당일이 지나 수정할 수 없습니다." />
          )}
        </Panel>
        <Panel title="현재 기록">
          <div className="grid gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">날짜</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{formatDate(record.run_date)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">거리</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{formatDistanceKm(record.distance_m)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">평균 페이스</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{formatPace(record.pace_sec_per_km)}/km</p>
            </div>
            {record.note ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">메모</p>
                <p className="mt-1 text-sm text-slate-700">{record.note}</p>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
