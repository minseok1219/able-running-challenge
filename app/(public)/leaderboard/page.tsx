import { SetupNotice } from "@/components/setup-notice";
import { AppShell, EmptyState, Panel } from "@/components/ui";
import { hasSupabaseEnv } from "@/lib/config/runtime";
import { formatDistanceKm, formatPercent } from "@/lib/utils/format";
import { getLeaderboard, getPublicSetupData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<{ branch?: string; sort?: "progress" | "distance" }>;
}) {
  const params = await searchParams;
  const branchCode = params.branch;
  const sort = params.sort === "distance" ? "distance" : "progress";
  const [setup, entries] = await Promise.all([
    getPublicSetupData(),
    getLeaderboard({ branchCode, sortBy: sort })
  ]);
  const topThree = entries.slice(0, 3);

  return (
    <AppShell hideHeader>
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[26px] bg-gradient-to-br from-ink via-slate-800 to-slate-700 p-5 text-white shadow-panel sm:rounded-[30px] sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200 sm:text-xs sm:tracking-[0.18em]">
            Leaderboard
          </p>
          <h1 className="mt-3 text-[2.15rem] font-semibold leading-none tracking-[0.02em] text-white sm:text-[3.3rem]">
            LEADERBOARD
          </h1>
          <p className="mt-3 text-base font-medium text-slate-200">
            승인 기록만 반영됩니다.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-[15px]">
            진행률과 누적 승인 거리를 기준으로 순위가 정렬됩니다.
            <br />
            내 위치를 확인하고 다음 목표까지 꾸준히 도전해보세요.
          </p>
          <div className="mt-5 max-w-[220px] sm:max-w-[240px]">
            <LeaderboardSummaryCard label="전체 참가자" value={`${entries.length}명`} />
          </div>
        </div>
        <Panel
          title="필터"
          description="지점과 정렬 기준을 바꿔 원하는 순위를 빠르게 확인할 수 있습니다."
          className="bg-gradient-to-br from-white via-slate-50 to-slate-50"
        >
          <form className="grid gap-3">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <span>지점 선택</span>
              <select
                name="branch"
                defaultValue={branchCode ?? ""}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <option value="">전지점</option>
                {setup.branches.map((branch) => (
                  <option key={branch.id} value={branch.code}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <span>정렬 방식</span>
              <select
                name="sort"
                defaultValue={sort}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <option value="progress">진행률 순</option>
                <option value="distance">누적 거리 순</option>
              </select>
            </label>
            <button className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
              필터 적용
            </button>
          </form>
        </Panel>
      </section>
      {topThree.length > 0 ? (
        <Panel
          title="상위 러너"
          description={
            <>
              현재 가장 앞선 러너를 빠르게 확인할 수 있습니다.
              <br />
              챌린지는 기록경쟁이 아니니 참고용으로 보시면 좋습니다.
            </>
          }
        >
          <div className="grid gap-2.5 lg:grid-cols-3">
            {topThree.map((entry, index) => (
              <div
                key={entry.userId}
                className={`rounded-[20px] border p-3 shadow-sm sm:rounded-[22px] sm:p-3.5 ${
                  index === 0
                    ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50"
                    : index === 1
                      ? "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100"
                      : "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2 text-slate-900">
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                        #{index + 1}
                      </span>
                      <p className="truncate text-base font-semibold tracking-tight sm:text-[1.05rem]">
                        {entry.name}
                      </p>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {entry.participantCode} · {entry.branchName}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                    {entry.challengeName}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/70 pt-2.5 text-sm">
                  <InlineMetric label="진행률" value={formatPercent(entry.progress)} compact />
                  <InlineMetric label="누적 거리" value={formatDistanceKm(entry.approvedDistanceM)} compact />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
      <Panel title="전체 참가자 정보">
        {entries.length === 0 ? (
          <EmptyState title="표시할 참가자가 없습니다." description="필터 조건을 다시 확인해주세요." />
        ) : (
          <div className="grid gap-2.5">
            {entries.map((entry, index) => (
              <div
                key={entry.userId}
                className="rounded-[18px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-50 p-3 shadow-sm sm:rounded-[20px] sm:p-3.5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                        #{index + 1}
                      </span>
                      <p className="truncate text-base font-semibold leading-tight text-slate-900 sm:text-lg">
                        {entry.name}
                      </p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        {entry.challengeName}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {entry.participantCode} · {entry.branchName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700 sm:justify-end">
                    <InlineMetric label="진행률" value={formatPercent(entry.progress)} compact />
                    <InlineMetric label="누적 거리" value={formatDistanceKm(entry.approvedDistanceM)} compact />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

function LeaderboardSummaryCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  const numericValue = value.replace("명", "");

  return (
    <div className="rounded-[22px] border border-white/10 bg-gradient-to-br from-white/16 to-white/8 px-5 py-4 backdrop-blur sm:rounded-[24px] sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 sm:text-xs">{label}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">현재 리더보드 집계 인원</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-100">
          live
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <p className="text-[3.15rem] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[3.9rem]">
          {numericValue}
        </p>
        <span className="pb-1 text-lg font-semibold text-slate-200 sm:text-xl">명</span>
      </div>
    </div>
  );
}

function InlineMetric({
  label,
  value,
  compact = false
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          compact
            ? "text-[12px] font-medium text-slate-500"
            : "text-[13px] font-medium text-slate-500"
        }
      >
        {label}
      </span>
      <span
        className={
          compact
            ? "text-sm font-semibold tracking-tight text-slate-900 sm:text-[15px]"
            : "text-[1.05rem] font-semibold tracking-tight text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
