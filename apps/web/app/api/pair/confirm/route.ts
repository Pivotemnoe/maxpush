import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePairingCode, randomToken, sha256 } from "@/lib/crypto";

function cleanDeviceName(value: unknown) {
  if (typeof value !== "string") return "Android";
  const clean = value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 120);
  return clean || "Android";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pairingCode = normalizePairingCode(body?.pairing_code);
  const deviceName = cleanDeviceName(body?.device_name);
  const appVersion = typeof body?.app_version === "string" ? body.app_version.slice(0, 40) : null;
  if (!pairingCode) return NextResponse.json({ error: "Missing pairing_code" }, { status: 400 });

  const session = await prisma.pairingSession.findUnique({ where: { codeHash: sha256(pairingCode) } });
  if (!session || session.usedAt || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Pairing code expired or used" }, { status: 400 });
  }

  const token = randomToken(48);
  const now = new Date();
  const device = await prisma.$transaction(async (tx) => {
    const claimed = await tx.pairingSession.updateMany({
      where: { id: session.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now }
    });
    if (claimed.count !== 1) throw new Error("Pairing code expired or used");

    await tx.device.updateMany({
      where: { userId: session.userId, type: "android_relay", active: true },
      data: { active: false, tokenHash: null }
    });

    return tx.device.create({
      data: {
        userId: session.userId,
        type: "android_relay",
        name: deviceName,
        tokenHash: sha256(token),
        active: true,
        appVersion,
        lastSeenAt: now
      }
    });
  }).catch(() => null);

  if (!device) return NextResponse.json({ error: "Pairing code expired or used" }, { status: 400 });

  return NextResponse.json({ ok: true, device_token: token, device_id: device.id });
}
