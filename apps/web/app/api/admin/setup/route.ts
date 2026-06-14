import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminCookieOptions, adminSessionValue, getAdminCredential, upsertAdminPassword, validateAdminPassword } from "@/lib/adminAuth";

function redirect(request: Request, message: string) {
  return NextResponse.redirect(new URL(`/admin?message=${message}`, request.url), 303);
}

export async function POST(request: Request) {
  const existing = await getAdminCredential();
  if (existing) return redirect(request, "login_error");

  const form = await request.formData();
  const password = form.get("password");
  const confirm = form.get("confirm_password");
  if (validateAdminPassword(password) || password !== confirm || typeof password !== "string") {
    return redirect(request, "change_error");
  }

  const credential = await upsertAdminPassword(password);
  const res = redirect(request, "created");
  res.cookies.set(ADMIN_SESSION_COOKIE, adminSessionValue(credential.updatedAt), adminCookieOptions());
  return res;
}
