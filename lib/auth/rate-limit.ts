type RateLimitEntry = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
};

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_BLOCK_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

const loginAttempts = new Map<string, RateLimitEntry>();

function now() {
  return Date.now();
}

function getEntry(key: string) {
  const entry = loginAttempts.get(key);
  if (!entry) {
    return null;
  }

  const current = now();
  if (entry.blockedUntil <= current && current - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return null;
  }

  return entry;
}

export function assertLoginAttemptsAllowed(key: string) {
  const entry = getEntry(key);
  if (!entry) {
    return;
  }

  if (entry.blockedUntil > now()) {
    throw new Error("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }
}

export function recordFailedLoginAttempt(key: string) {
  const current = now();
  const entry = getEntry(key);

  if (!entry || current - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, {
      count: 1,
      firstAttemptAt: current,
      blockedUntil: 0
    });
    return;
  }

  const nextCount = entry.count + 1;
  loginAttempts.set(key, {
    count: nextCount,
    firstAttemptAt: entry.firstAttemptAt,
    blockedUntil: nextCount >= MAX_LOGIN_ATTEMPTS ? current + LOGIN_BLOCK_MS : 0
  });
}

export function clearFailedLoginAttempts(key: string) {
  loginAttempts.delete(key);
}
