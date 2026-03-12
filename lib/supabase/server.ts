import { createClient } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "@/lib/config/runtime";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabaseEnv() || !url || !key) {
    throw new Error("Supabase environment variables are required.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
