import { describe, expect, it } from "vitest";
import { webcrypto } from "node:crypto";
import { playerCredentials, playerEmail } from "@/lib/player-credentials";

describe("Player credentials", () => {
  it("accepts ten characters and rejects eleven", () => {
    expect(playerCredentials.safeParse({ username: "Eli", password: "abcdefghij", register: true }).success).toBe(true);
    expect(playerCredentials.safeParse({ username: "Eli", password: "abcdefghijk", register: true }).success).toBe(false);
  });
  it("requires a name and a password", () => {
    expect(playerCredentials.safeParse({ username: "  ", password: "abcdef", register: true }).success).toBe(false);
    expect(playerCredentials.safeParse({ username: "Eli", password: "", register: true }).success).toBe(false);
  });
  it("uses the same identity for normalized names without collisions from accent stripping", async () => {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
    expect(await playerEmail("  ELI  ")).toBe(await playerEmail("Eli"));
    expect(await playerEmail("Šárka")).not.toBe(await playerEmail("Sarka"));
    expect(await playerEmail("Eli")).toMatch(/^[a-f0-9]{64}@players\.invalid$/);
  });
});