import { describe, expect, it } from "vitest";
import { duplicateWindowBounds } from "./notificationDedup";

describe("duplicateWindowBounds", () => {
  it("builds a symmetric short dedupe window around postedAt", () => {
    const postedAt = new Date("2026-06-14T12:00:00.000Z");
    const bounds = duplicateWindowBounds(postedAt, 1500);

    expect(bounds.from.getTime()).toBe(postedAt.getTime() - 1500);
    expect(bounds.to.getTime()).toBe(postedAt.getTime() + 1500);
  });
});
