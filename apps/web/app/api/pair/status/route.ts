import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePairingCode, sha256 } from "@/lib/crypto";

export async function GET(request: Request) {
  try {
    const userId = await requireCurrentUserId();
    const url = new URL(request.url);
    const code = normalizePairingCode(url.searchParams.get("code"));
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const session = await prisma.pairingSession.findFirst({ where: { userId, codeHash: sha256(code) } });
    if (!session) return NextResponse.json({ paired: false });

    const android = await prisma.device.findFirst({
      where: { userId, type: "android_relay", active: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      paired: Boolean(session.usedAt && android),
      android_device_name: android?.name ?? null
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
