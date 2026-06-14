import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminCookieOptions, adminSessionValue, getAdminCredential, normalizeAdminUsername, verifyAdminPassword } from "@/lib/adminAuth";

function redirect(request: Request, message?: string) {
  return NextResponse.redirect(new URL(message ? `/admin?message=${message}` : "/admin", request.url), 303);
}

export async function POST(request: Request) {
  const credential = await getAdminCredential();
  const form = await request.formData();
  const username = normalizeAdminUsername(form.get("username"));
  const password = form.get("password");
  if (!credential || username !== credential.username || typeof password !== "string" || !verifyAdminPassword(password, credential.passwordHash)) {
    return redirect(request, "login_error");
  }

  const res = redirect(request);
  res.cookies.set(ADMIN_SESSION_COOKIE, adminSessionValue(credential.updatedAt), adminCookieOptions());
  return res;
}
