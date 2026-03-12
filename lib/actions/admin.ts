"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserRow, requireRole } from "@/lib/auth/server";
import { evaluateRecordStatus } from "@/lib/calculations/challenge";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseDistanceKm, parsePaceToSeconds } from "@/lib/utils/format";
import { rethrowIfRedirectError } from "@/lib/utils/redirect";
import type { AdminActionType, RecordStatus } from "@/types/db";

function actionTypeFromStatus(status: RecordStatus): AdminActionType {
  if (status === "approved") return "approve";
  if (status === "warning") return "warn";
  return "reject";
}

async function logAdminAction({
  adminUserId,
  recordId,
  actionType,
  previousStatus,
  newStatus,
  memo
}: {
  adminUserId: string;
  recordId: string;
  actionType: AdminActionType;
  previousStatus?: string | null;
  newStatus?: string | null;
  memo?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  await supabase.from("admin_actions").insert({
    admin_user_id: adminUserId,
    record_id: recordId,
    action_type: actionType,
    previous_status: previousStatus ?? null,
    new_status: newStatus ?? null,
    memo: memo ?? null
  });
}

function buildAdminRedirect(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://localhost");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return `${url.pathname}${url.search}`;
}

export async function changeRecordStatusAction(formData: FormData) {
  const session = await requireRole("admin", "/admin/login");
  const admin = await getCurrentUserRow(session);
  const supabase = getSupabaseAdmin();

  try {
    const recordId = String(formData.get("record_id") ?? "");
    const nextStatus = String(formData.get("status") ?? "") as RecordStatus;
    const memo = String(formData.get("memo") ?? "").trim() || null;

    if (!["approved", "warning", "rejected"].includes(nextStatus)) {
      throw new Error("변경할 상태값이 올바르지 않습니다.");
    }

    const { data: existing, error: fetchError } = await supabase
      .from("records")
      .select("id, status")
      .eq("id", recordId)
      .single();

    if (fetchError || !existing) {
      throw new Error("대상 기록을 찾지 못했습니다.");
    }

    const { error } = await supabase
      .from("records")
      .update({
        status: nextStatus,
        warning_reason:
          nextStatus === "approved"
            ? null
            : memo || (nextStatus === "warning" ? "관리자 상태 변경" : "관리자 반려 처리")
      })
      .eq("id", recordId);

    if (error) {
      throw new Error("상태 변경에 실패했습니다.");
    }

    await logAdminAction({
      adminUserId: admin.id,
      recordId,
      actionType: actionTypeFromStatus(nextStatus),
      previousStatus: existing.status,
      newStatus: nextStatus,
      memo
    });

    revalidatePath("/admin/records");
    revalidatePath("/dashboard");
    revalidatePath("/records");
    revalidatePath("/leaderboard");
    redirect("/admin/records?updated=1");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildAdminRedirect("/admin/records", {
        error: error instanceof Error ? error.message : "상태 변경에 실패했습니다."
      })
    );
  }
}

export async function adminEditRecordAction(formData: FormData) {
  const session = await requireRole("admin", "/admin/login");
  const admin = await getCurrentUserRow(session);
  const supabase = getSupabaseAdmin();

  try {
    const recordId = String(formData.get("record_id") ?? "");
    const runDate = String(formData.get("run_date") ?? "");
    const distanceM = parseDistanceKm(formData.get("distance_km"));
    const paceSecPerKm = parsePaceToSeconds(formData.get("pace") ?? "");
    const note = String(formData.get("note") ?? "").trim() || null;
    const memo = String(formData.get("memo") ?? "").trim() || null;

    const { data: record, error: recordError } = await supabase
      .from("records")
      .select(
        "id, user_id, status, run_date, distance_m, users!inner(challenge_types:challenge_type_id!inner(start_date, end_date))"
      )
      .eq("id", recordId)
      .single();

    if (recordError || !record) {
      throw new Error("수정할 기록을 찾지 못했습니다.");
    }

    const { data: sameDayRecords, error: sameDayError } = await supabase
      .from("records")
      .select("id, distance_m")
      .eq("user_id", record.user_id)
      .eq("run_date", runDate);

    if (sameDayError) {
      throw new Error("기록 검증에 실패했습니다.");
    }

    const dailyDistanceM =
      (sameDayRecords ?? [])
        .filter((item) => item.id !== recordId)
        .reduce((sum, item) => sum + item.distance_m, 0) + distanceM;

    const userRelation = Array.isArray(record.users) ? record.users[0] : record.users;
    const challengeRelation = Array.isArray(userRelation.challenge_types)
      ? userRelation.challenge_types[0]
      : userRelation.challenge_types;

    if (!challengeRelation) {
      throw new Error("챌린지 정보를 찾지 못했습니다.");
    }
    const statusResult = evaluateRecordStatus({
      runDate,
      distanceM,
      paceSecPerKm,
      dailyDistanceM,
      challenge: challengeRelation
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
      .eq("id", recordId);

    if (error) {
      throw new Error("기록 수정에 실패했습니다.");
    }

    await logAdminAction({
      adminUserId: admin.id,
      recordId,
      actionType: "edit",
      previousStatus: record.status,
      newStatus: statusResult.status,
      memo
    });

    revalidatePath("/admin/records");
    revalidatePath("/dashboard");
    revalidatePath("/records");
    revalidatePath("/leaderboard");
    redirect("/admin/records?edited=1");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildAdminRedirect("/admin/records", {
        error: error instanceof Error ? error.message : "기록 수정에 실패했습니다."
      })
    );
  }
}
