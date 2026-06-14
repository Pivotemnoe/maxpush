import crypto from "crypto";
import { cookies } from "next/headers";
import { makeSignedCookie, verifySignedCookie } from "./crypto";
import { prisma } from "./prisma";

export const ADMIN_SESSION_COOKIE = "mp_admin";
const ADMIN_ID = "admin";
const PASSWORD_MIN_LENGTH = 10;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,40}$/;

export function adminRedirectUrl(path = "/admin") {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://notifymax.ru";
  return new URL(path, baseUrl);
}

export function normalizeAdminUsername(username: unknown) {
  if (typeof username !== "string") return null;
  const clean = username.trim().toLowerCase();
  return clean || null;
}

export function validateAdminUsername(username: unknown) {
  const clean = normalizeAdminUsername(username);
  if (!clean || !USERNAME_PATTERN.test(clean)) {
    return "Логин должен быть от 3 до 40 символов: латиница, цифры, точка, дефис или подчёркивание.";
  }
  return null;
}

export function validateAdminPassword(password: unknown) {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов.`;
  }
  return null;
}

export function hashAdminPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyAdminPassword(password: string, storedHash: string) {
  const [method, salt, hash] = storedHash.split("$");
  if (method !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64url");
  const actual = crypto.scryptSync(password, salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function adminCookieOptions(maxAge = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  };
}

export async function getAdminCredential() {
  return prisma.adminCredential.findUnique({ where: { id: ADMIN_ID } });
}

export async function upsertAdminCredential(username: string, password: string) {
  const passwordHash = hashAdminPassword(password);
  return prisma.adminCredential.upsert({
    where: { id: ADMIN_ID },
    create: { id: ADMIN_ID, username, passwordHash },
    update: { username, passwordHash }
  });
}

export function adminSessionValue(updatedAt: Date) {
  return makeSignedCookie(`admin:${updatedAt.getTime()}`);
}

export async function getAdminSession() {
  const credential = await getAdminCredential();
  if (!credential) return null;

  const cookieStore = await cookies();
  const value = verifySignedCookie(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (value !== `admin:${credential.updatedAt.getTime()}`) return null;

  return credential;
}

export async function requireAdminSession() {
  const credential = await getAdminSession();
  if (!credential) throw new Error("Admin unauthorized");
  return credential;
}
