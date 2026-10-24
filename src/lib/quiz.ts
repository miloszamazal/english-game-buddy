import { supabase } from "@/integrations/supabase/client";
import { SUBJECTS } from "@/lib/subjects";

export type Question = {
  id: number;
  kind: "choice" | "sentence" | "match";
  category: string;
  prompt: string;
  options: string[];
  answer: string | null;
  images: string[] | null;
  audio: string | null;
  subject: string;
};

export const ROUND_SIZES = [15, 30, 50] as const;

export type QuestionAttempt = {
  question: Question;
  response: string | Record<number, string>;
  correct: boolean;
};

export function evaluateAnswer(question: Question, response: QuestionAttempt["response"]): QuestionAttempt {
  const correct = question.kind === "match"
    ? typeof response !== "string" && question.options.every((word, index) => response[index] === word)
    : typeof response === "string" && response === question.answer;
  return { question, response: typeof response === "string" ? response : { ...response }, correct };
}

export function incorrectAttempts(attempts: QuestionAttempt[]) {
  return attempts.filter((attempt) => !attempt.correct);
}

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.from("questions").select("*").order("id");
  if (error) throw new Error(error.message);
  return (data ?? []) as Question[];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i] as T;
    a[i] = a[j] as T;
    a[j] = t;
  }
  return a;
}

const SOUND_KEY = "eq-sound-on";

export function isSoundOn() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "off";
}

export function setSoundEnabled(on: boolean) {
  soundOn = on;
  if (typeof window !== "undefined") window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}

let soundOn = isSoundOn();

export function speak(text: string, lang = "en-GB") {
  if (!soundOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export function hasPlayerName(name: string) {
  return name.trim().length > 0;
}

export async function saveResult(player_name: string, score: number, total: number, subject: string) {
  await supabase.from("quiz_results").insert({ player_name: player_name.slice(0, 30) || "Hráč", score, total, subject });
}

export type QuizResult = { id: string; player_name: string; score: number; total: number; created_at: string; subject: string };

export function groupResultsByPlayer(results: QuizResult[]): [string, QuizResult[]][] {
  const byPlayer = new Map<string, QuizResult[]>();
  for (const r of results) {
    const list = byPlayer.get(r.player_name) ?? [];
    list.push(r);
    byPlayer.set(r.player_name, list);
  }
  const best = (rs: QuizResult[]) => Math.max(...rs.map((r) => r.score / r.total));
  return [...byPlayer.entries()].sort((a, b) => best(b[1]) - best(a[1]));
}

export function groupResultsBySubject(results: QuizResult[]): [string, QuizResult[]][] {
  const bySubject = new Map<string, QuizResult[]>();
  for (const r of results) {
    const key = r.subject || "en";
    const list = bySubject.get(key) ?? [];
    list.push(r);
    bySubject.set(key, list);
  }
  const order: string[] = SUBJECTS.map((s) => s.id);
  return [...bySubject.entries()].sort((a, b) => {
    const ia = order.indexOf(a[0]);
    const ib = order.indexOf(b[0]);
    return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
  });
}

export async function fetchResults(): Promise<QuizResult[]> {
  const { data, error } = await supabase.from("quiz_results").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuizResult[];
}
