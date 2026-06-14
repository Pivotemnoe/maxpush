import { cookies } from "next/headers";
import { randomToken } from "./crypto";

export const CSRF_COOKIE = "mp_csrf";

export function newCsrfToken() {
  return randomToken(32);
}

export function csrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  };
}

export async function requireCsrf(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new Error("Invalid CSRF token");
  }
}
