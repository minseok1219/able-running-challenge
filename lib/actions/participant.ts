"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole, getCurrentUserRow } from "@/lib/auth/server";
import { evaluateRecordStatus } from "@/lib/calculations/challenge";
import { allowLocalChallengeTesting } from "@/lib/config/runtime";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getParticipantRecords } from "@/lib/supabase/queries";
import { getTodayDateString, isEditableToday, parseDistanceKm, parsePaceToSeconds } from "@/lib/utils/format";
import { rethrowIfRedirectError } from "@/lib/utils/redirect";

function validateRecordDate(runDate: string, challengeStart: string, challengeEnd: string) {
  if (!runDate) {
    throw new Error("날짜를 선택해주세요.");
  }

  const today = allowLocalChallengeTesting() ? challengeEnd : getTodayDateString();
  if (runDate > today) {
    throw new Error("미래 날짜는 입력할 수 없습니다.");
  }

  if (runDate < challengeStart || runDate > challengeEnd) {
    throw new Error("챌린지 기간 내 날짜만 입력할 수 있습니다.");
  }
}

function buildRecordRedirect(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://localhost");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return `${url.pathname}${url.search}`;
}

async function buildAutoStatus({
  userId,
  runDate,
  distanceM,
  paceSecPerKm,
  excludeRecordId,
  challengeStart,
  challengeEnd
}: {
  userId: string;
  runDate: string;
  distanceM: number;
  paceSecPerKm: number;
  excludeRecordId?: string;
  challengeStart: string;
  challengeEnd: string;
}) {
  const records = await getParticipantRecords(userId);
  const dailyDistanceM =
    records
      .filter((record) => record.run_date === runDate && record.id !== excludeRecordId)
      .reduce((sum, record) => sum + record.distance_m, 0) + distanceM;

  return evaluateRecordStatus({
    runDate,
    distanceM,
    paceSecPerKm,
    dailyDistanceM,
    challenge: {
      start_date: challengeStart,
      end_date: challengeEnd
    }
  });
}

export async function createRecordAction(formData: FormData) {
  const session = await requireRole("participant", "/login");
  const user = await getCurrentUserRow(session);

  try {
    if (!user.challenge_types) {
      throw new Error("챌린지 정보가 없습니다.");
    }

    const runDate = String(formData.get("run_date") ?? "");
    const distanceM = parseDistanceKm(formData.get("distance_km"));
    const paceSecPerKm = parsePaceToSeconds(formData.get("pace"));
    const note = String(formData.get("note") ?? "").trim() || null;

    validateRecordDate(runDate, user.challenge_types.start_date, user.challenge_types.end_date);
    const statusResult = await buildAutoStatus({
      userId: user.id,
      runDate,
      distanceM,
      paceSecPerKm,
      challengeStart: user.challenge_types.start_date,
      challengeEnd: user.challenge_types.end_date
    });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("records").insert({
      user_id: user.id,
      run_date: runDate,
      distance_m: distanceM,
      pace_sec_per_km: paceSecPerKm,
      note,
      status: statusResult.status,
      warning_reason: statusResult.warningReason
    });

    if (error) {
      throw new Error("기록 저장에 실패했습니다.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/records");
    revalidatePath("/leaderboard");
    redirect("/records?saved=1");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildRecordRedirect("/records/new", {
        error: error instanceof Error ? error.message : "기록 저장에 실패했습니다."
      })
    );
  }
}

export async function updateRecordAction(recordId: string, formData: FormData) {
  const session = await requireRole("participant", "/login");
  const user = await getCurrentUserRow(session);
  const supabase = getSupabaseAdmin();

  try {
    if (!user.challenge_types) {
      throw new Error("챌린지 정보가 없습니다.");
    }

    const { data: existing, error: fetchError } = await supabase
      .from("records")
      .select("*")
      .eq("id", recordId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      throw new Error("수정할 기록을 찾지 못했습니다.");
    }

    if (!isEditableToday(existing.created_at)) {
      throw new Error("기록은 등록한 당일에만 수정할 수 있습니다.");
    }

    const runDate = String(formData.get("run_date") ?? "");
    const distanceM = parseDistanceKm(formData.get("distance_km"));
    const paceSecPerKm = parsePaceToSeconds(formData.get("pace"));
    const note = String(formData.get("note") ?? "").trim() || null;

    validateRecordDate(runDate, user.challenge_types.start_date, user.challenge_types.end_date);
    const statusResult = await buildAutoStatus({
      userId: user.id,
      runDate,
      distanceM,
      paceSecPerKm,
      excludeRecordId: recordId,
      challengeStart: user.challenge_types.start_date,
      challengeEnd: user.challenge_types.end_date
    });

    const { error } = await supabase
      .from("records")
      .update({
        run_date: runDate,
        distance_m: distanceM,
        pace_sec_per_km: paceSecPerKm,
        note,
        status: statusResult.status,
        warning_reason: statusResult.warningReason
      })
      .eq("id", recordId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error("기록 수정에 실패했습니다.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/records");
    revalidatePath("/leaderboard");
    redirect("/records?updated=1");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildRecordRedirect(`/records/${recordId}/edit`, {
        error: error instanceof Error ? error.message : "기록 수정에 실패했습니다."
      })
    );
  }
}

export async function getEditableRecord(recordId: string) {
  const session = await requireRole("participant", "/login");
  const user = await getCurrentUserRow(session);
  const records = await getParticipantRecords(user.id);
  const record = records.find((item) => item.id === recordId);

  if (!record) {
    throw new Error("기록을 찾지 못했습니다.");
  }

  return {
    user,
    record,
    canEdit: isEditableToday(record.created_at)
  };
}
