import Link from "next/link";

import { AdminNav } from "@/components/navigation";
import { AppShell, AlertMessage, EmptyState, Panel, SubmitButton } from "@/components/ui";
import { deleteParticipantAction, toggleParticipantActiveAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/server";
import { getPublicSetupData, getAdminParticipants } from "@/lib/supabase/queries";
import { formatDistanceKm, formatPercent } from "@/lib/utils/format";
import type { WeeklyListStatus } from "@/types/db";

export const dynamic = "force-dynamic";

type PageSearchParams = {
  q?: string;
  branch?: string;
  challenge?: string;
  delinquent?: string;
  error?: string;
  updated?: string;
};

export default async function AdminParticipantsPage({
  searchParams
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const params = await searchParams;
  await requireRole("admin", "/admin/login");
  const [{ branches, challengeTypes }, participants] = await Promise.all([
    getPublicSetupData(),
    getAdminParticipants()
  ]);

  const q = params.q?.trim().toLowerCase() ?? "";
  const branchFilter = params.branch ?? "";
  const challengeFilter = params.challenge ?? "";
  const delinquentOnly = params.delinquent === "1";

  const filteredParticipants = participants.filter((participant) => {
    const matchesQuery =
      q.length === 0 ||
      participant.name.toLowerCase().includes(q) ||
      participant.username.toLowerCase().includes(q) ||
      participant.participantCode.toLowerCase().includes(q);
    const matchesBranch = !branchFilter || participant.branchCode === branchFilter;
    const matchesChallenge = !challengeFilter || participant.challengeCode === challengeFilter;
    const matchesDelinquent = !delinquentOnly || participant.currentWeekStatus === "미달";

    return matchesQuery && matchesBranch && matchesChallenge && matchesDelinquent;
  });

  return (
    <AppShell
      title="참가자 목록"
      description="참가자별 승인 누적 거리와 주차별 달성 현황을 함께 확인합니다."
      actions={<AdminNav />}
    >
      <Panel title="작업 결과">
        <AlertMessage message={params.error} />
        <AlertMessage
          type="success"
          message={
            params.updated === "deactivated"
              ? "참가자가 비활성화되었습니다."
              : params.updated === "activated"
                ? "참가자가 다시 활성화되었습니다."
                : params.updated === "deleted"
                  ? "참가자가 삭제되었습니다."
                : undefined
          }
        />
      </Panel>

      <Panel
        title="필터"
        description="이름, 지점, 종목 기준으로 빠르게 찾고 이번 주 미달자만 따로 확인할 수 있습니다."
      >
        <form className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>이름 검색</span>
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="이름, 아이디, participant_code"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>지점</span>
            <select
              name="branch"
              defaultValue={branchFilter}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            >
              <option value="">전체 지점</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.code}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>챌린지 타입</span>
            <select
              name="challenge"
              defaultValue={challengeFilter}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
            >
              <option value="">전체 종목</option>
              {challengeTypes.map((challenge) => (
                <option key={challenge.id} value={challenge.code}>
                  {challenge.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            <input type="checkbox" name="delinquent" value="1" defaultChecked={delinquentOnly} className="size-4 rounded border-slate-300" />
            이번 주 미달자만
          </label>
          <div className="flex gap-2">
            <SubmitButton>적용</SubmitButton>
            <Link
              href="/admin/participants"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              초기화
            </Link>
          </div>
        </form>
      </Panel>

      <Panel title="참가자" description={`${filteredParticipants.length}명의 참가자를 표시하고 있습니다.`}>
        {filteredParticipants.length === 0 ? (
          <EmptyState title="조건에 맞는 참가자가 없습니다." description="검색어나 필터 조건을 조정해 보세요." />
        ) : (
          <div className="grid gap-3">
            {filteredParticipants.map((participant) => (
              <article
                key={participant.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm shadow-slate-100/70"
              >
                <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_auto] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/participants/${participant.id}`}
                        className="truncate text-base font-semibold text-slate-950 underline-offset-4 hover:text-accent hover:underline"
                      >
                        {participant.name}
                      </Link>
                      {!participant.isActive ? (
                        <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          비활성
                        </span>
                      ) : null}
                      <WeeklyStatusBadge status={participant.currentWeekStatus} />
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      @{participant.username} · {participant.participantCode} · {participant.branchName}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{participant.challengeName}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-3">
                    <MetricChip label="승인 누적" value={formatDistanceKm(participant.approvedDistanceM)} />
                    <MetricChip label="전체 진행률" value={formatPercent(participant.progress)} />
                    <MetricChip label="달성 주차" value={`${participant.achievedWeeks} / ${participant.totalWeeks}`} />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 xl:flex-col xl:items-end">
                    <Link
                      href={`/admin/participants/${participant.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                    >
                      상세 보기
                    </Link>
                    <form action={toggleParticipantActiveAction}>
                      <input type="hidden" name="user_id" value={participant.id} />
                      <input type="hidden" name="next_active" value={participant.isActive ? "false" : "true"} />
                      <SubmitButton>{participant.isActive ? "비활성화" : "다시 활성화"}</SubmitButton>
                    </form>
                  </div>
                </div>

                <details className="mt-4 rounded-[20px] border border-rose-200 bg-rose-50/70 p-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-rose-700 marker:hidden">
                    참가자 삭제
                  </summary>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="grid gap-2">
                      <p className="text-sm text-rose-700">
                        삭제하면 참가자 계정과 기록이 함께 제거됩니다. 관리자 비밀번호를 다시 입력한 뒤 진행해 주세요.
                      </p>
                      <form action={deleteParticipantAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                        <input type="hidden" name="user_id" value={participant.id} />
                        <input type="hidden" name="return_to" value="/admin/participants" />
                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                          <span>관리자 비밀번호 확인</span>
                          <input
                            type="password"
                            name="admin_password"
                            required
                            placeholder="현재 관리자 비밀번호"
                            className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-slate-900"
                          />
                        </label>
                        <button
                          type="submit"
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                          참가자 삭제
                        </button>
                      </form>
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function WeeklyStatusBadge({ status }: { status: WeeklyListStatus }) {
  const className =
    status === "달성"
      ? "bg-emerald-100 text-emerald-800"
      : status === "미달"
        ? "bg-rose-100 text-rose-700"
        : status === "진행 전"
          ? "bg-slate-100 text-slate-700"
          : "bg-amber-100 text-amber-800";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}
