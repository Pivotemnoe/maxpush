import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    const [pwaCount, android] = await Promise.all([
      prisma.pushSubscription.count({ where: { userId, active: true } }),
      prisma.device.findFirst({ where: { userId, type: "android_relay", active: true }, orderBy: { createdAt: "desc" } })
    ]);
    return NextResponse.json({
      pwa_subscriptions_count: pwaCount,
      android_device: android ? {
        id: android.id,
        name: android.name,
        active: android.active,
        last_seen_at: android.lastSeenAt?.toISOString() ?? null
      } : null
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
