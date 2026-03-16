import { DistanceCharts } from "@/components/charts";
import { ParticipantNav } from "@/components/navigation";
import { AppShell, ButtonLink, EmptyState, MetricCard, Panel, StatusBadge } from "@/components/ui";
import { requireRole, getCurrentUserRow } from "@/lib/auth/server";
import {
  buildBadgeProgress,
  buildDailyChartForChallenge,
  buildWeeklyChartForChallenge
} from "@/lib/calculations/challenge";
import { getParticipantDashboard } from "@/lib/supabase/queries";
import {
  formatDate,
  formatDelta,
  formatDistanceKm,
  formatPercent,
  formatPace
} from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireRole("participant", "/login");
  const user = await getCurrentUserRow(session);
  const { summary, records, recentRecords } = await getParticipantDashboard(user);
  const badgeProgress = buildBadgeProgress(records, user.challenge_types!);
  const earnedBadges = badgeProgress.filter((badge) => badge.achieved);
  const nextBadge = badgeProgress.find((badge) => !badge.achieved) ?? null;
  const latestEarnedBadge = [...earnedBadges].reverse()[0] ?? null;

  return (
    <AppShell
      title={`${user.name} 님 대시보드`}
      description={`@${user.username ?? "-"} · ${user.participant_code} · ${user.branches?.name ?? "-"} · ${user.challenge_types?.name ?? "-"}`}
      actions={
        <>
          <ParticipantNav />
          <ButtonLink href="/records/new">기록 입력</ButtonLink>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="누적 거리" value={formatDistanceKm(summary.approvedDistanceM)} />
        <MetricCard label="진행률" value={formatPercent(summary.progress)} />
        <MetricCard label="남은 거리" value={formatDistanceKm(summary.remainingDistanceM)} />
        <MetricCard label="오늘 기준 앞섬/뒤처짐" value={formatDelta(summary.deltaDistanceM)} />
      </div>
      <Panel title="상태 요약">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="approved" value={String(summary.approvedCount)} />
          <MetricCard label="warning" value={String(summary.warningCount)} />
          <MetricCard label="rejected" value={String(summary.rejectedCount)} />
        </div>
      </Panel>
      <Panel
        title={`${user.challenge_types?.name ?? "챌린지"} 마일스톤 배지`}
        description="approved 기록 기준으로 배지 달성 여부와 다음 목표 진행 상태를 확인할 수 있습니다."
      >
        <div className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-gradient-to-br from-amber-100 via-orange-50 to-white p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Badge Progress
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900">
              {earnedBadges.length} / {badgeProgress.length} 배지 획득
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              {latestEarnedBadge
                ? `${latestEarnedBadge.name} 배지를 획득했습니다. 다음 목표도 이어서 도전해보세요.`
                : "첫 approved 기록을 남기면 첫 배지가 열립니다."}
            </p>
            {latestEarnedBadge?.unlockedAt ? (
              <p className="mt-3 text-xs font-medium text-amber-800">
                최근 획득: {latestEarnedBadge.name} · {formatDate(latestEarnedBadge.unlockedAt)}
              </p>
            ) : null}
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Next Milestone
            </p>
            {nextBadge ? (
              <>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">{nextBadge.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{nextBadge.description}</p>
                <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                  {nextBadge.progressText}
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">모든 배지 달성 완료</h3>
                <p className="mt-2 text-sm text-slate-600">
                  이번 챌린지 마일스톤을 모두 채웠습니다. 정말 멋진 완주입니다.
                </p>
              </>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {badgeProgress.map((badge) => (
            <div
              key={badge.code}
              className={`rounded-[28px] border p-5 shadow-sm transition-transform ${
                badge.achieved
                  ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-2xl ${
                    badge.achieved
                      ? "border-amber-300 bg-amber-100 text-amber-700"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {badge.achieved ? "★" : "○"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{badge.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{badge.description}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        badge.achieved
                          ? "bg-amber-100 text-amber-800"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {badge.achieved ? "획득" : "진행 중"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-1">
                    <p className="text-sm font-medium text-slate-700">{badge.progressText}</p>
                    <p className="text-xs text-slate-500">
                      {badge.unlockedAt
                        ? `달성일 ${formatDate(badge.unlockedAt)}`
                        : "아직 달성 전"}
                    </p>
                    {badge.achieved ? (
                      <p className="text-xs font-semibold text-amber-700">
                        축하합니다. 이 마일스톤을 달성했습니다.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="최근 기록">
        {recentRecords.length === 0 ? (
          <EmptyState title="아직 입력된 기록이 없습니다." description="첫 기록을 등록해보세요." />
        ) : (
          <div className="grid gap-3">
            {recentRecords.map((record) => (
              <div key={record.id} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{formatDate(record.run_date)}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDistanceKm(record.distance_m)} · {formatPace(record.pace_sec_per_km)}/km
                    </p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="차트">
        <DistanceCharts
          daily={buildDailyChartForChallenge(records, user.challenge_types!)}
          weekly={buildWeeklyChartForChallenge(records, user.challenge_types!)}
        />
      </Panel>
    </AppShell>
  );
}
