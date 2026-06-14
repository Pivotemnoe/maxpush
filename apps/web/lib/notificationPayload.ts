import { z } from "zod";

export const FORBIDDEN_NOTIFICATION_FIELDS = [
  "body",
  "text",
  "message",
  "content",
  "notificationText",
  "rawExtras"
] as const;

export const ANDROID_ALLOWED_PACKAGE = process.env.ANDROID_ALLOWED_PACKAGE || "ru.oneme.app";

export const AndroidNotificationSchema = z.object({
  event_id: z.string().min(8).max(256).regex(/^[A-Za-z0-9._:-]+$/),
  sender: z.string().trim().max(120).optional().nullable(),
  posted_at: z.number().int().positive(),
  package_name: z.string(),
  privacy_mode: z.literal("sender_only")
}).strict();

export function findForbiddenFields(payload: unknown, prefix = "") {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [] as string[];
  const obj = payload as Record<string, unknown>;
  const found: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if ((FORBIDDEN_NOTIFICATION_FIELDS as readonly string[]).includes(key)) found.push(path);
    found.push(...findForbiddenFields(value, path));
  }
  return found;
}

export function sanitizeSender(sender: string | null | undefined) {
  if (!sender) return null;
  const clean = sender.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return clean.length > 0 ? clean.slice(0, 120) : null;
}

export function validateAndroidNotificationPayload(payload: unknown) {
  const forbidden = findForbiddenFields(payload);
  if (forbidden.length > 0) {
    return { ok: false as const, status: 400, error: `Forbidden fields: ${forbidden.join(", ")}` };
  }
  const parsed = AndroidNotificationSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false as const, status: 400, error: parsed.error.message };
  }
  if (parsed.data.package_name !== ANDROID_ALLOWED_PACKAGE) {
    return { ok: false as const, status: 400, error: "Unsupported package_name" };
  }
  const postedAt = new Date(parsed.data.posted_at < 1_000_000_000_000 ? parsed.data.posted_at * 1000 : parsed.data.posted_at);
  if (Number.isNaN(postedAt.getTime()) || postedAt.getTime() > Date.now() + 5 * 60_000) {
    return { ok: false as const, status: 400, error: "Invalid posted_at" };
  }
  return {
    ok: true as const,
    data: {
      eventId: parsed.data.event_id,
      sender: sanitizeSender(parsed.data.sender),
      postedAt,
      packageName: parsed.data.package_name,
      privacyMode: parsed.data.privacy_mode
    }
  };
}
