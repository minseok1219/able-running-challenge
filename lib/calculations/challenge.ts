import { allowLocalChallengeTesting } from "@/lib/config/runtime";
import { getTodayDateString } from "@/lib/utils/format";
import type {
  BadgeProgress,
  ChartPoint,
  ChallengeType,
  DashboardSummary,
  RecordRow,
  RecordStatus
} from "@/types/db";

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getChallengeResetDate(challenge: Pick<ChallengeType, "start_date">) {
  return addDays(challenge.start_date, -1);
}

export function shouldResetPreChallengeRecords(challenge: Pick<ChallengeType, "start_date">) {
  return getTodayDateString() >= getChallengeResetDate(challenge);
}

export function filterRecordsForActiveChallenge<T extends Pick<RecordRow, "run_date" | "status">>(
  records: T[],
  challenge: Pick<ChallengeType, "start_date">
) {
  if (!shouldResetPreChallengeRecords(challenge)) {
    return records;
  }

  return records.filter((record) => record.run_date >= challenge.start_date);
}

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

  const resetDate = getChallengeResetDate(challenge);
  const shouldEnforceChallengeWindow = getTodayDateString() >= resetDate;

  if (runDate > challenge.end_date) {
    return { status: "rejected", warningReason: "챌린지 기간 외 기록" };
  }

  if (shouldEnforceChallengeWindow && runDate < challenge.start_date) {
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
  const scopedRecords = filterRecordsForActiveChallenge(records, challenge);
  const approvedRecords = scopedRecords.filter((record) => record.status === "approved");
  const approvedDistanceM = approvedRecords.reduce((sum, record) => sum + record.distance_m, 0);
  const approvedCount = approvedRecords.length;
  const warningCount = scopedRecords.filter((record) => record.status === "warning").length;
  const rejectedCount = scopedRecords.filter((record) => record.status === "rejected").length;
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

export function buildDailyChartForChallenge(
  records: RecordRow[],
  challenge: Pick<ChallengeType, "start_date">
) {
  return buildDailyChart(filterRecordsForActiveChallenge(records, challenge) as RecordRow[]);
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

export function buildWeeklyChartForChallenge(
  records: RecordRow[],
  challenge: Pick<ChallengeType, "start_date">
) {
  return buildWeeklyChart(filterRecordsForActiveChallenge(records, challenge) as RecordRow[]);
}

function getApprovedRecordsForChallenge(
  records: RecordRow[],
  challenge: Pick<ChallengeType, "start_date">
) {
  return filterRecordsForActiveChallenge(records, challenge).filter((record) => record.status === "approved");
}

function getCumulativeUnlockDate(records: RecordRow[], targetDistanceM: number) {
  let total = 0;

  for (const record of records) {
    total += record.distance_m;
    if (total >= targetDistanceM) {
      return record.run_date;
    }
  }

  return null;
}

function getSevenDayStreakStatus(records: RecordRow[]) {
  const uniqueDates = [...new Set(records.map((record) => record.run_date))].sort((a, b) =>
    a.localeCompare(b)
  );

  let maxStreak = 0;
  let currentStreak = 0;
  let previousDate: string | null = null;
  let unlockedAt: string | null = null;

  for (const date of uniqueDates) {
    if (!previousDate) {
      currentStreak = 1;
    } else {
      const previous = new Date(`${previousDate}T00:00:00+09:00`);
      const current = new Date(`${date}T00:00:00+09:00`);
      const diffDays = Math.round((current.getTime() - previous.getTime()) / 86400000);
      currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
    }

    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    if (currentStreak >= 7 && !unlockedAt) {
      unlockedAt = date;
    }

    previousDate = date;
  }

  return {
    maxStreak,
    unlockedAt
  };
}

export function buildBadgeProgress(
  records: RecordRow[],
  challenge: Pick<ChallengeType, "name" | "target_distance_m" | "start_date">
): BadgeProgress[] {
  const approvedRecords = getApprovedRecordsForChallenge(records, challenge).sort((a, b) => {
    if (a.run_date === b.run_date) {
      return a.created_at.localeCompare(b.created_at);
    }

    return a.run_date.localeCompare(b.run_date);
  });
  const approvedDistanceM = approvedRecords.reduce((sum, record) => sum + record.distance_m, 0);
  const halfTargetDistanceM = Math.ceil(challenge.target_distance_m / 2);
  const streakStatus = getSevenDayStreakStatus(approvedRecords);
  const firstApprovedDate = approvedRecords[0]?.run_date ?? null;

  return [
    {
      code: "first_upload",
      name: "첫 업로드 완료",
      description: `${challenge.name} 첫 승인 기록을 등록했습니다.`,
      achieved: Boolean(firstApprovedDate),
      unlockedAt: firstApprovedDate,
      progressText: firstApprovedDate ? "획득 완료" : "첫 승인 기록 등록 전"
    },
    {
      code: "distance_10km",
      name: "첫 10km 달성",
      description: "승인 누적 거리 10km를 달성합니다.",
      achieved: approvedDistanceM >= 10000,
      unlockedAt: getCumulativeUnlockDate(approvedRecords, 10000),
      progressText: `${Math.min((approvedDistanceM / 1000), 10).toFixed(1)} / 10.0km`
    },
    {
      code: "distance_25km",
      name: "25km 달성",
      description: "승인 누적 거리 25km를 달성합니다.",
      achieved: approvedDistanceM >= 25000,
      unlockedAt: getCumulativeUnlockDate(approvedRecords, 25000),
      progressText: `${Math.min((approvedDistanceM / 1000), 25).toFixed(1)} / 25.0km`
    },
    {
      code: "distance_50km",
      name: "50km 달성",
      description: "승인 누적 거리 50km를 달성합니다.",
      achieved: approvedDistanceM >= 50000,
      unlockedAt: getCumulativeUnlockDate(approvedRecords, 50000),
      progressText: `${Math.min((approvedDistanceM / 1000), 50).toFixed(1)} / 50.0km`
    },
    {
      code: "streak_7days",
      name: "7일 연속 인증",
      description: "승인 기록으로 7일 연속 인증합니다.",
      achieved: streakStatus.maxStreak >= 7,
      unlockedAt: streakStatus.unlockedAt,
      progressText: `${Math.min(streakStatus.maxStreak, 7)} / 7일 연속`
    },
    {
      code: "half_finish",
      name: "절반 달성",
      description: `${challenge.name} 목표 거리의 절반을 달성합니다.`,
      achieved: approvedDistanceM >= halfTargetDistanceM,
      unlockedAt: getCumulativeUnlockDate(approvedRecords, halfTargetDistanceM),
      progressText: `${Math.min(approvedDistanceM / 1000, halfTargetDistanceM / 1000).toFixed(1)} / ${(halfTargetDistanceM / 1000).toFixed(1)}km`
    },
    {
      code: "challenge_finish",
      name: "완주 성공",
      description: `${challenge.name} 목표 거리를 완주합니다.`,
      achieved: approvedDistanceM >= challenge.target_distance_m,
      unlockedAt: getCumulativeUnlockDate(approvedRecords, challenge.target_distance_m),
      progressText: `${Math.min(approvedDistanceM / 1000, challenge.target_distance_m / 1000).toFixed(1)} / ${(challenge.target_distance_m / 1000).toFixed(1)}km`
    }
  ];
}
