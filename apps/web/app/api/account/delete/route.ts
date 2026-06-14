import { NextResponse } from "next/server";
import { requireCurrentUserId, SESSION_COOKIE } from "@/lib/auth";
import { CSRF_COOKIE, requireCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    await requireCsrf(request);
    const userId = await requireCurrentUserId();
    await prisma.user.delete({ where: { id: userId } });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set(CSRF_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
