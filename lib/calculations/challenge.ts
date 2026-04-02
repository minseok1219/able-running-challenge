import { allowLocalChallengeTesting } from "@/lib/config/runtime";
import { getBadgeDefinition, getBadgeOrder, pickRandomBadgeMessage } from "@/lib/calculations/badges";
import { getTodayDateString } from "@/lib/utils/format";
import type {
  AdminWeeklyProgressItem,
  AdminParticipantDetail,
  AdminParticipantSummary,
  BadgeCode,
  BadgeProgress,
  ChartPoint,
  ChallengeType,
  DashboardSummary,
  RecordRow,
  RecordStatus,
  WeeklyChallengeRule,
  WeeklyListStatus,
  WeeklyProgressItem,
  WeeklyProgressSummary
} from "@/types/db";

const KOREA_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00+09:00`);
  date.setDate(date.getDate() + days);
  return KOREA_DATE_FORMATTER.format(date);
}

const WEEKLY_RULES: Record<string, WeeklyChallengeRule[]> = {
  "100km": [
    { weekNumber: 1, label: "1주차", startDate: "2026-03-23", endDate: "2026-03-29", targetDistanceM: 15000 },
    { weekNumber: 2, label: "2주차", startDate: "2026-03-30", endDate: "2026-04-05", targetDistanceM: 20000 },
    { weekNumber: 3, label: "3주차", startDate: "2026-04-06", endDate: "2026-04-12", targetDistanceM: 20000 },
    { weekNumber: 4, label: "4주차", startDate: "2026-04-13", endDate: "2026-04-19", targetDistanceM: 20000 },
    { weekNumber: 5, label: "5주차", startDate: "2026-04-20", endDate: "2026-04-26", targetDistanceM: 25000 }
  ],
  "160km": [
    { weekNumber: 1, label: "1주차", startDate: "2026-03-23", endDate: "2026-03-29", targetDistanceM: 15000 },
    { weekNumber: 2, label: "2주차", startDate: "2026-03-30", endDate: "2026-04-05", targetDistanceM: 20000 },
    { weekNumber: 3, label: "3주차", startDate: "2026-04-06", endDate: "2026-04-12", targetDistanceM: 20000 },
    { weekNumber: 4, label: "4주차", startDate: "2026-04-13", endDate: "2026-04-19", targetDistanceM: 20000 },
    { weekNumber: 5, label: "5주차", startDate: "2026-04-20", endDate: "2026-04-26", targetDistanceM: 20000 },
    { weekNumber: 6, label: "6주차", startDate: "2026-04-27", endDate: "2026-05-03", targetDistanceM: 20000 },
    { weekNumber: 7, label: "7주차", startDate: "2026-05-04", endDate: "2026-05-10", targetDistanceM: 20000 },
    { weekNumber: 8, label: "8주차", startDate: "2026-05-11", endDate: "2026-05-16", targetDistanceM: 25000 }
  ]
};

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

export function getWeeklyChallengeRules(challengeCode: string) {
  return WEEKLY_RULES[challengeCode] ?? [];
}

function sumApprovedDistanceInRange(
  records: Pick<RecordRow, "run_date" | "status" | "distance_m">[],
  startDate: string,
  endDate: string
) {
  return records.reduce((sum, record) => {
    if (record.status !== "approved") {
      return sum;
    }

    if (record.run_date < startDate || record.run_date > endDate) {
      return sum;
    }

    return sum + record.distance_m;
  }, 0);
}

function getWeeklyProgressStatus(rule: WeeklyChallengeRule, actualDistanceM: number, today: string): WeeklyProgressItem["status"] {
  if (today < rule.startDate) {
    return "예정";
  }

  if (actualDistanceM >= rule.targetDistanceM) {
    return "달성";
  }

  if (today <= rule.endDate) {
    return "진행 중";
  }

  return "미달";
}

function getCurrentWeekListStatus(rules: WeeklyChallengeRule[], today: string, items: WeeklyProgressItem[]): WeeklyListStatus {
  if (rules.length === 0) {
    return "기간 종료";
  }

  if (today < rules[0].startDate) {
    return "진행 전";
  }

  const activeWeek = items.find((item) => item.startDate <= today && item.endDate >= today);
  if (activeWeek) {
    return activeWeek.achieved ? "달성" : "미달";
  }

  return "기간 종료";
}

export function calculateWeeklyProgress(
  records: Pick<RecordRow, "run_date" | "status" | "distance_m">[],
  challenge: Pick<ChallengeType, "code" | "start_date">
): WeeklyProgressSummary {
  const rules = getWeeklyChallengeRules(challenge.code);
  const scopedRecords = filterRecordsForActiveChallenge(records, challenge);
  const today = getTodayDateString();

  const items = rules.map((rule) => {
    const actualDistanceM = sumApprovedDistanceInRange(scopedRecords, rule.startDate, rule.endDate);
    const achieved = actualDistanceM >= rule.targetDistanceM;

    return {
      weekNumber: rule.weekNumber,
      label: rule.label,
      startDate: rule.startDate,
      endDate: rule.endDate,
      targetDistanceM: rule.targetDistanceM,
      actualDistanceM,
      achieved,
      status: getWeeklyProgressStatus(rule, actualDistanceM, today)
    } satisfies WeeklyProgressItem;
  });

  return {
    totalWeeks: items.length,
    achievedWeeks: items.filter((item) => item.achieved).length,
    currentWeekStatus: getCurrentWeekListStatus(rules, today, items),
    currentWeekNumber: items.find((item) => item.startDate <= today && item.endDate >= today)?.weekNumber ?? null,
    items
  };
}

export function buildAdminParticipantWeeklySummary(args: {
  records: RecordRow[];
  challenge: Pick<ChallengeType, "code" | "start_date" | "target_distance_m" | "name">;
  participant: Pick<AdminParticipantSummary, "id" | "name" | "username" | "participantCode" | "isActive" | "branchName" | "branchCode" | "challengeName" | "challengeCode">;
}) {
  const approvedDistanceM = filterRecordsForActiveChallenge(args.records, args.challenge)
    .filter((record) => record.status === "approved")
    .reduce((sum, record) => sum + record.distance_m, 0);
  const weeklyProgress = calculateWeeklyProgress(args.records, args.challenge);

  return {
    ...args.participant,
    approvedDistanceM,
    progress: approvedDistanceM / Math.max(1, args.challenge.target_distance_m),
    warningCount: filterRecordsForActiveChallenge(args.records, args.challenge).filter((record) => record.status === "warning").length,
    achievedWeeks: weeklyProgress.achievedWeeks,
    totalWeeks: weeklyProgress.totalWeeks,
    currentWeekStatus: weeklyProgress.currentWeekStatus
  } satisfies AdminParticipantSummary;
}

export function buildAdminParticipantDetail(args: {
  records: RecordRow[];
  challenge: Pick<ChallengeType, "code" | "start_date" | "target_distance_m">;
  participant: Omit<
    AdminParticipantDetail,
    "approvedDistanceM" | "progress" | "achievedWeeks" | "totalWeeks" | "lastRecordDate" | "recentRecords" | "weeklyProgress" | "currentWeekStatus"
  >;
}) {
  const scopedRecords = filterRecordsForActiveChallenge(args.records, args.challenge);
  const approvedDistanceM = scopedRecords
    .filter((record) => record.status === "approved")
    .reduce((sum, record) => sum + record.distance_m, 0);
  const weeklyProgress = calculateWeeklyProgress(args.records, args.challenge);
  const weeklyProgressWithRecords = weeklyProgress.items.map((week) => {
    const weekRecords = [...scopedRecords]
      .filter((record) => record.run_date >= week.startDate && record.run_date <= week.endDate)
      .sort((a, b) => {
        if (a.run_date === b.run_date) {
          return b.created_at.localeCompare(a.created_at);
        }

        return b.run_date.localeCompare(a.run_date);
      });

    return {
      ...week,
      records: weekRecords,
      recordCount: weekRecords.length,
      approvedRecordCount: weekRecords.filter((record) => record.status === "approved").length,
      warningRecordCount: weekRecords.filter((record) => record.status === "warning").length,
      rejectedRecordCount: weekRecords.filter((record) => record.status === "rejected").length
    } satisfies AdminWeeklyProgressItem;
  });
  const recentRecords = [...scopedRecords].sort((a, b) => {
    if (a.run_date === b.run_date) {
      return b.created_at.localeCompare(a.created_at);
    }

    return b.run_date.localeCompare(a.run_date);
  }).slice(0, 8);

  return {
    ...args.participant,
    approvedDistanceM,
    progress: approvedDistanceM / Math.max(1, args.challenge.target_distance_m),
    achievedWeeks: weeklyProgress.achievedWeeks,
    totalWeeks: weeklyProgress.totalWeeks,
    currentWeekStatus: weeklyProgress.currentWeekStatus,
    lastRecordDate: recentRecords[0]?.run_date ?? null,
    recentRecords,
    weeklyProgress: weeklyProgressWithRecords
  } satisfies AdminParticipantDetail;
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

function formatKmValue(distanceM: number) {
  return `${(distanceM / 1000).toFixed(1)}km`;
}

function formatKmProgress(currentM: number, targetM: number) {
  return `${Math.min(currentM, targetM) / 1000} / ${(targetM / 1000).toFixed(1)}km`;
}

function findThresholdCrossingDate(records: RecordRow[], targetDistanceM: number) {
  let total = 0;

  for (const record of records) {
    total += record.distance_m;
    if (total >= targetDistanceM) {
      return record.run_date;
    }
  }

  return null;
}

function findNthRecordDate(records: RecordRow[], targetCount: number) {
  return records[targetCount - 1]?.run_date ?? null;
}

function getRecordCountProgress(records: RecordRow[], targetCount: number) {
  return `${Math.min(records.length, targetCount)} / ${targetCount}회`;
}

function getWeekRecords(
  records: RecordRow[],
  rule: WeeklyChallengeRule
) {
  return records.filter((record) => record.run_date >= rule.startDate && record.run_date <= rule.endDate);
}

function getWeekThresholdDate(records: RecordRow[], targetDistanceM: number) {
  return findThresholdCrossingDate(records, targetDistanceM);
}

function getWeekRecordCountDate(records: RecordRow[], targetCount: number) {
  return findNthRecordDate(records, targetCount);
}

function getFirstWeekendRecordDate(records: RecordRow[]) {
  for (const record of records) {
    const day = new Date(`${record.run_date}T00:00:00+09:00`).getDay();
    if (day === 0 || day === 6) {
      return record.run_date;
    }
  }

  return null;
}

function getFirstWeekHalfDate(
  approvedRecords: RecordRow[],
  firstWeekRule: WeeklyChallengeRule | undefined
) {
  if (!firstWeekRule) {
    return null;
  }

  const records = getWeekRecords(approvedRecords, firstWeekRule);
  return getWeekThresholdDate(records, Math.ceil(firstWeekRule.targetDistanceM / 2));
}

function getWeeklyAchievementDate(
  approvedRecords: RecordRow[],
  rules: WeeklyChallengeRule[]
) {
  for (const rule of rules) {
    const records = getWeekRecords(approvedRecords, rule);
    const unlockDate = getWeekThresholdDate(records, rule.targetDistanceM);
    if (unlockDate) {
      return unlockDate;
    }
  }

  return null;
}

function getWeeklyStreakDate(
  approvedRecords: RecordRow[],
  rules: WeeklyChallengeRule[],
  targetStreak: number
) {
  let streak = 0;

  for (const rule of rules) {
    const records = getWeekRecords(approvedRecords, rule);
    const unlockDate = getWeekThresholdDate(records, rule.targetDistanceM);

    if (unlockDate) {
      streak += 1;
      if (streak >= targetStreak) {
        return unlockDate;
      }
    } else {
      streak = 0;
    }
  }

  return null;
}

function getWeekThreeRunsDate(approvedRecords: RecordRow[], rules: WeeklyChallengeRule[]) {
  for (const rule of rules) {
    const records = getWeekRecords(approvedRecords, rule);
    if (records.length >= 3) {
      return getWeekRecordCountDate(records, 3);
    }
  }

  return null;
}

function getWeeklyRunCountProgress(approvedRecords: RecordRow[], rules: WeeklyChallengeRule[], targetCount: number) {
  let best = 0;

  for (const rule of rules) {
    best = Math.max(best, getWeekRecords(approvedRecords, rule).length);
  }

  return `${Math.min(best, targetCount)} / ${targetCount}회`;
}

function getLateSprintDate(
  approvedRecords: RecordRow[],
  challenge: Pick<ChallengeType, "end_date" | "target_distance_m">
) {
  const sprintTargetM = Math.round(challenge.target_distance_m * 0.15);
  const sprintStartDate = addDays(challenge.end_date, -6);
  const sprintRecords = approvedRecords.filter(
    (record) => record.run_date >= sprintStartDate && record.run_date <= challenge.end_date
  );

  return getWeekThresholdDate(sprintRecords, sprintTargetM);
}

function getQuietAccumulationDate(approvedRecords: RecordRow[]) {
  let total = 0;
  let maxSingle = 0;

  for (let index = 0; index < approvedRecords.length; index += 1) {
    const record = approvedRecords[index];
    total += record.distance_m;
    maxSingle = Math.max(maxSingle, record.distance_m);

    if (index + 1 >= 4 && total >= 25000 && maxSingle <= 10000) {
      return record.run_date;
    }
  }

  return null;
}

function getSteadyWeekDate(approvedRecords: RecordRow[], rules: WeeklyChallengeRule[]) {
  for (const rule of rules) {
    const records = getWeekRecords(approvedRecords, rule);
    const unlockDate = getWeekThresholdDate(records, rule.targetDistanceM + 5000);
    if (unlockDate) {
      return unlockDate;
    }
  }

  return null;
}

function getFinishersMindsetDate(approvedRecords: RecordRow[], rules: WeeklyChallengeRule[]) {
  const finalRule = rules[rules.length - 1];
  if (!finalRule) {
    return null;
  }

  const finalWeekRecords = getWeekRecords(approvedRecords, finalRule);
  if (finalWeekRecords.length === 0) {
    return null;
  }

  const activeWeeks = rules.filter((rule) => getWeekRecords(approvedRecords, rule).length > 0);
  return activeWeeks.length >= Math.min(4, rules.length) ? finalWeekRecords[0].run_date : null;
}

function getShowDontTellDate(
  approvedRecords: RecordRow[],
  challenge: Pick<ChallengeType, "target_distance_m">,
  weeklyProgress: WeeklyProgressSummary,
  rules: WeeklyChallengeRule[]
) {
  const halfTargetDistanceM = Math.ceil(challenge.target_distance_m / 2);
  const halfUnlockDate = getCumulativeUnlockDate(approvedRecords, halfTargetDistanceM);
  const weeklyThreshold = Math.max(1, Math.ceil(rules.length / 2));
  const weeklyUnlockDate = getWeeklyAchievementDateForCount(approvedRecords, rules, weeklyThreshold);

  if (!halfUnlockDate || !weeklyUnlockDate) {
    return null;
  }

  if (weeklyProgress.achievedWeeks < weeklyThreshold) {
    return null;
  }

  return halfUnlockDate > weeklyUnlockDate ? halfUnlockDate : weeklyUnlockDate;
}

function getWeeklyAchievementDateForCount(
  approvedRecords: RecordRow[],
  rules: WeeklyChallengeRule[],
  targetCount: number
) {
  let achievedCount = 0;

  for (const rule of rules) {
    const records = getWeekRecords(approvedRecords, rule);
    const unlockDate = getWeekThresholdDate(records, rule.targetDistanceM);
    if (unlockDate) {
      achievedCount += 1;
      if (achievedCount >= targetCount) {
        return unlockDate;
      }
    }
  }

  return null;
}

function getFirstWeekProgressText(approvedRecords: RecordRow[], rule: WeeklyChallengeRule | undefined) {
  if (!rule) {
    return "기준 정보 없음";
  }

  const actualDistanceM = getWeekRecords(approvedRecords, rule).reduce((sum, record) => sum + record.distance_m, 0);
  const targetDistanceM = Math.ceil(rule.targetDistanceM / 2);
  return formatKmProgress(actualDistanceM, targetDistanceM);
}

function buildNextHint(
  code: BadgeCode,
  challenge: Pick<ChallengeType, "target_distance_m" | "name">,
  approvedDistanceM: number,
  approvedRecords: RecordRow[],
  weeklyProgress: WeeklyProgressSummary
) {
  const weeklyThreshold = Math.max(1, Math.ceil(weeklyProgress.totalWeeks / 2));

  switch (code) {
    case "first_upload":
      return "승인 기록 1건을 남기면 첫 배지가 열립니다.";
    case "first_week_entry":
      return "첫 주차 안에 승인 기록을 1회 남겨보세요.";
    case "first_week_half":
      return "이번 주 기준의 절반만 넘겨도 흐름이 붙습니다.";
    case "distance_10km":
      return `다음 배지까지 ${formatKmValue(Math.max(0, 10000 - approvedDistanceM))} 남음`;
    case "distance_25km":
      return `다음 배지까지 ${formatKmValue(Math.max(0, 25000 - approvedDistanceM))} 남음`;
    case "distance_50km":
      return `다음 배지까지 ${formatKmValue(Math.max(0, 50000 - approvedDistanceM))} 남음`;
    case "distance_75km":
      return `다음 배지까지 ${formatKmValue(Math.max(0, 75000 - approvedDistanceM))} 남음`;
    case "distance_100km":
      return `다음 배지까지 ${formatKmValue(Math.max(0, 100000 - approvedDistanceM))} 남음`;
    case "half_finish":
      return `절반 목표까지 ${formatKmValue(Math.max(0, Math.ceil(challenge.target_distance_m / 2) - approvedDistanceM))} 남음`;
    case "challenge_finish":
      return `완주까지 ${formatKmValue(Math.max(0, challenge.target_distance_m - approvedDistanceM))} 남음`;
    case "weekly_goal":
      return "현재 주차 기준 거리를 채우면 이 배지가 열립니다.";
    case "weekly_2_streak":
      return "연속 달성 2주를 만들어보세요.";
    case "weekly_4_streak":
      return "주간 기준을 끊기지 않게 이어가면 열립니다.";
    case "final_week_entry":
      return "마지막 주가 시작되면 자동으로 열립니다.";
    case "final_week_goal":
      return "마지막 주 기준 거리를 채우면 열립니다.";
    case "record_3":
      return `다음 배지까지 ${Math.max(0, 3 - approvedRecords.length)}회 남음`;
    case "record_5":
      return `다음 배지까지 ${Math.max(0, 5 - approvedRecords.length)}회 남음`;
    case "week_3_runs":
      return "한 주에 승인 기록 3회를 채우면 열립니다.";
    case "weekend_run":
      return "토요일 또는 일요일에 러닝 기록을 남겨보세요.";
    case "late_sprint":
      return "종료 7일 안에 강한 추격을 만들면 열립니다.";
    case "streak_7days":
      return "하루도 끊기지 않는 7일 연속 흐름에 도전해보세요.";
    case "quiet_accumulation":
      return "큰 한 방보다 안정적인 누적으로 25km를 채워보세요.";
    case "steady_week":
      return "주간 기준보다 여유 있게 채우면 열립니다.";
    case "finishers_mindset":
      return "마지막 주까지 기록 흐름을 이어가면 열립니다.";
    case "show_dont_tell":
      return `${weeklyThreshold}주 이상 달성과 절반 누적을 함께 채우면 열립니다.`;
    default:
      return `${challenge.name}의 다음 마일스톤을 향해 꾸준히 이어가보세요.`;
  }
}

export function buildBadgeProgress(
  records: RecordRow[],
  challenge: Pick<ChallengeType, "code" | "name" | "target_distance_m" | "start_date" | "end_date">
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
  const weeklyProgress = calculateWeeklyProgress(records, challenge);
  const weeklyRules = getWeeklyChallengeRules(challenge.code);
  const firstWeekRule = weeklyRules[0];
  const finalWeekRule = weeklyRules[weeklyRules.length - 1];
  const today = getTodayDateString();
  const weeklyRunCounts = weeklyRules.map((rule) => getWeekRecords(approvedRecords, rule).length);
  const weekendRunDate = getFirstWeekendRecordDate(approvedRecords);
  const finalWeekRecords = finalWeekRule ? getWeekRecords(approvedRecords, finalWeekRule) : [];
  const halfWeeksThreshold = Math.max(1, Math.ceil(weeklyRules.length / 2));

  const unlockDates: Partial<Record<BadgeCode, string | null>> = {
    first_upload: firstApprovedDate,
    first_week_entry: firstWeekRule ? getWeekRecords(approvedRecords, firstWeekRule)[0]?.run_date ?? null : null,
    first_week_half: getFirstWeekHalfDate(approvedRecords, firstWeekRule),
    distance_10km: getCumulativeUnlockDate(approvedRecords, 10000),
    distance_25km: getCumulativeUnlockDate(approvedRecords, 25000),
    distance_50km: getCumulativeUnlockDate(approvedRecords, 50000),
    distance_75km: getCumulativeUnlockDate(approvedRecords, 75000),
    distance_100km: getCumulativeUnlockDate(approvedRecords, 100000),
    half_finish: getCumulativeUnlockDate(approvedRecords, halfTargetDistanceM),
    challenge_finish: getCumulativeUnlockDate(approvedRecords, challenge.target_distance_m),
    streak_7days: streakStatus.unlockedAt,
    weekly_goal: getWeeklyAchievementDate(approvedRecords, weeklyRules),
    weekly_2_streak: getWeeklyStreakDate(approvedRecords, weeklyRules, 2),
    weekly_4_streak: getWeeklyStreakDate(approvedRecords, weeklyRules, 4),
    final_week_entry: finalWeekRule && today >= finalWeekRule.startDate ? finalWeekRule.startDate : null,
    final_week_goal: finalWeekRule ? getWeekThresholdDate(finalWeekRecords, finalWeekRule.targetDistanceM) : null,
    record_3: findNthRecordDate(approvedRecords, 3),
    record_5: findNthRecordDate(approvedRecords, 5),
    week_3_runs: getWeekThreeRunsDate(approvedRecords, weeklyRules),
    weekend_run: weekendRunDate,
    late_sprint: getLateSprintDate(approvedRecords, challenge),
    quiet_accumulation: getQuietAccumulationDate(approvedRecords),
    steady_week: getSteadyWeekDate(approvedRecords, weeklyRules),
    finishers_mindset: getFinishersMindsetDate(approvedRecords, weeklyRules),
    show_dont_tell: getShowDontTellDate(approvedRecords, challenge, weeklyProgress, weeklyRules)
  };

  const progressTexts: Record<BadgeCode, string> = {
    first_upload: firstApprovedDate ? "획득 완료" : "첫 승인 기록 등록 전",
    first_week_entry: firstWeekRule
      ? `${Math.min(getWeekRecords(approvedRecords, firstWeekRule).length, 1)} / 1회`
      : "기준 정보 없음",
    first_week_half: getFirstWeekProgressText(approvedRecords, firstWeekRule),
    distance_10km: formatKmProgress(approvedDistanceM, 10000),
    distance_25km: formatKmProgress(approvedDistanceM, 25000),
    distance_50km: formatKmProgress(approvedDistanceM, 50000),
    distance_75km: formatKmProgress(approvedDistanceM, 75000),
    distance_100km: formatKmProgress(approvedDistanceM, 100000),
    half_finish: formatKmProgress(approvedDistanceM, halfTargetDistanceM),
    challenge_finish: formatKmProgress(approvedDistanceM, challenge.target_distance_m),
    streak_7days: `${Math.min(streakStatus.maxStreak, 7)} / 7일 연속`,
    weekly_goal: `${weeklyProgress.achievedWeeks} / ${Math.max(1, weeklyProgress.totalWeeks)}주 달성`,
    weekly_2_streak: `${Math.min(
      weeklyProgress.items.reduce((best, item) => {
        const previous = best.current;
        const current = item.achieved ? previous + 1 : 0;
        return {
          current,
          max: Math.max(best.max, current)
        };
      }, { current: 0, max: 0 }).max,
      2
    )} / 2주 연속`,
    weekly_4_streak: `${Math.min(
      weeklyProgress.items.reduce((best, item) => {
        const previous = best.current;
        const current = item.achieved ? previous + 1 : 0;
        return {
          current,
          max: Math.max(best.max, current)
        };
      }, { current: 0, max: 0 }).max,
      4
    )} / 4주 연속`,
    final_week_entry: finalWeekRule && today >= finalWeekRule.startDate ? "획득 완료" : "마지막 주 시작 전",
    final_week_goal: finalWeekRule
      ? formatKmProgress(
          finalWeekRecords.reduce((sum, record) => sum + record.distance_m, 0),
          finalWeekRule.targetDistanceM
        )
      : "기준 정보 없음",
    record_3: getRecordCountProgress(approvedRecords, 3),
    record_5: getRecordCountProgress(approvedRecords, 5),
    week_3_runs: getWeeklyRunCountProgress(approvedRecords, weeklyRules, 3),
    weekend_run: weekendRunDate ? "획득 완료" : "주말 승인 기록 등록 전",
    late_sprint: finalWeekRule
      ? formatKmProgress(
          approvedRecords
            .filter((record) => record.run_date >= addDays(challenge.end_date, -6) && record.run_date <= challenge.end_date)
            .reduce((sum, record) => sum + record.distance_m, 0),
          Math.round(challenge.target_distance_m * 0.15)
        )
      : "기준 정보 없음",
    quiet_accumulation: formatKmProgress(approvedDistanceM, 25000),
    steady_week: `${weeklyProgress.achievedWeeks} / ${Math.max(1, weeklyProgress.totalWeeks)}주 기반`,
    finishers_mindset: `${Math.min(
      weeklyRules.filter((rule) => getWeekRecords(approvedRecords, rule).length > 0).length,
      Math.min(4, weeklyRules.length || 4)
    )} / ${Math.min(4, weeklyRules.length || 4)}주 흐름`,
    show_dont_tell: `${Math.min(weeklyProgress.achievedWeeks, halfWeeksThreshold)} / ${halfWeeksThreshold}주 달성`
  };

  return getBadgeOrder(challenge).map((code) => {
    const definition = getBadgeDefinition(code);
    const unlockedAt = unlockDates[code] ?? null;

    return {
      code,
      category: definition.category,
      name: definition.getTitle(challenge),
      description: definition.getDescription(challenge),
      achieved: Boolean(unlockedAt),
      unlockedAt,
      progressText: progressTexts[code],
      message: pickRandomBadgeMessage(definition.messagePool),
      nextHint: buildNextHint(code, challenge, approvedDistanceM, approvedRecords, weeklyProgress)
    } satisfies BadgeProgress;
  });
}
