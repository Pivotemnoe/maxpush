import crypto from "crypto";

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function randomPairingCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");
}

export function normalizePairingCode(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.toUpperCase().replace(/[\s-]+/g, "");
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(clean) ? clean : null;
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  const unsafe =
    !secret ||
    secret === "dev-only-change-me" ||
    secret === "change-me-long-random-secret" ||
    secret.length < 32;

  if (unsafe && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to a long random value in production");
  }

  return secret || "dev-only-change-me";
}

export function sign(value: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function makeSignedCookie(value: string) {
  return `${value}.${sign(value)}`;
}

export function verifySignedCookie(cookieValue: string | undefined) {
  if (!cookieValue) return null;
  const [value, signature] = cookieValue.split(".");
  if (!value || !signature) return null;
  const expected = sign(value);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? value : null;
}
