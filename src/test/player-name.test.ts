import { describe, expect, it } from "vitest";

import { hasPlayerName } from "@/lib/quiz";

// A quiz round may only start once the player wrote their name.
describe("Player name is required before a quiz starts", () => {
  it("accepts a real name, even with stray spaces", () => {
    expect(hasPlayerName("Eli")).toBe(true);
    expect(hasPlayerName("  Eli  ")).toBe(true);
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(hasPlayerName("")).toBe(false);
    expect(hasPlayerName("   ")).toBe(false);
    expect(hasPlayerName("\t\n")).toBe(false);
  });
});
