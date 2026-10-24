import { describe, expect, it } from "vitest";
import { evaluateAnswer, incorrectAttempts, ROUND_SIZES, type Question } from "@/lib/quiz";

const question: Question = { id: 1, kind: "choice", category: "Slovíčka", prompt: "Pes?", options: ["dog", "cat", "bird", "fish"], answer: "dog", images: null, audio: null, subject: "en" };

describe("Quiz round lengths", () => {
  it("uses 15 questions for Rychlovka", () => { expect(ROUND_SIZES[0]).toBe(15); });
  it("uses 30 questions for Výzva", () => { expect(ROUND_SIZES[1]).toBe(30); });
  it("uses 50 questions for Mistr", () => { expect(ROUND_SIZES[2]).toBe(50); });
});

describe("End-of-test mistakes", () => {
  it("retains only wrong answers together with the correct solution", () => {
    const attempts = [evaluateAnswer(question, "cat"), evaluateAnswer({ ...question, id: 2 }, "dog")];
    const mistakes = incorrectAttempts(attempts);
    expect(mistakes).toHaveLength(1);
    expect(mistakes[0]?.response).toBe("cat");
    expect(mistakes[0]?.question.answer).toBe("dog");
  });
  it("keeps sentence answers and their correct missing word", () => {
    const attempt = evaluateAnswer({ ...question, kind: "sentence", prompt: "I have a ___." }, "cat");
    expect(attempt.correct).toBe(false);
    expect(attempt.question.prompt.replace("___", attempt.question.answer ?? "")).toBe("I have a dog.");
  });
  it("preserves incorrect image mappings without later mutation", () => {
    const match: Question = { ...question, kind: "match", options: ["dog", "cat"], images: ["🐶", "🐱"], answer: null };
    const response = { 0: "cat", 1: "dog" };
    const attempt = evaluateAnswer(match, response);
    response[0] = "dog";
    expect(attempt.correct).toBe(false);
    expect(attempt.response).toEqual({ 0: "cat", 1: "dog" });
    expect(attempt.question.options).toEqual(["dog", "cat"]);
    expect(evaluateAnswer(match, { 0: "dog", 1: "cat" }).correct).toBe(true);
  });
  it("returns no mistakes for a perfect test", () => {
    expect(incorrectAttempts([evaluateAnswer(question, "dog")])).toEqual([]);
  });
});