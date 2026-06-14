import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminRedirectUrl } from "@/lib/adminAuth";

export async function POST() {
  const res = NextResponse.redirect(adminRedirectUrl("/admin?message=logout"), 303);
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
