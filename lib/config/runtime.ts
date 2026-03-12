import type { Branch, ChallengeType } from "@/types/db";

function isPlaceholder(value: string | undefined) {
  if (!value) return true;

  return (
    value.includes("your-project.supabase.co") ||
    value.includes("your-service-role-key") ||
    value.includes("replace-with")
  );
}

export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.SESSION_SECRET;

  return !isPlaceholder(url) && !isPlaceholder(key) && !isPlaceholder(secret);
}

export function allowLocalChallengeTesting() {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_LOCAL_CHALLENGE_TESTING === "true";
}

export const fallbackBranches: Branch[] = [
  { id: "branch-jamsil", code: "jamsil", name: "잠실", sort_order: 1 },
  { id: "branch-munjeong", code: "munjeong", name: "문정", sort_order: 2 },
  { id: "branch-hanam", code: "hanam", name: "하남", sort_order: 3 },
  { id: "branch-geoyeo", code: "geoyeo", name: "거여", sort_order: 4 }
];

export const fallbackChallengeTypes: ChallengeType[] = [
  {
    id: "challenge-100km",
    code: "100km",
    name: "100km",
    target_distance_m: 100000,
    start_date: "2026-03-23",
    end_date: "2026-04-26",
    sort_order: 1
  },
  {
    id: "challenge-160km",
    code: "160km",
    name: "100 miles (160km)",
    target_distance_m: 160000,
    start_date: "2026-03-23",
    end_date: "2026-05-16",
    sort_order: 2
  }
];
