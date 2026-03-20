import type { ReactNode } from "react";

import { DistanceCharts } from "@/components/charts";
import { ParticipantNav } from "@/components/navigation";
import { AppShell, ButtonLink, EmptyState, Panel, StatusBadge } from "@/components/ui";
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
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-ink via-slate-800 to-slate-700 p-6 text-white shadow-panel">
          <div className="flex flex-wrap gap-2">
            <DashboardChip>{user.branches?.name ?? "-"}</DashboardChip>
            <DashboardChip>{user.challenge_types?.name ?? "-"}</DashboardChip>
            <DashboardChip>{user.participant_code ?? "-"}</DashboardChip>
          </div>
          <div className="mt-5 grid gap-5">
            <div>
              <p className="text-sm font-medium text-slate-200">지금까지 승인된 누적 거리</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {formatDistanceKm(summary.approvedDistanceM)}
                </h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-orange-100">
                  {formatPercent(summary.progress)} 진행
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                목표 {formatDistanceKm(user.challenge_types!.target_distance_m)}까지{" "}
                {formatDistanceKm(summary.remainingDistanceM)} 남았습니다.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                <span>Progress</span>
                <span>{formatPercent(summary.progress)}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-300 via-orange-400 to-amber-300"
                  style={{ width: `${Math.min(summary.progress * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HighlightStat
                label="오늘 기준"
                value={formatDelta(summary.deltaDistanceM)}
                hint="권장 거리 대비"
              />
              <HighlightStat
                label="승인 기록"
                value={`${summary.approvedCount}건`}
                hint="누적 반영 기준"
              />
              <HighlightStat
                label="남은 거리"
                value={formatDistanceKm(summary.remainingDistanceM)}
                hint="완주까지"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Next Target</p>
            <h3 className="mt-3 text-2xl font-semibold text-ink">
              {nextBadge ? nextBadge.name : "모든 배지 달성 완료"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {nextBadge
                ? nextBadge.description
                : "현재 챌린지의 모든 마일스톤을 달성했습니다. 정말 멋진 완주입니다."}
            </p>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                {nextBadge ? nextBadge.progressText : "모든 배지가 열렸습니다."}
              </p>
            </div>
            {latestEarnedBadge?.unlockedAt ? (
              <p className="mt-4 text-xs font-medium text-slate-500">
                최근 획득: {latestEarnedBadge.name} · {formatDate(latestEarnedBadge.unlockedAt)}
              </p>
            ) : null}
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Record Status</p>
                <h3 className="mt-2 text-xl font-semibold text-ink">러닝 인증 상태</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                최근 입력 {summary.approvedCount + summary.warningCount + summary.rejectedCount}건
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              <StatusSummaryRow
                label="승인"
                count={summary.approvedCount}
                tone="approved"
                description="누적 거리와 리더보드에 반영"
              />
              <StatusSummaryRow
                label="경고"
                count={summary.warningCount}
                tone="warning"
                description="이상 기록 의심으로 검토 필요"
              />
              <StatusSummaryRow
                label="거절"
                count={summary.rejectedCount}
                tone="rejected"
                description="기록 인정 불가"
              />
            </div>
          </div>
        </div>
      </section>
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
                ? latestEarnedBadge.message
                : "첫 승인 기록을 남기면 첫 배지가 열립니다."}
            </p>
            {latestEarnedBadge?.unlockedAt ? (
              <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <BadgeCategoryChip category={latestEarnedBadge.category} tone="earned" />
                  <p className="text-sm font-semibold text-slate-900">{latestEarnedBadge.name}</p>
                </div>
                <p className="mt-2 text-xs font-medium text-amber-800">
                  최근 획득 · {formatDate(latestEarnedBadge.unlockedAt)}
                </p>
                {latestEarnedBadge.nextHint ? (
                  <p className="mt-2 text-xs leading-5 text-slate-600">{latestEarnedBadge.nextHint}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Next Milestone
            </p>
            {nextBadge ? (
              <>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">{nextBadge.name}</h3>
                <div className="mt-3">
                  <BadgeCategoryChip category={nextBadge.category} tone="locked" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{nextBadge.description}</p>
                <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                  {nextBadge.progressText}
                </p>
                {nextBadge.nextHint ? (
                  <p className="mt-3 text-sm leading-6 text-slate-700">{nextBadge.nextHint}</p>
                ) : null}
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
                      {getBadgeIcon(badge.category, true, index)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <BadgeCategoryChip category={badge.category} tone="earned" />
                          <p className="font-semibold text-slate-900">{badge.name}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{badge.message}</p>
                        </div>
                        <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          획득 완료
                        </span>
                      </div>
                      <div className="mt-4 rounded-2xl bg-white/80 p-3">
                        <p className="text-sm font-medium text-slate-700">{badge.description}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          달성일 {formatDate(badge.unlockedAt!)}
                        </p>
                        {badge.nextHint ? (
                          <p className="mt-2 text-xs font-semibold leading-5 text-amber-700">
                            {badge.nextHint}
                          </p>
                        ) : null}
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
                  {getBadgeIcon(badge.category, false)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <BadgeCategoryChip category={badge.category} tone="locked" />
                      <p className="font-semibold">{badge.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{badge.description}</p>
                    </div>
                    <span className="inline-flex whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      진행 중
                    </span>
                  </div>
                  <div className="mt-4 grid gap-1">
                    <p className="text-sm font-medium text-slate-700">{badge.progressText}</p>
                    {badge.nextHint ? (
                      <p className="text-xs leading-5 text-slate-500">{badge.nextHint}</p>
                    ) : (
                      <p className="text-xs text-slate-500">아직 달성 전</p>
                    )}
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
          <div className="grid gap-3 md:grid-cols-2">
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-50 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Recent Record</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(record.run_date)}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDistanceKm(record.distance_m)} · {formatPace(record.pace_sec_per_km)}/km
                    </p>
                    {record.note ? <p className="mt-3 text-sm leading-6 text-slate-600">메모: {record.note}</p> : null}
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

function DashboardChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 backdrop-blur">
      {children}
    </span>
  );
}

function HighlightStat({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-300">{hint}</p>
    </div>
  );
}

function StatusSummaryRow({
  label,
  count,
  tone,
  description
}: {
  label: string;
  count: number;
  tone: "approved" | "warning" | "rejected";
  description: string;
}) {
  const toneClassName =
    tone === "approved"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-rose-50 border-rose-200 text-rose-700";

  return (
    <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-bold ${toneClassName}`}>
        {count}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900">{label}</p>
          <span className="text-xs font-medium text-slate-500">{count}건</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function BadgeCategoryChip({
  category,
  tone
}: {
  category: string;
  tone: "earned" | "locked";
}) {
  return (
    <span
      className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${
        tone === "earned" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
      }`}
    >
      {category}
    </span>
  );
}

function getBadgeIcon(category: string, earned: boolean, index = 0) {
  if (!earned) {
    switch (category) {
      case "시작 배지":
        return "◎";
      case "누적 거리 배지":
        return "◌";
      case "주차 미션 배지":
        return "◐";
      case "꾸준함 배지":
        return "◒";
      case "에이블 스타일 배지":
        return "◍";
      default:
        return "○";
    }
  }

  if (index === 0) {
    return "🏅";
  }

  switch (category) {
    case "시작 배지":
      return "🚀";
    case "누적 거리 배지":
      return "🏁";
    case "주차 미션 배지":
      return "📆";
    case "꾸준함 배지":
      return "🔥";
    case "에이블 스타일 배지":
      return "🛡️";
    default:
      return "🏆";
  }
}
