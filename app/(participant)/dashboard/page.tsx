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
  const lockedBadges = badgeProgress.filter((badge) => !badge.achieved);

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
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] bg-gradient-to-br from-ink via-slate-800 to-slate-700 p-6 text-white shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
            Challenge Summary
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm text-slate-200">현재 누적 승인 거리</p>
              <h2 className="mt-2 text-4xl font-semibold sm:text-5xl">
                {formatDistanceKm(summary.approvedDistanceM)}
              </h2>
              <p className="mt-3 text-sm text-slate-200">
                목표 {formatDistanceKm(user.challenge_types!.target_distance_m)} 중{" "}
                {formatPercent(summary.progress)} 진행 중입니다.
              </p>
            </div>
            <div className="rounded-[24px] bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-sm text-slate-200">남은 거리</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatDistanceKm(summary.remainingDistanceM)}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            label="오늘 기준 앞섬/뒤처짐"
            value={formatDelta(summary.deltaDistanceM)}
            hint="권장 누적 거리 대비 현재 위치"
          />
          <MetricCard
            label="기록 상태 요약"
            value={`${summary.approvedCount}건 승인`}
            hint={`경고 ${summary.warningCount}건 · 거절 ${summary.rejectedCount}건`}
          />
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="진행률" value={formatPercent(summary.progress)} />
        <MetricCard label="남은 거리" value={formatDistanceKm(summary.remainingDistanceM)} />
        <MetricCard label="누적 승인 수" value={String(summary.approvedCount)} />
      </div>
      <Panel title="상태 요약">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="승인" value={String(summary.approvedCount)} />
          <MetricCard label="경고" value={String(summary.warningCount)} />
          <MetricCard label="거절" value={String(summary.rejectedCount)} />
        </div>
      </Panel>
      <Panel
        title={`${user.challenge_types?.name ?? "챌린지"} 마일스톤 배지`}
        description="승인 기록 기준으로 배지 달성 여부와 다음 목표 진행 상태를 확인할 수 있습니다."
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
                : "첫 승인 기록을 남기면 첫 배지가 열립니다."}
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
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">획득한 배지</h3>
            <p className="text-xs font-medium text-slate-500">메달처럼 쌓이는 마일스톤 보상</p>
          </div>
          {earnedBadges.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {earnedBadges.map((badge, index) => (
                <div
                  key={badge.code}
                  className="relative overflow-hidden rounded-[30px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-panel"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-200/50 to-transparent" />
                  <div className="relative flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-gradient-to-br from-yellow-200 via-amber-100 to-orange-100 text-3xl text-amber-700 shadow-sm">
                      {index === 0 ? "🏅" : index === 1 ? "🥇" : "🏆"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{badge.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{badge.description}</p>
                        </div>
                        <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          획득 완료
                        </span>
                      </div>
                      <div className="mt-4 rounded-2xl bg-white/80 p-3">
                        <p className="text-sm font-medium text-slate-700">{badge.progressText}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          달성일 {formatDate(badge.unlockedAt!)}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          축하합니다. 이 마일스톤을 달성했습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-base font-semibold text-slate-900">아직 획득한 배지가 없습니다.</p>
              <p className="mt-2 text-sm text-slate-600">
                첫 승인 기록을 남기면 첫 메달이 열립니다.
              </p>
            </div>
          )}
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">다음 배지</h3>
            <p className="text-xs font-medium text-slate-500">남은 마일스톤 진행 상태</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lockedBadges.map((badge) => (
            <div
              key={badge.code}
              className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl text-slate-400">
                  ○
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{badge.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{badge.description}</p>
                    </div>
                    <span className="inline-flex whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      진행 중
                    </span>
                  </div>
                  <div className="mt-4 grid gap-1">
                    <p className="text-sm font-medium text-slate-700">{badge.progressText}</p>
                    <p className="text-xs text-slate-500">아직 달성 전</p>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
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
