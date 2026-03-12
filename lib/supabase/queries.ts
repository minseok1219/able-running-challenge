import { cache } from "react";

import { calculateDashboardSummary } from "@/lib/calculations/challenge";
import {
  fallbackBranches,
  fallbackChallengeTypes,
  hasSupabaseEnv
} from "@/lib/config/runtime";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Branch, ChallengeType, LeaderboardEntry, RecordRow, UserRow } from "@/types/db";

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
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
    .order("run_date", { ascending: false })
    .order("created_at", { ascending: false });

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

  return {
    records,
    summary: calculateDashboardSummary(records, challenge),
    recentRecords: records.slice(0, 5)
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
        "id, name, participant_code, role, branches:branch_id(name, code), challenge_types:challenge_type_id(name, code, target_distance_m), records(distance_m, status)"
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
        const approvedDistanceM = (row.records ?? [])
          .filter((record: { status: string }) => record.status === "approved")
          .reduce((sum: number, record: { distance_m: number }) => sum + record.distance_m, 0);
        const warningCount = (row.records ?? []).filter(
          (record: { status: string }) => record.status === "warning"
        ).length;
        const targetDistanceM = challenge?.target_distance_m ?? 1;

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
          warningCount
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
      "id, name, participant_code, role, branches:branch_id(name, code), challenge_types:challenge_type_id(name, code, target_distance_m, start_date, end_date), records(distance_m, status)"
    )
    .eq("role", "participant")
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error("참가자 목록을 불러오지 못했습니다.");
  }

  return data.map((row) => {
    const branch = firstOrNull(row.branches);
    const challenge = firstOrNull(row.challenge_types);
    const records = (row.records ?? []) as Pick<RecordRow, "distance_m" | "status">[];
    const approvedDistanceM = records
      .filter((record) => record.status === "approved")
      .reduce((sum, record) => sum + record.distance_m, 0);
    const targetDistanceM = challenge?.target_distance_m ?? 1;

    return {
      id: row.id,
      name: row.name,
      participantCode: row.participant_code ?? "-",
      branchName: branch?.name ?? "-",
      challengeName: challenge?.name ?? "-",
      approvedDistanceM,
      progress: approvedDistanceM / targetDistanceM,
      warningCount: records.filter((record) => record.status === "warning").length
    };
  });
}

export async function getAdminRecords() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("records")
    .select(
      "id, user_id, run_date, distance_m, pace_sec_per_km, note, status, warning_reason, created_at, updated_at, users!inner(id, name, participant_code, branches:branch_id(name, code), challenge_types:challenge_type_id(name, code, target_distance_m))"
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

export async function getAdminOverview() {
  const supabase = getSupabaseAdmin();
  const [{ data: users, error: userError }, { data: records, error: recordError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, role, branches:branch_id(name), challenge_types:challenge_type_id(name)")
        .eq("role", "participant"),
      supabase.from("records").select("status")
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

  return {
    participantCount: users.length,
    branchCounts,
    challengeCounts,
    approvedCount: records.filter((record) => record.status === "approved").length,
    warningCount: records.filter((record) => record.status === "warning").length,
    rejectedCount: records.filter((record) => record.status === "rejected").length
  };
}
