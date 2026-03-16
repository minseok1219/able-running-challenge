import { RecordForm } from "@/components/forms";
import { ParticipantNav } from "@/components/navigation";
import { AppShell, AlertMessage, Panel } from "@/components/ui";
import { getEditableRecord, updateRecordAction } from "@/lib/actions/participant";

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
          <div className="grid gap-2 text-sm text-slate-600">
            <p>날짜: {record.run_date}</p>
            <p>거리: {(record.distance_m / 1000).toFixed(record.distance_m % 1000 === 0 ? 0 : 1)}km</p>
            <p>페이스: {Math.floor(record.pace_sec_per_km / 60)}:{String(record.pace_sec_per_km % 60).padStart(2, "0")}/km</p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
