import { supabase } from "@/integrations/supabase/client";

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

export function speak(text: string, lang = "en-GB") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export function hasPlayerName(name: string) {
  return name.trim().length > 0;
}

export async function saveResult(player_name: string, score: number, total: number) {
  await supabase.from("quiz_results").insert({ player_name: player_name.slice(0, 30) || "Hráč", score, total });
}

export type QuizResult = { id: string; player_name: string; score: number; total: number; created_at: string };

export async function fetchResults(): Promise<QuizResult[]> {
  const { data, error } = await supabase.from("quiz_results").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuizResult[];
}
