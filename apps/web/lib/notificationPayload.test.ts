import { describe, expect, it } from "vitest";
import { validateAndroidNotificationPayload, sanitizeSender } from "./notificationPayload";

const basePayload = {
  event_id: "abc123456789",
  sender: "Иван",
  posted_at: 1710000000,
  package_name: "ru.oneme.app",
  privacy_mode: "sender_only"
};

describe("validateAndroidNotificationPayload", () => {
  it("accepts sender_only payload", () => {
    const result = validateAndroidNotificationPayload(basePayload);
    expect(result.ok).toBe(true);
  });

  it("rejects payload with body", () => {
    const result = validateAndroidNotificationPayload({ ...basePayload, body: "secret" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects payload with text", () => {
    const result = validateAndroidNotificationPayload({ ...basePayload, text: "secret" });
    expect(result.ok).toBe(false);
  });

  it("rejects nested forbidden fields", () => {
    const result = validateAndroidNotificationPayload({ ...basePayload, meta: { text: "secret" } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("meta.text");
  });

  it("rejects wrong package_name", () => {
    const result = validateAndroidNotificationPayload({ ...basePayload, package_name: "org.telegram.messenger" });
    expect(result.ok).toBe(false);
  });

  it("rejects future timestamps", () => {
    const result = validateAndroidNotificationPayload({ ...basePayload, posted_at: Date.now() + 10 * 60_000 });
    expect(result.ok).toBe(false);
  });

  it("sanitizes sender", () => {
    expect(sanitizeSender(" Иван\nПетров ")).toBe("Иван Петров");
  });

  it("does not allow additional unknown fields", () => {
    const result = validateAndroidNotificationPayload({ ...basePayload, unknown: true });
    expect(result.ok).toBe(false);
  });
});
