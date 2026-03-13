import { SignupForm } from "@/components/forms";
import { SetupNotice } from "@/components/setup-notice";
import { AppShell, AlertMessage, ButtonLink, Panel } from "@/components/ui";
import { signupAction } from "@/lib/actions/auth";
import { hasSupabaseEnv } from "@/lib/config/runtime";
import { getPublicSetupData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string; participantCode?: string }>;
}) {
  const params = await searchParams;
  const { branches, challengeTypes } = await getPublicSetupData();
  const successCode = params.success ? params.participantCode : undefined;

  return (
    <AppShell
      title="참가자 가입"
      description="러닝 챌린지에 참여하는 CrossFit ABLE 회원만 가입 가능합니다."
    >
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="가입 정보 입력">
          <AlertMessage message={params.error} />
          <SignupForm branches={branches} challengeTypes={challengeTypes} action={signupAction} />
        </Panel>
        <Panel title="가입 완료 안내">
          {successCode ? (
            <div className="grid gap-4">
              <AlertMessage
                type="success"
                message={`가입이 완료되었습니다. participant_code: ${successCode}`}
              />
              <p className="text-sm text-slate-600">
                로그인은 가입한 아이디로 진행하고, participant_code는 운영 확인용으로 보관해주세요.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/login">로그인하러 가기</ButtonLink>
                <ButtonLink href="/" variant="secondary">
                  홈으로
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 text-sm text-slate-600">
              <p>가입 후에는 만든 아이디와 비밀번호로 바로 로그인할 수 있습니다.</p>
              <p>participant_code는 가입 완료 후 운영 확인용으로 함께 안내됩니다.</p>
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
