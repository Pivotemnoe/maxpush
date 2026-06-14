import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { makeSignedCookie, verifySignedCookie } from "./crypto";

export const SESSION_COOKIE = "mp_session";

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const userId = verifySignedCookie(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return user?.id ?? null;
}

export async function requireCurrentUserId() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export function sessionCookieValue(userId: string) {
  return makeSignedCookie(userId);
}
