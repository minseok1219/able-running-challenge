import { createHash } from "crypto";

import { getSupabaseAdmin } from "@/lib/supabase/server";

type LoginScope = "participant" | "admin";
type LoginLimitDimension = "account" | "ip";

type RateLimitEntry = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
};

type PersistentRateLimitRow = {
  key: string;
  attempt_count: number;
  first_attempt_at: string;
  blocked_until: string | null;
};

type PersistentRateLimitResult = {
  available: boolean;
  entry: PersistentRateLimitRow | null;
};

type LoginAttemptTarget = {
  key: string;
  scope: LoginScope;
  dimension: LoginLimitDimension;
  subject: string;
};

type LimitConfig = {
  maxAttempts: number;
  windowMs: number;
  blockMs: number;
};

const LIMITS: Record<LoginScope, Record<LoginLimitDimension, LimitConfig>> = {
  participant: {
    account: {
      maxAttempts: 5,
      windowMs: 10 * 60 * 1000,
      blockMs: 10 * 60 * 1000
    },
    ip: {
      maxAttempts: 15,
      windowMs: 10 * 60 * 1000,
      blockMs: 10 * 60 * 1000
    }
  },
  admin: {
    account: {
      maxAttempts: 5,
      windowMs: 10 * 60 * 1000,
      blockMs: 30 * 60 * 1000
    },
    ip: {
      maxAttempts: 12,
      windowMs: 10 * 60 * 1000,
      blockMs: 30 * 60 * 1000
    }
  }
};

const loginAttempts = new Map<string, RateLimitEntry>();
const warnedPersistentFallbackKeys = new Set<string>();

function now() {
  return Date.now();
}

function getLimit(target: LoginAttemptTarget) {
  return LIMITS[target.scope][target.dimension];
}

function hashIpAddress(ipAddress: string) {
  return createHash("sha256").update(ipAddress).digest("hex");
}

function warnPersistentFallback(target: LoginAttemptTarget, message: string) {
  const warnKey = `${target.scope}:${target.dimension}`;
  if (warnedPersistentFallbackKeys.has(warnKey)) {
    return;
  }

  warnedPersistentFallbackKeys.add(warnKey);
  console.error(`[rate-limit] Falling back to in-memory storage for ${warnKey}: ${message}`);
}

function getMemoryEntry(target: LoginAttemptTarget) {
  const entry = loginAttempts.get(target.key);
  if (!entry) {
    return null;
  }

  const current = now();
  const limit = getLimit(target);
  if (entry.blockedUntil <= current && current - entry.firstAttemptAt > limit.windowMs) {
    loginAttempts.delete(target.key);
    return null;
  }

  return entry;
}

function assertMemoryAttemptsAllowed(target: LoginAttemptTarget) {
  const entry = getMemoryEntry(target);
  if (!entry) {
    return;
  }

  if (entry.blockedUntil > now()) {
    throw new Error("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }
}

function recordMemoryFailedAttempt(target: LoginAttemptTarget) {
  const current = now();
  const entry = getMemoryEntry(target);
  const limit = getLimit(target);

  if (!entry || current - entry.firstAttemptAt > limit.windowMs) {
    loginAttempts.set(target.key, {
      count: 1,
      firstAttemptAt: current,
      blockedUntil: 0
    });
    return;
  }

  const nextCount = entry.count + 1;
  loginAttempts.set(target.key, {
    count: nextCount,
    firstAttemptAt: entry.firstAttemptAt,
    blockedUntil: nextCount >= limit.maxAttempts ? current + limit.blockMs : 0
  });
}

async function readPersistentEntry(target: LoginAttemptTarget) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("login_attempts")
      .select("key, attempt_count, first_attempt_at, blocked_until")
      .eq("key", target.key)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      available: true,
      entry: (data as PersistentRateLimitRow | null) ?? null
    } satisfies PersistentRateLimitResult;
  } catch (error) {
    warnPersistentFallback(
      target,
      error instanceof Error ? error.message : "Persistent login attempt storage is unavailable."
    );
    return {
      available: false,
      entry: null
    } satisfies PersistentRateLimitResult;
  }
}

async function assertPersistentAttemptsAllowed(target: LoginAttemptTarget) {
  const result = await readPersistentEntry(target);
  if (!result.available) {
    return false;
  }

  if (!result.entry?.blocked_until) {
    return true;
  }

  if (new Date(result.entry.blocked_until).getTime() > now()) {
    throw new Error("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }

  return true;
}

async function recordPersistentFailedAttempt(target: LoginAttemptTarget) {
  const result = await readPersistentEntry(target);
  if (!result.available) {
    return false;
  }

  const existing = result.entry;
  const current = now();
  const limit = getLimit(target);
  const firstAttemptAt =
    !existing || current - new Date(existing.first_attempt_at).getTime() > limit.windowMs
      ? current
      : new Date(existing.first_attempt_at).getTime();
  const nextCount =
    !existing || current - new Date(existing.first_attempt_at).getTime() > limit.windowMs
      ? 1
      : existing.attempt_count + 1;
  const blockedUntil = nextCount >= limit.maxAttempts ? current + limit.blockMs : 0;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("login_attempts").upsert(
      {
        key: target.key,
        scope: target.scope,
        dimension: target.dimension,
        subject: target.subject,
        attempt_count: nextCount,
        first_attempt_at: new Date(firstAttemptAt).toISOString(),
        blocked_until: blockedUntil ? new Date(blockedUntil).toISOString() : null,
        updated_at: new Date(current).toISOString()
      },
      {
        onConflict: "key"
      }
    );

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    warnPersistentFallback(
      target,
      error instanceof Error ? error.message : "Unable to persist failed login attempts."
    );
    return false;
  }
}

async function clearPersistentFailedAttempts(target: LoginAttemptTarget) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("login_attempts").delete().eq("key", target.key);
    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    warnPersistentFallback(
      target,
      error instanceof Error ? error.message : "Unable to clear persistent login attempt state."
    );
    return false;
  }
}

export function buildLoginAttemptTargets({
  scope,
  identifier,
  ipAddress
}: {
  scope: LoginScope;
  identifier: string;
  ipAddress?: string | null;
}) {
  const targets: LoginAttemptTarget[] = [];
  const normalizedIdentifier = identifier.trim().toLowerCase();

  if (normalizedIdentifier) {
    targets.push({
      key: `${scope}:account:${normalizedIdentifier}`,
      scope,
      dimension: "account",
      subject: normalizedIdentifier
    });
  }

  if (ipAddress?.trim()) {
    const hashedIp = hashIpAddress(ipAddress.trim());
    targets.push({
      key: `${scope}:ip:${hashedIp}`,
      scope,
      dimension: "ip",
      subject: hashedIp
    });
  }

  return targets;
}

export async function assertLoginAttemptsAllowed(targets: LoginAttemptTarget[]) {
  for (const target of targets) {
    const persistentChecked = await assertPersistentAttemptsAllowed(target);
    if (!persistentChecked) {
      assertMemoryAttemptsAllowed(target);
    }
  }
}

export async function recordFailedLoginAttempt(targets: LoginAttemptTarget[]) {
  for (const target of targets) {
    const persisted = await recordPersistentFailedAttempt(target);
    if (!persisted) {
      recordMemoryFailedAttempt(target);
    }
  }
}

export async function clearFailedLoginAttempts(targets: LoginAttemptTarget[]) {
  for (const target of targets) {
    const clearedPersistent = await clearPersistentFailedAttempts(target);
    if (!clearedPersistent) {
      loginAttempts.delete(target.key);
      continue;
    }

    loginAttempts.delete(target.key);
  }
}
