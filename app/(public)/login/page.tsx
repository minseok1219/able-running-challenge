import { ParticipantLoginForm } from "@/components/forms";
import { SetupNotice } from "@/components/setup-notice";
import { AppShell, AlertMessage, Panel } from "@/components/ui";
import { participantLoginAction } from "@/lib/actions/auth";
import { hasSupabaseEnv } from "@/lib/config/runtime";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell title="참가자 로그인" description="participant_code와 비밀번호로 로그인합니다.">
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <Panel title="로그인">
        <AlertMessage message={params.error} />
        <ParticipantLoginForm action={participantLoginAction} />
      </Panel>
    </AppShell>
  );
}
