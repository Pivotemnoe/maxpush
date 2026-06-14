import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { randomPairingCode, sha256 } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    await requireCsrf(request);
    const userId = await requireCurrentUserId();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://notifymax.ru";
    const code = randomPairingCode(8);
    const expiresAt = new Date(Date.now() + 5 * 60_000);

    await prisma.pairingSession.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() }
    });

    await prisma.pairingSession.create({
      data: { userId, codeHash: sha256(code), expiresAt }
    });

    const qrPayload = `maxpush://pair?code=${encodeURIComponent(code)}&base=${encodeURIComponent(baseUrl)}`;
    return NextResponse.json({ pairing_code: code, expires_at: expiresAt.toISOString(), qr_payload: qrPayload });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
