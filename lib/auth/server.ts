import { redirect } from "next/navigation";

import { readSessionCookie } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { SessionUser, UserRole, UserRow } from "@/types/db";

export async function getCurrentSession() {
  return readSessionCookie();
}

function buildSessionResetRedirectPath(redirectTo: string) {
  const target =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/login";

  return `/auth/session/clear?redirect=${encodeURIComponent(target)}`;
}

async function validateActiveSession(session: SessionUser, roles: UserRole[]) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, role, is_active, session_version")
    .eq("id", session.id)
    .maybeSingle();

  if (
    error ||
    !data ||
    !data.is_active ||
    data.role !== session.role ||
    data.session_version !== session.sessionVersion ||
    !roles.includes(data.role as UserRole)
  ) {
    return false;
  }

  return true;
}

export async function requireRole(role: UserRole, redirectTo: string) {
  const session = await getCurrentSession();
  if (!session || session.role !== role || !(await validateActiveSession(session, [role]))) {
    redirect(buildSessionResetRedirectPath(redirectTo));
  }

  return session;
}

export async function requireAnyRole(roles: UserRole[], redirectTo: string) {
  const session = await getCurrentSession();
  if (!session || !roles.includes(session.role) || !(await validateActiveSession(session, roles))) {
    redirect(buildSessionResetRedirectPath(redirectTo));
  }

  return session;
}

export async function getCurrentUserRow(session: SessionUser): Promise<UserRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, participant_code, username, name, phone_last4, password_hash, branch_id, challenge_type_id, role, is_active, session_version, created_at, updated_at, branches:branch_id(id, code, name, sort_order), challenge_types:challenge_type_id(id, code, name, target_distance_m, start_date, end_date, sort_order)"
    )
    .eq("id", session.id)
    .single();

  if (error || !data) {
    redirect(buildSessionResetRedirectPath("/login"));
  }

  if (!data.is_active || data.role !== session.role) {
    redirect(buildSessionResetRedirectPath("/login"));
  }

  return data as unknown as UserRow;
}
