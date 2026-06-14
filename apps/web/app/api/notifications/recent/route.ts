import { NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    const rows = await prisma.notificationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, sender: true, createdAt: true }
    });
    return NextResponse.json(rows.map((r) => ({ id: r.id, sender: r.sender, created_at: r.createdAt.toISOString() })));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
