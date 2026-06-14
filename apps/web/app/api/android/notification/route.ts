import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";
import { validateAndroidNotificationPayload } from "@/lib/notificationPayload";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendPushToUser } from "@/lib/webpush";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  if (!token) return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });

  const device = await prisma.device.findFirst({
    where: { tokenHash: sha256(token), type: "android_relay", active: true }
  });
  if (!device) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  if (!checkRateLimit(device.id, 120)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const validation = validateAndroidNotificationPayload(payload);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: validation.status });

  await prisma.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });

  try {
    const event = await prisma.notificationEvent.create({
      data: {
        userId: device.userId,
        androidDeviceId: device.id,
        eventId: validation.data.eventId,
        sender: validation.data.sender,
        packageName: validation.data.packageName,
        privacyMode: validation.data.privacyMode,
        postedAt: validation.data.postedAt
      }
    });

    const title = validation.data.sender ? `MAX: ${validation.data.sender}` : "MAX";
    const pushResult = await sendPushToUser(device.userId, title, "Новое уведомление");

    if (pushResult.sent > 0) {
      await prisma.notificationEvent.update({ where: { id: event.id }, data: { deliveredAt: new Date() } });
    }
    return NextResponse.json({ ok: true, push_sent: pushResult.sent, push_skipped: pushResult.skipped });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("Notification create failed", { deviceId: device.id });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
