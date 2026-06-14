import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminCookieOptions, adminRedirectUrl, adminSessionValue, normalizeAdminUsername, requireAdminSession, upsertAdminCredential, validateAdminPassword, validateAdminUsername, verifyAdminPassword } from "@/lib/adminAuth";

function redirect(message: string) {
  return NextResponse.redirect(adminRedirectUrl(`/admin?message=${message}`), 303);
}

export async function POST(request: Request) {
  const credential = await requireAdminSession().catch(() => null);
  if (!credential) return redirect("login_error");

  const form = await request.formData();
  const current = form.get("current_password");
  const username = normalizeAdminUsername(form.get("new_username"));
  const next = form.get("new_password");
  const confirm = form.get("confirm_password");
  if (
    typeof current !== "string" ||
    typeof next !== "string" ||
    !username ||
    next !== confirm ||
    validateAdminUsername(username) ||
    validateAdminPassword(next) ||
    !verifyAdminPassword(current, credential.passwordHash)
  ) {
    return redirect("change_error");
  }

  const updated = await upsertAdminCredential(username, next);
  const res = redirect("password_changed");
  res.cookies.set(ADMIN_SESSION_COOKIE, adminSessionValue(updated.updatedAt), adminCookieOptions());
  return res;
}
