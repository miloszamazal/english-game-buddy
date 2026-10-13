import { describe, expect, it } from "vitest";
import { CSV_EXAMPLE, JSON_EXAMPLE, parseFile } from "@/lib/import-parse";

describe("import parsing", () => {
  it("accepts the sample CSV with the correct answer picked by number", () => {
    const r = parseFile("a.csv", CSV_EXAMPLE);
    expect(r.errors).toEqual([]);
    expect(r.valid).toHaveLength(3);
    expect(r.valid[2]?.answer).toBe("under");
  });
  it("accepts the sample JSON", () => {
    expect(parseFile("a.json", JSON_EXAMPLE).valid).toHaveLength(1);
  });
  it("rejects a sentence without ___ and a correct number outside 1-4", () => {
    const csv = "h\nsentence;G;No blank here;a;b;c;d;1;\nchoice;G;Q?;a;b;c;d;5;";
    const r = parseFile("x.csv", csv);
    expect(r.valid).toHaveLength(0);
    expect(r.errors).toHaveLength(2);
  });
});
