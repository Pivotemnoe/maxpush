import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/admin?message=logout", request.url), 303);
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
