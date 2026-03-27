"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth/password";
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

const LEGACY_ADMIN_ACTION_TYPES = new Set<AdminActionType>(["approve", "warn", "reject", "edit"]);

async function logAdminAction({
  adminUserId,
  actionType,
  recordId,
  participantUserId,
  participantName,
  participantUsername,
  participantCode,
  runDate,
  previousStatus,
  newStatus,
  memo
}: {
  adminUserId: string;
  actionType: AdminActionType;
  recordId?: string | null;
  participantUserId?: string | null;
  participantName?: string | null;
  participantUsername?: string | null;
  participantCode?: string | null;
  runDate?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  memo?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const payload = {
    admin_user_id: adminUserId,
    record_id: recordId ?? null,
    action_type: actionType,
    participant_user_id: participantUserId ?? null,
    participant_name: participantName ?? null,
    participant_username: participantUsername ?? null,
    participant_code: participantCode ?? null,
    run_date: runDate ?? null,
    previous_status: previousStatus ?? null,
    new_status: newStatus ?? null,
    memo: memo ?? null
  };

  const { error } = await supabase.from("admin_actions").insert(payload);
  if (!error) {
    return;
  }

  if (recordId && LEGACY_ADMIN_ACTION_TYPES.has(actionType)) {
    const { error: legacyError } = await supabase.from("admin_actions").insert({
      admin_user_id: adminUserId,
      record_id: recordId,
      action_type: actionType,
      previous_status: previousStatus ?? null,
      new_status: newStatus ?? null,
      memo: memo ?? null
    });

    if (!legacyError) {
      return;
    }

    console.error("[admin-actions]", legacyError.message);
    return;
  }

  console.error("[admin-actions]", error.message);
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
      .select("id, status, run_date, users!inner(id, name, username, participant_code)")
      .eq("id", recordId)
      .single();

    if (fetchError || !existing) {
      throw new Error("대상 기록을 찾지 못했습니다.");
    }

    const participant = Array.isArray(existing.users) ? existing.users[0] : existing.users;

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
      participantUserId: participant?.id ?? null,
      participantName: participant?.name ?? null,
      participantUsername: participant?.username ?? null,
      participantCode: participant?.participant_code ?? null,
      runDate: existing.run_date,
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
        "id, user_id, status, run_date, distance_m, users!inner(id, name, username, participant_code, challenge_types:challenge_type_id!inner(start_date, end_date))"
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
      participantUserId: userRelation.id,
      participantName: userRelation.name,
      participantUsername: userRelation.username,
      participantCode: userRelation.participant_code,
      runDate,
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

export async function toggleParticipantActiveAction(formData: FormData) {
  const session = await requireRole("admin", "/admin/login");
  await getCurrentUserRow(session);
  const supabase = getSupabaseAdmin();

  try {
    const userId = String(formData.get("user_id") ?? "");
    const nextActive = String(formData.get("next_active") ?? "") === "true";

    if (!userId) {
      throw new Error("대상 참가자를 찾지 못했습니다.");
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from("users")
      .select("id, role, is_active, name, username, participant_code, session_version")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser || targetUser.role !== "participant") {
      throw new Error("대상 참가자를 찾지 못했습니다.");
    }

    const { error } = await supabase
      .from("users")
      .update({
        is_active: nextActive,
        session_version: (targetUser.session_version ?? 0) + 1
      })
      .eq("id", userId);

    if (error) {
      throw new Error("참가자 상태 변경에 실패했습니다.");
    }

    await logAdminAction({
      adminUserId: session.id,
      actionType: nextActive ? "participant_activate" : "participant_deactivate",
      participantUserId: targetUser.id,
      participantName: targetUser.name,
      participantUsername: targetUser.username,
      participantCode: targetUser.participant_code,
      memo: `상태 변경: ${targetUser.is_active ? "활성" : "비활성"} -> ${nextActive ? "활성" : "비활성"}`
    });

    revalidatePath("/admin/participants");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/records");
    revalidatePath("/leaderboard");
    redirect(`/admin/participants?updated=${nextActive ? "activated" : "deactivated"}`);
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildAdminRedirect("/admin/participants", {
        error: error instanceof Error ? error.message : "참가자 상태 변경에 실패했습니다."
      })
    );
  }
}

export async function deleteParticipantAction(formData: FormData) {
  const session = await requireRole("admin", "/admin/login");
  const admin = await getCurrentUserRow(session);
  const supabase = getSupabaseAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const adminPassword = String(formData.get("admin_password") ?? "");
  const returnTo = String(formData.get("return_to") ?? "/admin/participants");

  try {
    if (!userId) {
      throw new Error("삭제할 참가자를 찾지 못했습니다.");
    }

    if (!adminPassword) {
      throw new Error("관리자 비밀번호를 입력해 주세요.");
    }

    if (!verifyPassword(adminPassword, admin.password_hash)) {
      throw new Error("관리자 비밀번호가 올바르지 않습니다.");
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from("users")
      .select("id, role, name, username, participant_code")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser || targetUser.role !== "participant") {
      throw new Error("삭제할 참가자를 찾지 못했습니다.");
    }

    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      throw new Error("참가자 삭제에 실패했습니다.");
    }

    await logAdminAction({
      adminUserId: admin.id,
      actionType: "participant_delete",
      participantName: targetUser.name,
      participantUsername: targetUser.username,
      participantCode: targetUser.participant_code,
      memo: "참가자 계정 및 연관 기록 삭제"
    });

    revalidatePath("/admin/participants");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/records");
    revalidatePath("/leaderboard");
    redirect("/admin/participants?updated=deleted");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildAdminRedirect(returnTo, {
        error: error instanceof Error ? error.message : "참가자 삭제에 실패했습니다."
      })
    );
  }
}

export async function updateParticipantBranchAction(formData: FormData) {
  const session = await requireRole("admin", "/admin/login");
  await getCurrentUserRow(session);
  const supabase = getSupabaseAdmin();

  try {
    const userId = String(formData.get("user_id") ?? "");
    const branchId = String(formData.get("branch_id") ?? "");
    const returnTo = String(formData.get("return_to") ?? "/admin/participants");

    if (!userId) {
      throw new Error("대상 참가자를 찾지 못했습니다.");
    }

    if (!branchId) {
      throw new Error("변경할 지점을 선택해 주세요.");
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from("users")
      .select("id, role, branch_id, name, username, participant_code, branches:branch_id(name)")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser || targetUser.role !== "participant") {
      throw new Error("대상 참가자를 찾지 못했습니다.");
    }

    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("id, name")
      .eq("id", branchId)
      .single();

    if (branchError || !branch) {
      throw new Error("선택한 지점 정보를 찾지 못했습니다.");
    }

    const { error } = await supabase
      .from("users")
      .update({
        branch_id: branchId
      })
      .eq("id", userId);

    if (error) {
      throw new Error("지점 수정에 실패했습니다.");
    }

    const currentBranch = Array.isArray(targetUser.branches) ? targetUser.branches[0] : targetUser.branches;

    await logAdminAction({
      adminUserId: session.id,
      actionType: "participant_branch_update",
      participantUserId: targetUser.id,
      participantName: targetUser.name,
      participantUsername: targetUser.username,
      participantCode: targetUser.participant_code,
      memo: `지점 변경: ${currentBranch?.name ?? "미지정"} -> ${branch.name}`
    });

    revalidatePath("/admin/participants");
    revalidatePath(`/admin/participants/${userId}`);
    revalidatePath("/admin/overview");
    revalidatePath("/admin/records");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    redirect(buildAdminRedirect(`/admin/participants/${userId}`, { updated: "branch" }));
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildAdminRedirect(String(formData.get("return_to") ?? "/admin/participants"), {
        error: error instanceof Error ? error.message : "지점 수정에 실패했습니다."
      })
    );
  }
}
