import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUserId } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(20).max(512),
    auth: z.string().min(10).max(256)
  }).strict()
}).strict();

export async function POST(request: Request) {
  try {
    await requireCsrf(request);
    const userId = await requireCurrentUserId();
    const parsed = PushSubscriptionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    const { endpoint, keys } = parsed.data;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh: keys.p256dh, auth: keys.auth, active: true },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, active: true }
    });

    await prisma.device.upsert({
      where: { id: `pwa-${userId}` },
      update: { active: true, lastSeenAt: new Date() },
      create: { id: `pwa-${userId}`, userId, type: "iphone_pwa", name: "iPhone PWA", active: true, lastSeenAt: new Date() }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
