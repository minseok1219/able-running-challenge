import { DistanceCharts } from "@/components/charts";
import { ParticipantNav } from "@/components/navigation";
import { AppShell, ButtonLink, EmptyState, MetricCard, Panel, StatusBadge } from "@/components/ui";
import { requireRole, getCurrentUserRow } from "@/lib/auth/server";
import { buildDailyChart, buildWeeklyChart } from "@/lib/calculations/challenge";
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
        <DistanceCharts daily={buildDailyChart(records)} weekly={buildWeeklyChart(records)} />
      </Panel>
    </AppShell>
  );
}
