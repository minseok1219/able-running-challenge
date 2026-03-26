export type UserRole = "participant" | "admin";
export type RecordStatus = "approved" | "warning" | "rejected";
export type AdminActionType =
  | "approve"
  | "warn"
  | "reject"
  | "edit"
  | "participant_activate"
  | "participant_deactivate"
  | "participant_delete"
  | "participant_branch_update";

export type Branch = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

export type ChallengeType = {
  id: string;
  code: string;
  name: string;
  target_distance_m: number;
  start_date: string;
  end_date: string;
  sort_order: number;
};

export type UserRow = {
  id: string;
  participant_code: string | null;
  username: string | null;
  name: string;
  phone_last4: string | null;
  password_hash: string;
  branch_id: string | null;
  challenge_type_id: string | null;
  role: UserRole;
  is_active: boolean;
  session_version: number;
  created_at: string;
  updated_at: string;
  branches?: Branch | null;
  challenge_types?: ChallengeType | null;
};

export type RecordRow = {
  id: string;
  user_id: string;
  run_date: string;
  distance_m: number;
  pace_sec_per_km: number;
  note: string | null;
  status: RecordStatus;
  warning_reason: string | null;
  created_at: string;
  updated_at: string;
  users?: Pick<UserRow, "id" | "name" | "participant_code" | "username"> & {
    branches?: Pick<Branch, "name" | "code"> | null;
    challenge_types?: Pick<ChallengeType, "name" | "code" | "target_distance_m"> | null;
  };
};

export type SessionUser = {
  id: string;
  role: UserRole;
  name: string;
  username: string | null;
  participantCode: string | null;
  sessionVersion: number;
};

export type DashboardSummary = {
  approvedDistanceM: number;
  progress: number;
  remainingDistanceM: number;
  recommendedDistanceM: number;
  deltaDistanceM: number;
  approvedCount: number;
  warningCount: number;
  rejectedCount: number;
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  participantCode: string;
  branchName: string;
  branchCode: string;
  challengeName: string;
  challengeCode: string;
  targetDistanceM: number;
  approvedDistanceM: number;
  progress: number;
  warningCount: number;
  recentWeekRecords: Array<{
    runDate: string;
    distanceM: number;
    paceSecPerKm: number;
  }>;
};

export type ChartPoint = {
  label: string;
  distanceKm: number;
};

export type BadgeCategory =
  | "시작 배지"
  | "누적 거리 배지"
  | "주차 미션 배지"
  | "꾸준함 배지"
  | "에이블 스타일 배지";

export type BadgeCode =
  | "first_upload"
  | "first_week_entry"
  | "first_week_half"
  | "distance_10km"
  | "distance_25km"
  | "distance_50km"
  | "distance_75km"
  | "distance_100km"
  | "streak_7days"
  | "weekly_goal"
  | "weekly_2_streak"
  | "weekly_4_streak"
  | "final_week_entry"
  | "final_week_goal"
  | "record_3"
  | "record_5"
  | "week_3_runs"
  | "weekend_run"
  | "late_sprint"
  | "quiet_accumulation"
  | "steady_week"
  | "finishers_mindset"
  | "show_dont_tell"
  | "half_finish"
  | "challenge_finish";

export type BadgeProgress = {
  code: BadgeCode;
  category: BadgeCategory;
  name: string;
  description: string;
  achieved: boolean;
  unlockedAt: string | null;
  progressText: string;
  message: string;
  nextHint: string;
};

export type AdminActionLog = {
  id: string;
  actionType: AdminActionType;
  previousStatus: RecordStatus | null;
  newStatus: RecordStatus | null;
  memo: string | null;
  createdAt: string;
  adminName: string;
  runDate: string | null;
  participantName: string;
  participantUsername: string | null;
  participantCode: string | null;
};

export type WeeklyProgressStatus = "달성" | "미달" | "진행 중" | "예정";
export type WeeklyListStatus = "달성" | "미달" | "진행 전" | "기간 종료";

export type WeeklyChallengeRule = {
  weekNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  targetDistanceM: number;
};

export type WeeklyProgressItem = {
  weekNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  targetDistanceM: number;
  actualDistanceM: number;
  achieved: boolean;
  status: WeeklyProgressStatus;
};

export type WeeklyProgressSummary = {
  totalWeeks: number;
  achievedWeeks: number;
  currentWeekStatus: WeeklyListStatus;
  currentWeekNumber: number | null;
  items: WeeklyProgressItem[];
};

export type AdminParticipantSummary = {
  id: string;
  name: string;
  username: string;
  participantCode: string;
  isActive: boolean;
  branchName: string;
  branchCode: string;
  challengeName: string;
  challengeCode: string;
  approvedDistanceM: number;
  progress: number;
  warningCount: number;
  achievedWeeks: number;
  totalWeeks: number;
  currentWeekStatus: WeeklyListStatus;
};

export type AdminParticipantDetail = {
  id: string;
  name: string;
  username: string;
  participantCode: string;
  isActive: boolean;
  branchName: string;
  branchCode: string;
  challengeName: string;
  challengeCode: string;
  targetDistanceM: number;
  approvedDistanceM: number;
  progress: number;
  achievedWeeks: number;
  totalWeeks: number;
  currentWeekStatus: WeeklyListStatus;
  lastRecordDate: string | null;
  recentRecords: RecordRow[];
  weeklyProgress: WeeklyProgressItem[];
};
