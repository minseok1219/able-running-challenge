import { AlertMessage, Panel } from "@/components/ui";

export function SetupNotice() {
  return (
    <Panel title="로컬 실행 설정 필요" description="페이지는 열렸지만 DB 연결 전이라 읽기 전용 상태입니다.">
      <AlertMessage
        message="`.env.local`에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET을 넣고 서버를 재시작하면 가입/로그인/기록 저장까지 동작합니다."
      />
    </Panel>
  );
}
