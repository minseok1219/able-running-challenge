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
    <AppShell title="기록 수정" description="등록 당일에만 수정 가능합니다." actions={<ParticipantNav />}>
      <Panel title="수정 폼">
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
    </AppShell>
  );
}
