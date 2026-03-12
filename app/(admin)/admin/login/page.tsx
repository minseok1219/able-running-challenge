import { AdminLoginForm } from "@/components/forms";
import { SetupNotice } from "@/components/setup-notice";
import { AppShell, AlertMessage, Panel } from "@/components/ui";
import { adminLoginAction } from "@/lib/actions/auth";
import { hasSupabaseEnv } from "@/lib/config/runtime";

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell title="관리자 로그인" description="관리자 전용 계정으로 로그인합니다.">
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <Panel title="로그인">
        <AlertMessage message={params.error} />
        <AdminLoginForm action={adminLoginAction} />
      </Panel>
    </AppShell>
  );
}
