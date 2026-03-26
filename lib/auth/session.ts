import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import type { SessionUser } from "@/types/db";

const SESSION_COOKIE = "arc_session";
const REMEMBERED_USERNAME_COOKIE = "arc_remembered_username";
const PARTICIPANT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export async function createSessionCookie(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = sign(payload);
  const maxAge = user.role === "admin" ? ADMIN_SESSION_MAX_AGE : PARTICIPANT_SESSION_MAX_AGE;

  (await cookies()).set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function setRememberedUsernameCookie(username: string) {
  (await cookies()).set(REMEMBERED_USERNAME_COOKIE, username, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearRememberedUsernameCookie() {
  (await cookies()).delete(REMEMBERED_USERNAME_COOKIE);
}

export async function readRememberedUsernameCookie() {
  return (await cookies()).get(REMEMBERED_USERNAME_COOKIE)?.value ?? "";
}

export async function readSessionCookie(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}
