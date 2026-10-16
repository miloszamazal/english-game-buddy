import { describe, expect, it } from "vitest";

import { groupResultsByPlayer, groupResultsBySubject, type QuizResult } from "@/lib/quiz";

const result = (over: Partial<QuizResult>): QuizResult => ({
  id: over.id ?? Math.random().toString(),
  player_name: over.player_name ?? "Hráč",
  score: over.score ?? 0,
  total: over.total ?? 10,
  created_at: over.created_at ?? new Date().toISOString(),
  subject: over.subject ?? "en",
});

// Results page has two views: grouped per player and grouped per subject.
describe("Results grouping", () => {
  it("groups by player and sorts by best percentage", () => {
    const groups = groupResultsByPlayer([
      result({ player_name: "Eli", score: 5, total: 10 }),
      result({ player_name: "Ana", score: 9, total: 10 }),
      result({ player_name: "Eli", score: 8, total: 10 }),
    ]);
    expect(groups.map(([p]) => p)).toEqual(["Ana", "Eli"]);
    expect(groups[1]?.[1]).toHaveLength(2);
  });

  it("groups by subject in menu order: en, cs, math", () => {
    const groups = groupResultsBySubject([
      result({ subject: "math", score: 7, total: 10 }),
      result({ subject: "en", score: 6, total: 10 }),
      result({ subject: "cs", score: 4, total: 10 }),
      result({ subject: "en", score: 10, total: 10 }),
    ]);
    expect(groups.map(([s]) => s)).toEqual(["en", "cs", "math"]);
    expect(groups[0]?.[1]).toHaveLength(2);
  });

  it("treats a missing subject as English", () => {
    const groups = groupResultsBySubject([result({ subject: "" })]);
    expect(groups.map(([s]) => s)).toEqual(["en"]);
  });
});
