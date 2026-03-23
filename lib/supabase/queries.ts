import { cache } from "react";

import {
  buildAdminParticipantDetail,
  buildAdminParticipantWeeklySummary,
  calculateDashboardSummary,
  filterRecordsForActiveChallenge
} from "@/lib/calculations/challenge";
import {
  fallbackBranches,
  fallbackChallengeTypes,
  hasSupabaseEnv
} from "@/lib/config/runtime";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/utils/format";
import type {
  AdminParticipantDetail,
  AdminParticipantSummary,
  AdminActionLog,
  Branch,
  ChallengeType,
  LeaderboardEntry,
  RecordRow,
  UserRow
} from "@/types/db";

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getRecentWeekStartDate() {
  const end = new Date(`${getTodayDateString()}T00:00:00+09:00`);
  end.setDate(end.getDate() - 6);
  return end.toISOString().slice(0, 10);
}

function getRecentApprovedWeekRecords(records: RecordRow[]) {
  const recentWeekStart = getRecentWeekStartDate();

  return records
    .filter(
      (record) =>
        record.status === "approved" &&
        record.run_date >= recentWeekStart &&
        record.run_date <= getTodayDateString()
    )
    .sort((a, b) => {
      if (a.run_date === b.run_date) {
        return b.created_at.localeCompare(a.created_at);
      }

      return b.run_date.localeCompare(a.run_date);
    })
    .slice(0, 7)
    .map((record) => ({
      runDate: record.run_date,
      distanceM: record.distance_m,
      paceSecPerKm: record.pace_sec_per_km
    }));
}

export const getPublicSetupData = cache(async () => {
  if (!hasSupabaseEnv()) {
    return {
      branches: fallbackBranches,
      challengeTypes: fallbackChallengeTypes
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const [{ data: branches, error: branchError }, { data: challengeTypes, error: challengeError }] =
      await Promise.all([
        supabase.from("branches").select("id, code, name, sort_order").order("sort_order"),
        supabase
          .from("challenge_types")
          .select("id, code, name, target_distance_m, start_date, end_date, sort_order")
          .order("sort_order")
      ]);

    if (branchError || challengeError || !branches || !challengeTypes) {
      throw new Error("초기 데이터를 불러오지 못했습니다.");
    }

    return {
      branches: branches as Branch[],
      challengeTypes: challengeTypes as ChallengeType[]
    };
  } catch {
    return {
      branches: fallbackBranches,
      challengeTypes: fallbackChallengeTypes
    };
  }
});

export async function generateParticipantCode() {
  const supabase = getSupabaseAdmin();

  for (let index = 0; index < 10; index += 1) {
    const candidate = `ARC-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("participant_code", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  throw new Error("participant_code 생성에 실패했습니다. 다시 시도해주세요.");
}

export async function getParticipantRecords(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("run_date", { ascending: false });

  if (error || !data) {
    throw new Error("기록을 불러오지 못했습니다.");
  }

  return data as RecordRow[];
}

export async function getParticipantDashboard(user: UserRow) {
  const records = await getParticipantRecords(user.id);
  const challenge = user.challenge_types;
  if (!challenge) {
    throw new Error("챌린지 정보가 없습니다.");
  }

  const scopedRecords = filterRecordsForActiveChallenge(records, challenge);

  return {
    records,
    summary: calculateDashboardSummary(records, challenge),
    recentRecords: scopedRecords.slice(0, 5)
  };
}

export async function getLeaderboard({
  branchCode,
  sortBy
}: {
  branchCode?: string;
  sortBy?: "progress" | "distance";
}) {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = getSupabaseAdmin();
    const query = supabase
      .from("users")
      .select(
        "id, name, username, participant_code, role, branches:branch_id(name, code), challenge_types:challenge_type_id(name, code, target_distance_m, start_date), records(distance_m, pace_sec_per_km, status, run_date, created_at)"
      )
      .eq("role", "participant")
      .eq("is_active", true);

    const { data, error } = await query;
    if (error || !data) {
      throw new Error("리더보드를 불러오지 못했습니다.");
    }

    const entries = data
      .filter((row) => !branchCode || firstOrNull(row.branches)?.code === branchCode)
      .map((row) => {
        const branch = firstOrNull(row.branches);
        const challenge = firstOrNull(row.challenge_types);
        const activeRecords = filterRecordsForActiveChallenge((row.records ?? []) as RecordRow[], {
          start_date: challenge?.start_date ?? "9999-12-31"
        });
        const approvedDistanceM = activeRecords
          .filter((record: { status: string }) => record.status === "approved")
          .reduce((sum: number, record: { distance_m: number }) => sum + record.distance_m, 0);
        const warningCount = activeRecords.filter(
          (record: { status: string }) => record.status === "warning"
        ).length;
        const targetDistanceM = challenge?.target_distance_m ?? 1;
        const recentWeekRecords = getRecentApprovedWeekRecords(activeRecords as RecordRow[]);

        return {
          userId: row.id,
          name: row.name,
          participantCode: row.participant_code ?? "-",
          branchName: branch?.name ?? "-",
          branchCode: branch?.code ?? "",
          challengeName: challenge?.name ?? "-",
          challengeCode: challenge?.code ?? "",
          targetDistanceM,
          approvedDistanceM,
          progress: approvedDistanceM / targetDistanceM,
          warningCount,
          recentWeekRecords
        } satisfies LeaderboardEntry;
      });

    return entries.sort((a, b) => {
      if (sortBy === "distance") {
        return b.approvedDistanceM - a.approvedDistanceM || b.progress - a.progress;
      }

      return b.progress - a.progress || b.approvedDistanceM - a.approvedDistanceM;
    });
  } catch {
    return [];
  }
}

export async function getAdminParticipants() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, username, participant_code, role, is_active, branches:branch_id(name, code), challenge_types:challenge_type_id(name, code, target_distance_m, start_date, end_date), records(distance_m, status, run_date)"
    )
    .eq("role", "participant")
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("참가자 목록을 불러오지 못했습니다.");
  }

  return data.map((row) => {
    const branch = firstOrNull(row.branches);
    const challenge = firstOrNull(row.challenge_types);
    const records = (row.records ?? []) as RecordRow[];

    if (!challenge) {
      return {
        id: row.id,
        name: row.name,
        username: row.username ?? "-",
        participantCode: row.participant_code ?? "-",
        isActive: row.is_active,
        branchName: branch?.name ?? "-",
        branchCode: branch?.code ?? "",
        challengeName: "-",
        challengeCode: "",
        approvedDistanceM: 0,
        progress: 0,
        warningCount: 0,
        achievedWeeks: 0,
        totalWeeks: 0,
        currentWeekStatus: "기간 종료"
      } satisfies AdminParticipantSummary;
    }

    return buildAdminParticipantWeeklySummary({
      records,
      challenge,
      participant: {
        id: row.id,
        name: row.name,
        username: row.username ?? "-",
        participantCode: row.participant_code ?? "-",
        isActive: row.is_active,
        branchName: branch?.name ?? "-",
        branchCode: branch?.code ?? "",
        challengeName: challenge.name,
        challengeCode: challenge.code
      }
    });
  });
}

export async function getAdminParticipantDetail(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, username, participant_code, role, is_active, branches:branch_id(name, code), challenge_types:challenge_type_id(name, code, target_distance_m, start_date, end_date)"
    )
    .eq("id", userId)
    .eq("role", "participant")
    .maybeSingle();

  if (error || !data) {
    throw new Error("참가자 정보를 불러오지 못했습니다.");
  }

  if (!data) {
    return null;
  }

  const branch = firstOrNull(data.branches);
  const challenge = firstOrNull(data.challenge_types);
  if (!challenge) {
    throw new Error("참가 종목 정보가 없습니다.");
  }

  const records = await getParticipantRecords(data.id);

  return buildAdminParticipantDetail({
    records,
    challenge,
    participant: {
      id: data.id,
      name: data.name,
      username: data.username ?? "-",
      participantCode: data.participant_code ?? "-",
      isActive: data.is_active,
      branchName: branch?.name ?? "-",
      branchCode: branch?.code ?? "",
      challengeName: challenge.name,
      challengeCode: challenge.code,
      targetDistanceM: challenge.target_distance_m
    }
  }) satisfies AdminParticipantDetail;
}

export async function getAdminRecords() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("records")
    .select(
      "id, user_id, run_date, distance_m, pace_sec_per_km, note, status, warning_reason, created_at, updated_at, users!inner(id, name, username, participant_code, branches:branch_id(name, code), challenge_types:challenge_type_id(name, code, target_distance_m))"
    )
    .order("run_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("관리자 기록 목록을 불러오지 못했습니다.");
  }

  return data.map((row) => {
    const user = firstOrNull(row.users);
    return {
      ...row,
      users: user
        ? {
            ...user,
            branches: firstOrNull(user.branches),
            challenge_types: firstOrNull(user.challenge_types)
          }
        : undefined
    };
  }) as unknown as RecordRow[];
}

export async function getRecentAdminActions(limit = 20) {
  const supabase = getSupabaseAdmin();
  const enhancedQuery = await supabase
    .from("admin_actions")
    .select(
      "id, action_type, previous_status, new_status, memo, created_at, run_date, participant_name, participant_username, participant_code, admin_user:admin_user_id(name), participants:participant_user_id(name, username, participant_code), records:record_id(id, run_date, users:user_id(name, username, participant_code))"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!enhancedQuery.error && enhancedQuery.data) {
    return enhancedQuery.data.map((row) => {
      const adminUser = firstOrNull(row.admin_user);
      const participantUser = firstOrNull(row.participants);
      const record = firstOrNull(row.records);
      const recordParticipant = firstOrNull(record?.users);

      return {
        id: row.id,
        actionType: row.action_type,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        memo: row.memo,
        createdAt: row.created_at,
        adminName: adminUser?.name ?? "관리자",
        runDate: row.run_date ?? record?.run_date ?? null,
        participantName:
          row.participant_name ?? participantUser?.name ?? recordParticipant?.name ?? "알 수 없음",
        participantUsername:
          row.participant_username ??
          participantUser?.username ??
          recordParticipant?.username ??
          null,
        participantCode:
          row.participant_code ??
          participantUser?.participant_code ??
          recordParticipant?.participant_code ??
          null
      } satisfies AdminActionLog;
    });
  }

  const legacyQuery = await supabase
    .from("admin_actions")
    .select(
      "id, action_type, previous_status, new_status, memo, created_at, admin_user:admin_user_id(name), records:record_id(id, run_date, users:user_id(name, username, participant_code))"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (legacyQuery.error || !legacyQuery.data) {
    throw new Error("관리자 작업 로그를 불러오지 못했습니다.");
  }

  return legacyQuery.data.map((row) => {
    const adminUser = firstOrNull(row.admin_user);
    const record = firstOrNull(row.records);
    const participant = firstOrNull(record?.users);

    return {
      id: row.id,
      actionType: row.action_type,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      memo: row.memo,
      createdAt: row.created_at,
      adminName: adminUser?.name ?? "관리자",
      runDate: record?.run_date ?? null,
      participantName: participant?.name ?? "알 수 없음",
      participantUsername: participant?.username ?? null,
      participantCode: participant?.participant_code ?? null
    } satisfies AdminActionLog;
  });
}

export async function getAdminOverview() {
  const supabase = getSupabaseAdmin();
  const [{ data: users, error: userError }, { data: records, error: recordError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, role, branches:branch_id(name), challenge_types:challenge_type_id(name, start_date)")
        .eq("role", "participant")
        .eq("is_active", true),
      supabase
        .from("records")
        .select("status, run_date, users!inner(challenge_types:challenge_type_id!inner(start_date))")
    ]);

  if (userError || recordError || !users || !records) {
    throw new Error("관리자 개요를 불러오지 못했습니다.");
  }

  const branchCounts = users.reduce<Record<string, number>>((acc, user) => {
    const key = firstOrNull(user.branches)?.name ?? "미지정";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const challengeCounts = users.reduce<Record<string, number>>((acc, user) => {
    const key = firstOrNull(user.challenge_types)?.name ?? "미지정";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const scopedRecords = records.filter((record) => {
    const userRelation = firstOrNull(record.users);
    const challenge = firstOrNull(userRelation?.challenge_types);
    if (!challenge) {
      return false;
    }

    return filterRecordsForActiveChallenge(
      [
        {
          run_date: record.run_date,
          status: record.status
        }
      ],
      {
      start_date: challenge.start_date
      }
    ).length > 0;
  });

  return {
    participantCount: users.length,
    branchCounts,
    challengeCounts,
    approvedCount: scopedRecords.filter((record) => record.status === "approved").length,
    warningCount: scopedRecords.filter((record) => record.status === "warning").length,
    rejectedCount: scopedRecords.filter((record) => record.status === "rejected").length
  };
}
