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
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export async function saveResult(player_name: string, score: number, total: number) {
  await supabase.from("quiz_results").insert({ player_name: player_name.slice(0, 30) || "Hráč", score, total });
}
