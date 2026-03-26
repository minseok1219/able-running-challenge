import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/login";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const redirectPath = getSafeRedirectPath(request.nextUrl.searchParams.get("redirect"));
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  response.cookies.delete(SESSION_COOKIE);

  return response;
}
