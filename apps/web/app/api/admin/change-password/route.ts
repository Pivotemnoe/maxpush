import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminCookieOptions, adminSessionValue, requireAdminSession, upsertAdminPassword, validateAdminPassword, verifyAdminPassword } from "@/lib/adminAuth";

function redirect(request: Request, message: string) {
  return NextResponse.redirect(new URL(`/admin?message=${message}`, request.url), 303);
}

export async function POST(request: Request) {
  const credential = await requireAdminSession().catch(() => null);
  if (!credential) return redirect(request, "login_error");

  const form = await request.formData();
  const current = form.get("current_password");
  const next = form.get("new_password");
  const confirm = form.get("confirm_password");
  if (
    typeof current !== "string" ||
    typeof next !== "string" ||
    next !== confirm ||
    validateAdminPassword(next) ||
    !verifyAdminPassword(current, credential.passwordHash)
  ) {
    return redirect(request, "change_error");
  }

  const updated = await upsertAdminPassword(next);
  const res = redirect(request, "password_changed");
  res.cookies.set(ADMIN_SESSION_COOKIE, adminSessionValue(updated.updatedAt), adminCookieOptions());
  return res;
}
