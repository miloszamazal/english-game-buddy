import { describe, expect, it } from "vitest";
import { evaluateAnswer, mistakeQuestions, wrongQuestionIds, type Question, type QuizResult } from "@/lib/quiz";

const question: Question = { id: 1, kind: "choice", category: "Slovíčka", prompt: "Pes?", options: ["dog", "cat", "bird", "fish"], answer: "dog", images: null, audio: null, subject: "en" };
const result: QuizResult = { id: "1", player_name: "Eli", score: 0, total: 1, created_at: "2026-10-25T18:21:00Z", subject: "en", wrong_question_ids: [1] };

describe("Mistake retry rounds", () => {
  it("stores only distinct incorrectly answered question IDs", () => {
    expect(wrongQuestionIds([evaluateAnswer(question, "cat"), evaluateAnswer(question, "fish"), evaluateAnswer({ ...question, id: 2 }, "dog")])).toEqual([1]);
  });
  it("combines mistakes across previous tests without repeating a question", () => {
    const second = { ...question, id: 2 };
    expect(mistakeQuestions([question, second], [result, { ...result, id: "2", wrong_question_ids: [1, 2] }], "Eli", "en").map((q) => q.id)).toEqual([1, 2]);
  });
  it("does not use another child's mistakes", () => {
    expect(mistakeQuestions([question], [{ ...result, player_name: "Adam" }], "Eli", "en")).toEqual([]);
  });
  it("does not use mistakes or questions from another subject", () => {
    expect(mistakeQuestions([question, { ...question, id: 2, subject: "math" }], [result, { ...result, subject: "math", wrong_question_ids: [2] }], "Eli", "en").map((q) => q.id)).toEqual([1]);
    expect(mistakeQuestions([{ ...question, subject: "math" }], [result], "Eli", "en")).toEqual([]);
  });
  it("omits deleted questions and old results without mistake data", () => {
    const { wrong_question_ids, ...legacyResult } = result;
    expect(mistakeQuestions([question], [{ ...result, wrong_question_ids: [999] }, legacyResult], "Eli", "en")).toEqual([]);
  });
  it("requires a name and matches the existing trimmed player identity", () => {
    expect(mistakeQuestions([question], [result], "  ", "en")).toEqual([]);
    expect(mistakeQuestions([question], [result], " Eli ", "en")).toEqual([question]);
  });
  it("allows even one mistake and retains historically wrong questions after later success", () => {
    expect(mistakeQuestions([question], [result, { ...result, id: "2", score: 1, wrong_question_ids: [] }], "Eli", "en")).toEqual([question]);
  });
});