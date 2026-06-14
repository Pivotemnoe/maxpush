import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/auth";
import { requireCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    await requireCsrf(request);
    const userId = await requireCurrentUserId();
    await prisma.device.updateMany({ where: { userId, type: "android_relay" }, data: { active: false, tokenHash: null } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
