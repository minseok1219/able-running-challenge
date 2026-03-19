import { redirect } from "next/navigation";

import { clearSessionCookie, readSessionCookie } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { SessionUser, UserRole, UserRow } from "@/types/db";

export async function getCurrentSession() {
  return readSessionCookie();
}

async function validateActiveSession(session: SessionUser, roles: UserRole[]) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", session.id)
    .maybeSingle();

  if (
    error ||
    !data ||
    !data.is_active ||
    data.role !== session.role ||
    !roles.includes(data.role as UserRole)
  ) {
    await clearSessionCookie();
    return false;
  }

  return true;
}

export async function requireRole(role: UserRole, redirectTo: string) {
  const session = await getCurrentSession();
  if (!session || session.role !== role || !(await validateActiveSession(session, [role]))) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireAnyRole(roles: UserRole[], redirectTo: string) {
  const session = await getCurrentSession();
  if (!session || !roles.includes(session.role) || !(await validateActiveSession(session, roles))) {
    redirect(redirectTo);
  }

  return session;
}

export async function getCurrentUserRow(session: SessionUser): Promise<UserRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, participant_code, username, name, phone_last4, password_hash, branch_id, challenge_type_id, role, is_active, created_at, updated_at, branches:branch_id(id, code, name, sort_order), challenge_types:challenge_type_id(id, code, name, target_distance_m, start_date, end_date, sort_order)"
    )
    .eq("id", session.id)
    .single();

  if (error || !data) {
    await clearSessionCookie();
    redirect("/login");
  }

  if (!data.is_active || data.role !== session.role) {
    await clearSessionCookie();
    throw new Error("사용자 정보를 불러오지 못했습니다.");
  }

  return data as unknown as UserRow;
}
