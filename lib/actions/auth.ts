"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearRememberedUsernameCookie,
  createSessionCookie,
  clearSessionCookie,
  setRememberedUsernameCookie
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  assertLoginAttemptsAllowed,
  clearFailedLoginAttempts,
  recordFailedLoginAttempt
} from "@/lib/auth/rate-limit";
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

    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    const name = String(formData.get("name") ?? "");
    const phoneLast4 = String(formData.get("phone_last4") ?? "");
    const password = String(formData.get("password") ?? "");
    const branchId = String(formData.get("branch_id") ?? "");
    const challengeTypeId = String(formData.get("challenge_type_id") ?? "");

    validateSignupInput({ username, name, phoneLast4, password, branchId, challengeTypeId });

    const supabase = getSupabaseAdmin();
    const participantCode = await generateParticipantCode();

    const { error } = await supabase.from("users").insert({
      participant_code: participantCode,
      username,
      name,
      phone_last4: phoneLast4,
      password_hash: hashPassword(password),
      branch_id: branchId,
      challenge_type_id: challengeTypeId,
      role: "participant"
    });

    if (error) {
      if (error.code === "23505") {
        throw new Error("이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.");
      }

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
  field: "participant_code" | "username" | "name";
  value: string;
  role: "participant" | "admin";
  password: string;
}) {
  const supabase = getSupabaseAdmin();
  const invalidCredentialMessage =
    role === "participant"
      ? "아이디 또는 비밀번호를 확인해주세요."
      : "관리자 계정 정보가 올바르지 않습니다.";
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, participant_code, username, name, phone_last4, password_hash, branch_id, challenge_type_id, role, is_active, created_at, updated_at"
    )
    .eq(field, value)
    .eq("role", role)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error("로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }

  if (!data) {
    throw new Error(invalidCredentialMessage);
  }

  const user = data as UserRow;
  if (!verifyPassword(password, user.password_hash)) {
    throw new Error(invalidCredentialMessage);
  }

  return user;
}

export async function participantLoginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const rememberUsername = formData.get("remember_username") === "on";
  const rateLimitKey = `participant:${username}`;

  try {
    if (!hasSupabaseEnv()) {
      throw new Error("Supabase 환경설정이 없어 로그인을 처리할 수 없습니다. .env.local을 먼저 설정해주세요.");
    }

    const password = String(formData.get("password") ?? "");

    validateParticipantLoginInput(username, password);
    assertLoginAttemptsAllowed(rateLimitKey);
    const user = await findUserByCredentials({
      field: "username",
      value: username,
      role: "participant",
      password
    });

    const sessionUser: SessionUser = {
      id: user.id,
      role: "participant",
      name: user.name,
      username: user.username,
      participantCode: user.participant_code
    };

    await createSessionCookie(sessionUser);
    if (rememberUsername) {
      await setRememberedUsernameCookie(username);
    } else {
      await clearRememberedUsernameCookie();
    }
    clearFailedLoginAttempts(rateLimitKey);
    revalidatePath("/dashboard");
    redirect("/dashboard");
  } catch (error) {
    rethrowIfRedirectError(error);
    if (username) {
      recordFailedLoginAttempt(rateLimitKey);
    }
    redirect(
      buildRedirect("/login", {
        error: error instanceof Error ? error.message : "로그인에 실패했습니다."
      })
    );
  }
}

export async function adminLoginAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const rateLimitKey = `admin:${name.toLowerCase()}`;

  try {
    if (!hasSupabaseEnv()) {
      throw new Error("Supabase 환경설정이 없어 관리자 로그인을 처리할 수 없습니다. .env.local을 먼저 설정해주세요.");
    }

    const password = String(formData.get("password") ?? "");

    validateAdminLoginInput(name, password);
    assertLoginAttemptsAllowed(rateLimitKey);
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
      username: user.username,
      participantCode: user.participant_code
    };

    await createSessionCookie(sessionUser);
    clearFailedLoginAttempts(rateLimitKey);
    revalidatePath("/admin/overview");
    redirect("/admin/overview");
  } catch (error) {
    rethrowIfRedirectError(error);
    if (name) {
      recordFailedLoginAttempt(rateLimitKey);
    }
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
