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

  return (
    <AppShell title="리더보드" description="승인 기록만 반영됩니다.">
      {!hasSupabaseEnv() ? <SetupNotice /> : null}
      <Panel title="필터">
        <form className="grid gap-3 sm:grid-cols-3">
          <select
            name="branch"
            defaultValue={branchCode ?? ""}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <option value="">전지점</option>
            {setup.branches.map((branch) => (
              <option key={branch.id} value={branch.code}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <option value="progress">진행률 순</option>
            <option value="distance">누적 거리 순</option>
          </select>
          <button className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white">
            적용
          </button>
        </form>
      </Panel>
      <Panel title="순위">
        {entries.length === 0 ? (
          <EmptyState title="표시할 참가자가 없습니다." description="필터 조건을 다시 확인해주세요." />
        ) : (
          <div className="grid gap-3">
            {entries.map((entry, index) => (
              <div key={entry.userId} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">#{index + 1}</p>
                    <p className="mt-1 text-lg font-semibold">{entry.name}</p>
                    <p className="text-sm text-slate-600">
                      {entry.participantCode} · {entry.branchName} · {entry.challengeName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatPercent(entry.progress)}</p>
                    <p className="text-sm text-slate-600">
                      {formatDistanceKm(entry.approvedDistanceM)}
                    </p>
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
