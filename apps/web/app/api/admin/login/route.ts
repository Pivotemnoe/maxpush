import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminCookieOptions, adminRedirectUrl, adminSessionValue, getAdminCredential, normalizeAdminUsername, verifyAdminPassword } from "@/lib/adminAuth";

function redirect(message?: string) {
  return NextResponse.redirect(adminRedirectUrl(message ? `/admin?message=${message}` : "/admin"), 303);
}

export async function POST(request: Request) {
  const credential = await getAdminCredential();
  const form = await request.formData();
  const username = normalizeAdminUsername(form.get("username"));
  const password = form.get("password");
  if (!credential || username !== credential.username || typeof password !== "string" || !verifyAdminPassword(password, credential.passwordHash)) {
    return redirect("login_error");
  }

  const res = redirect();
  res.cookies.set(ADMIN_SESSION_COOKIE, adminSessionValue(credential.updatedAt), adminCookieOptions());
  return res;
}
