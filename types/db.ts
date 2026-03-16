export type UserRole = "participant" | "admin";
export type RecordStatus = "approved" | "warning" | "rejected";
export type AdminActionType = "approve" | "warn" | "reject" | "edit";

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
};

export type ChartPoint = {
  label: string;
  distanceKm: number;
};

export type BadgeProgress = {
  code:
    | "first_upload"
    | "distance_10km"
    | "distance_25km"
    | "distance_50km"
    | "streak_7days"
    | "half_finish"
    | "challenge_finish";
  name: string;
  description: string;
  achieved: boolean;
  unlockedAt: string | null;
  progressText: string;
};
