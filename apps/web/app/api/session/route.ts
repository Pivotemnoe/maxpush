import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, SESSION_COOKIE, sessionCookieValue } from "@/lib/auth";
import { CSRF_COOKIE, csrfCookieOptions, newCsrfToken } from "@/lib/csrf";

export async function POST() {
  const existingUserId = await getCurrentUserId();
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(CSRF_COOKIE)?.value || newCsrfToken();
  if (existingUserId) {
    const res = NextResponse.json({ user_id: existingUserId, created: false });
    res.cookies.set(CSRF_COOKIE, csrfToken, csrfCookieOptions());
    return res;
  }

  const user = await prisma.user.create({ data: {} });
  const res = NextResponse.json({ user_id: user.id, created: true });
  res.cookies.set(SESSION_COOKIE, sessionCookieValue(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  res.cookies.set(CSRF_COOKIE, csrfToken, csrfCookieOptions());
  return res;
}
