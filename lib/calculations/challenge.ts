import { allowLocalChallengeTesting } from "@/lib/config/runtime";
import { getTodayDateString } from "@/lib/utils/format";
import type { ChartPoint, ChallengeType, DashboardSummary, RecordRow, RecordStatus } from "@/types/db";

export function evaluateRecordStatus({
  runDate,
  distanceM,
  paceSecPerKm,
  dailyDistanceM,
  challenge
}: {
  runDate: string;
  distanceM: number;
  paceSecPerKm: number;
  dailyDistanceM: number;
  challenge: Pick<ChallengeType, "start_date" | "end_date">;
}): { status: RecordStatus; warningReason: string | null } {
  const today = allowLocalChallengeTesting() ? challenge.end_date : getTodayDateString();

  if (distanceM < 2000) {
    return { status: "rejected", warningReason: "최소 인정 거리 2km 미만" };
  }

  if (paceSecPerKm > 540) {
    return { status: "rejected", warningReason: "평균 페이스가 9:00/km를 초과" };
  }

  if (runDate > today) {
    return { status: "rejected", warningReason: "미래 날짜 기록" };
  }

  if (runDate < challenge.start_date || runDate > challenge.end_date) {
    return { status: "rejected", warningReason: "챌린지 기간 외 기록" };
  }

  if (paceSecPerKm <= 180) {
    return { status: "warning", warningReason: "평균 페이스가 3:00/km 이하" };
  }

  if (dailyDistanceM > 30000) {
    return { status: "warning", warningReason: "하루 누적 입력 거리가 30km 초과" };
  }

  return { status: "approved", warningReason: null };
}

export function calculateDashboardSummary(
  records: RecordRow[],
  challenge: Pick<ChallengeType, "target_distance_m" | "start_date" | "end_date">
): DashboardSummary {
  const approvedRecords = records.filter((record) => record.status === "approved");
  const approvedDistanceM = approvedRecords.reduce((sum, record) => sum + record.distance_m, 0);
  const approvedCount = approvedRecords.length;
  const warningCount = records.filter((record) => record.status === "warning").length;
  const rejectedCount = records.filter((record) => record.status === "rejected").length;
  const progress = approvedDistanceM / challenge.target_distance_m;
  const remainingDistanceM = Math.max(0, challenge.target_distance_m - approvedDistanceM);

  const challengeStart = new Date(`${challenge.start_date}T00:00:00+09:00`);
  const challengeEnd = new Date(`${challenge.end_date}T00:00:00+09:00`);
  const now = new Date();
  const totalDays = Math.max(
    1,
    Math.floor((challengeEnd.getTime() - challengeStart.getTime()) / 86400000) + 1
  );
  const elapsedDays = Math.min(
    totalDays,
    Math.max(0, Math.floor((now.getTime() - challengeStart.getTime()) / 86400000) + 1)
  );
  const recommendedDistanceM = Math.round((challenge.target_distance_m * elapsedDays) / totalDays);
  const deltaDistanceM = approvedDistanceM - recommendedDistanceM;

  return {
    approvedDistanceM,
    progress,
    remainingDistanceM,
    recommendedDistanceM,
    deltaDistanceM,
    approvedCount,
    warningCount,
    rejectedCount
  };
}

export function buildDailyChart(records: RecordRow[]): ChartPoint[] {
  const map = new Map<string, number>();

  records
    .filter((record) => record.status === "approved")
    .forEach((record) => {
      map.set(record.run_date, (map.get(record.run_date) ?? 0) + record.distance_m);
    });

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, distance]) => ({ label, distanceKm: Number((distance / 1000).toFixed(1)) }));
}

export function buildWeeklyChart(records: RecordRow[]): ChartPoint[] {
  const map = new Map<string, number>();

  records
    .filter((record) => record.status === "approved")
    .forEach((record) => {
      const date = new Date(record.run_date);
      const day = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() - day + 1);
      const monday = date.toISOString().slice(0, 10);
      map.set(monday, (map.get(monday) ?? 0) + record.distance_m);
    });

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, distance]) => ({ label, distanceKm: Number((distance / 1000).toFixed(1)) }));
}
