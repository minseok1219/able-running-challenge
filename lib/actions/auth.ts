"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hasSupabaseEnv } from "@/lib/config/runtime";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rethrowIfRedirectError } from "@/lib/utils/redirect";
import { generateParticipantCode } from "@/lib/supabase/queries";
import {
  validateAdminLoginInput,
  validateParticipantLoginInput,
  validateSignupInput
} from "@/lib/validators/auth";
import type { SessionUser, UserRow } from "@/types/db";

function buildRedirect(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://localhost");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return `${url.pathname}${url.search}`;
}

export async function signupAction(formData: FormData) {
  try {
    if (!hasSupabaseEnv()) {
      throw new Error("Supabase 환경설정이 없어 가입을 처리할 수 없습니다. .env.local을 먼저 설정해주세요.");
    }

    const name = String(formData.get("name") ?? "");
    const phoneLast4 = String(formData.get("phone_last4") ?? "");
    const password = String(formData.get("password") ?? "");
    const branchId = String(formData.get("branch_id") ?? "");
    const challengeTypeId = String(formData.get("challenge_type_id") ?? "");

    validateSignupInput({ name, phoneLast4, password, branchId, challengeTypeId });

    const supabase = getSupabaseAdmin();
    const participantCode = await generateParticipantCode();

    const { error } = await supabase.from("users").insert({
      participant_code: participantCode,
      name,
      phone_last4: phoneLast4,
      password_hash: hashPassword(password),
      branch_id: branchId,
      challenge_type_id: challengeTypeId,
      role: "participant"
    });

    if (error) {
      throw new Error("가입 처리 중 오류가 발생했습니다.");
    }

    redirect(
      buildRedirect("/signup", {
        success: "1",
        participantCode
      })
    );
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildRedirect("/signup", {
        error: error instanceof Error ? error.message : "가입에 실패했습니다."
      })
    );
  }
}

async function findUserByCredentials({
  field,
  value,
  role,
  password
}: {
  field: "participant_code" | "name";
  value: string;
  role: "participant" | "admin";
  password: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, participant_code, name, phone_last4, password_hash, branch_id, challenge_type_id, role, is_active, created_at, updated_at"
    )
    .eq(field, value)
    .eq("role", role)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`DB 조회 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      role === "participant"
        ? "participant_code 계정을 찾지 못했습니다."
        : "관리자 계정을 찾지 못했습니다."
    );
  }

  const user = data as UserRow;
  if (!verifyPassword(password, user.password_hash)) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }

  return user;
}

export async function participantLoginAction(formData: FormData) {
  try {
    if (!hasSupabaseEnv()) {
      throw new Error("Supabase 환경설정이 없어 로그인을 처리할 수 없습니다. .env.local을 먼저 설정해주세요.");
    }

    const participantCode = String(formData.get("participant_code") ?? "").trim().toUpperCase();
    const password = String(formData.get("password") ?? "");

    validateParticipantLoginInput(participantCode, password);
    const user = await findUserByCredentials({
      field: "participant_code",
      value: participantCode,
      role: "participant",
      password
    });

    const sessionUser: SessionUser = {
      id: user.id,
      role: "participant",
      name: user.name,
      participantCode: user.participant_code
    };

    await createSessionCookie(sessionUser);
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildRedirect("/login", {
        error: error instanceof Error ? error.message : "로그인에 실패했습니다."
      })
    );
  }
}

export async function adminLoginAction(formData: FormData) {
  try {
    if (!hasSupabaseEnv()) {
      throw new Error("Supabase 환경설정이 없어 관리자 로그인을 처리할 수 없습니다. .env.local을 먼저 설정해주세요.");
    }

    const name = String(formData.get("name") ?? "");
    const password = String(formData.get("password") ?? "");

    validateAdminLoginInput(name, password);
    const user = await findUserByCredentials({
      field: "name",
      value: name,
      role: "admin",
      password
    });

    const sessionUser: SessionUser = {
      id: user.id,
      role: "admin",
      name: user.name,
      participantCode: user.participant_code
    };

    await createSessionCookie(sessionUser);
    revalidatePath("/admin/overview");
    redirect("/admin/overview");
  } catch (error) {
    rethrowIfRedirectError(error);
    redirect(
      buildRedirect("/admin/login", {
        error: error instanceof Error ? error.message : "관리자 로그인에 실패했습니다."
      })
    );
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}
