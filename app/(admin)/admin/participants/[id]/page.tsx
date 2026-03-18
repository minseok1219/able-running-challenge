import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminNav } from "@/components/navigation";
import { AppShell, AlertMessage, EmptyState, Panel, StatusBadge } from "@/components/ui";
import { deleteParticipantAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth/server";
import { getAdminParticipantDetail } from "@/lib/supabase/queries";
import { formatDate, formatDistanceKm, formatPercent, formatPace } from "@/lib/utils/format";
import type { WeeklyProgressStatus } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function AdminParticipantDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole("admin", "/admin/login");
  const { id } = await params;
  const query = await searchParams;
  const participant = await getAdminParticipantDetail(id);

  if (!participant) {
    notFound();
  }

  return (
    <AppShell
      title="참가자 상세"
      description="참가자별 주차 달성 현황과 최근 기록을 함께 확인합니다."
      actions={<AdminNav />}
    >
      <AlertMessage message={query.error} />

      <Panel className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_58%),white]">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-2xl font-semibold text-slate-950 sm:text-3xl">{participant.name}</p>
              <WeeklyStatusBadge status={participant.currentWeekStatus} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              @{participant.username} · {participant.participantCode} · {participant.branchName}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">{participant.challengeName}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryMetric label="승인 누적 거리" value={formatDistanceKm(participant.approvedDistanceM)} />
              <SummaryMetric label="전체 진행률" value={formatPercent(participant.progress)} />
              <SummaryMetric label="달성 주차" value={`${participant.achievedWeeks} / ${participant.totalWeeks}`} />
              <SummaryMetric
                label="마지막 기록일"
                value={participant.lastRecordDate ? formatDate(participant.lastRecordDate) : "기록 없음"}
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold text-slate-900">관리자 빠른 이동</p>
            <div className="mt-4 grid gap-2">
              <Link
                href="/admin/participants"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              >
                참가자 목록으로
              </Link>
              <Link
                href="/admin/records"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              >
                기록 관리로
              </Link>
            </div>
            <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current Week</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{participant.currentWeekStatus}</p>
              <p className="mt-1 text-sm text-slate-600">
                이번 주 기준 달성 여부와 전체 주차 진행 현황을 아래 표에서 확인할 수 있습니다.
              </p>
            </div>

            <div className="mt-4 rounded-[20px] border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-sm font-semibold text-rose-700">참가자 삭제</p>
              <p className="mt-2 text-sm text-rose-700">
                잘못 가입한 참가자를 정리할 때만 사용해 주세요. 삭제 시 참가자 계정과 기록이 함께 제거됩니다.
              </p>
              <form action={deleteParticipantAction} className="mt-4 grid gap-3">
                <input type="hidden" name="user_id" value={participant.id} />
                <input type="hidden" name="return_to" value={`/admin/participants/${participant.id}`} />
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
        </div>
      </Panel>

      <Panel title="주차별 달성 현황" description="approved 기록만 합산하여 각 주차 기준 거리 충족 여부를 판단합니다.">
        <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 lg:block">
          <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">주차</th>
                <th className="px-4 py-3 font-semibold">기간</th>
                <th className="px-4 py-3 font-semibold">기준 거리</th>
                <th className="px-4 py-3 font-semibold">실제 누적 거리</th>
                <th className="px-4 py-3 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participant.weeklyProgress.map((week) => (
                <tr key={week.weekNumber} className="align-top">
                  <td className="px-4 py-4 font-semibold text-slate-900">{week.label}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDate(week.startDate)} ~ {formatDate(week.endDate)}
                  </td>
                  <td className="px-4 py-4 text-slate-900">{formatDistanceKm(week.targetDistanceM)}</td>
                  <td className="px-4 py-4 text-slate-900">{formatDistanceKm(week.actualDistanceM)}</td>
                  <td className="px-4 py-4">
                    <WeeklyProgressBadge status={week.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 lg:hidden">
          {participant.weeklyProgress.map((week) => (
            <article key={week.weekNumber} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-950">{week.label}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(week.startDate)} ~ {formatDate(week.endDate)}
                  </p>
                </div>
                <WeeklyProgressBadge status={week.status} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SummaryMetric label="기준 거리" value={formatDistanceKm(week.targetDistanceM)} compact />
                <SummaryMetric label="실제 누적 거리" value={formatDistanceKm(week.actualDistanceM)} compact />
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="최근 기록" description="최근 입력 기록을 빠르게 확인할 수 있습니다.">
        {participant.recentRecords.length === 0 ? (
          <EmptyState title="최근 기록이 없습니다." description="참가자가 기록을 업로드하면 여기에 표시됩니다." />
        ) : (
          <div className="grid gap-3">
            {participant.recentRecords.map((record) => (
              <div key={record.id} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(record.run_date)}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDistanceKm(record.distance_m)} · {formatPace(record.pace_sec_per_km)}/km
                    </p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
                {record.warning_reason ? (
                  <p className="mt-3 text-sm text-amber-700">사유: {record.warning_reason}</p>
                ) : record.note ? (
                  <p className="mt-3 text-sm text-slate-600">메모: {record.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}

function SummaryMetric({
  label,
  value,
  compact = false
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[20px] border border-slate-200 bg-white ${compact ? "px-3 py-3" : "px-4 py-4"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-2 font-semibold text-slate-950 ${compact ? "text-base" : "text-lg sm:text-2xl"}`}>{value}</p>
    </div>
  );
}

function WeeklyStatusBadge({ status }: { status: "달성" | "미달" | "진행 전" | "기간 종료" }) {
  const className =
    status === "달성"
      ? "bg-emerald-100 text-emerald-800"
      : status === "미달"
        ? "bg-rose-100 text-rose-700"
        : status === "진행 전"
          ? "bg-slate-100 text-slate-700"
          : "bg-amber-100 text-amber-800";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

function WeeklyProgressBadge({ status }: { status: WeeklyProgressStatus }) {
  const className =
    status === "달성"
      ? "bg-emerald-100 text-emerald-800"
      : status === "미달"
        ? "bg-rose-100 text-rose-700"
        : status === "진행 중"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}
