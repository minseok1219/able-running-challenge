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
    <AppShell title="리더보드" description="승인 기록만 반영됩니다.">
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] bg-gradient-to-br from-ink via-slate-800 to-slate-700 p-6 text-white shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Leaderboard</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            지금 가장 앞서가고 있는 러너를 확인해보세요
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            진행률과 누적 승인 거리를 기준으로 순위가 정렬됩니다. 내 위치를 확인하고 다음 목표까지
            꾸준히 도전해보세요.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <LeaderboardSummaryCard label="전체 참가자" value={`${entries.length}명`} />
            <LeaderboardSummaryCard
              label="정렬 기준"
              value={sort === "progress" ? "진행률 순" : "누적 거리 순"}
            />
            <LeaderboardSummaryCard label="현재 범위" value={branchCode ? "지점별" : "전지점"} />
          </div>
        </div>
        <Panel title="필터" className="bg-gradient-to-br from-white via-slate-50 to-slate-50">
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
        <Panel title="상위 러너">
          <div className="grid gap-4 lg:grid-cols-3">
            {topThree.map((entry, index) => (
              <div
                key={entry.userId}
                className={`rounded-[30px] border p-5 shadow-sm ${
                  index === 0
                    ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50"
                    : index === 1
                      ? "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100"
                      : "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      #{index + 1}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{entry.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.participantCode} · {entry.branchName}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    {entry.challengeName}
                  </span>
                </div>
                <div className="mt-5 rounded-[24px] bg-white/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">진행률</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPercent(entry.progress)}</p>
                  <p className="mt-2 text-sm text-slate-600">{formatDistanceKm(entry.approvedDistanceM)} 누적</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
      <Panel title="전체 순위">
        {entries.length === 0 ? (
          <EmptyState title="표시할 참가자가 없습니다." description="필터 조건을 다시 확인해주세요." />
        ) : (
          <div className="grid gap-3">
            {entries.map((entry, index) => (
              <div
                key={entry.userId}
                className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-50 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                        #{index + 1}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {entry.challengeName}
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-slate-900">{entry.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.participantCode} · {entry.branchName} · {entry.challengeName}
                    </p>
                  </div>
                  <div className="grid min-w-[150px] gap-2 rounded-[24px] bg-white px-4 py-3 text-right shadow-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">진행률</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">{formatPercent(entry.progress)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">누적 거리</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {formatDistanceKm(entry.approvedDistanceM)}
                      </p>
                    </div>
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
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
