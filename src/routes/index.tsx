import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { fetchQuestions, saveResult, shuffle, type Question } from "@/lib/quiz";
import { ChoiceQuestion } from "@/components/quiz/ChoiceQuestion";
import { MatchQuestion } from "@/components/quiz/MatchQuestion";

const questionsQuery = queryOptions({ queryKey: ["questions"], queryFn: fetchQuestions, staleTime: Infinity });

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "English Quest for Eli" },
      { name: "description", content: "200 otázek na slovíčka, gramatiku a předložky. Pro děti 10–14 let." },
      { property: "og:title", content: "English Quest – hravý kvíz z angličtiny" },
      { property: "og:description", content: "200 otázek na slovíčka, gramatiku a předložky. Pro děti 10–14 let." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(questionsQuery),
  pendingComponent: () => <div className="min-h-screen flex items-center justify-center font-display text-3xl animate-pulse">Načítám otázky… 🚀</div>,
  errorComponent: ({ error }) => <div className="p-8 text-center">Otázky se nepodařilo načíst: {error instanceof Error ? error.message : String(error)}</div>,
  notFoundComponent: () => <div className="p-8 text-center">Nenalezeno.</div>,
  component: Index,
});

const cheers = ["Super! 🎉", "Výborně! ⭐", "Skvělá práce! 🚀", "Jsi hvězda! 🌟", "Bomba! 💥"];
const oops = ["Nevadí, příště! 💪", "Skoro! 🙂", "Zkus to dál! 🍀"];

function Index() {
  const { data: all } = useSuspenseQuery(questionsQuery);
  const [phase, setPhase] = useState<"start" | "play" | "end">("start");
  const [name, setName] = useState("");
  const [round, setRound] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const start = (count: number) => {
    setRound(shuffle(all).slice(0, count));
    setI(0); setScore(0); setStreak(0); setPhase("play");
  };

  const answer = (ok: boolean) => {
    const list = ok ? cheers : oops;
    setToast({ text: list[Math.floor(Math.random() * list.length)] ?? "", ok });
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, scalar: 0.8 });
    } else setStreak(0);
    setTimeout(() => {
      setToast(null);
      if (i + 1 >= round.length) setPhase("end");
      else setI(i + 1);
    }, 700);
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            <span className="text-primary">English</span> <span className="text-secondary">Quest</span>
          </h1>
        </header>
        {phase === "start" && <Start total={all.length} name={name} setName={setName} onStart={start} />}
        {phase === "play" && round[i] && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 font-display font-semibold">
              <span className="pop-btn bg-card px-3 py-1 text-sm">{round[i].category}</span>
              <span>Otázka {i + 1} / {round.length}</span>
              <span className="pop-btn bg-accent px-3 py-1 text-sm">⭐ {score}{streak >= 3 ? ` · 🔥${streak}` : ""}</span>
            </div>
            <div className="h-4 rounded-full border-[3px] bg-card overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(i / round.length) * 100}%` }} />
            </div>
            <div key={round[i].id} className="pop-card p-6 sm:p-8 animate-pop-in relative">
              {round[i].kind === "match" ? <MatchQuestion q={round[i]} onDone={answer} /> : <ChoiceQuestion q={round[i]} onDone={answer} />}
              {toast && (
                <div className={`absolute left-1/2 -top-6 -translate-x-1/2 pop-btn px-5 py-2 text-xl animate-pop-in ${toast.ok ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"}`}>
                  {toast.text}
                </div>
              )}
            </div>
          </div>
        )}
        {phase === "end" && <End score={score} total={round.length} name={name} onRestart={() => setPhase("start")} />}
      </div>
    </main>
  );
}

function Start({ total, name, setName, onStart }: { total: number; name: string; setName: (s: string) => void; onStart: (n: number) => void }) {
  return (
    <div className="pop-card p-8 text-center space-y-6 animate-pop-in">
      <div className="text-7xl animate-float">🦉📚✨</div>
      <p className="text-lg">
        Procvič si slovíčka, gramatiku a předložky! V databázi čeká <b>{total} otázek</b> – vyber si, kolik jich zvládneš.
      </p>
      <input
        value={name}
        maxLength={30}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tvoje jméno"
        className="w-full max-w-xs mx-auto block rounded-xl border-[3px] px-4 py-3 text-lg text-center font-display bg-background"
      />
      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={() => onStart(20)} className="pop-btn bg-secondary text-secondary-foreground px-6 py-3 text-xl">Rychlovka · 20</button>
        <button onClick={() => onStart(50)} className="pop-btn bg-primary text-primary-foreground px-6 py-3 text-xl">Výzva · 50</button>
        <button onClick={() => onStart(total)} className="pop-btn bg-accent px-6 py-3 text-xl">Mistr · všech {total}</button>
      </div>
      <Link to="/admin" className="inline-block text-sm text-muted-foreground underline">⚙️ Administrace</Link>
    </div>
  );
}

function End({ score, total, name, onRestart }: { score: number; total: number; name: string; onRestart: () => void }) {
  const saved = useRef(false);
  const pct = Math.round((score / total) * 100);
  useEffect(() => {
    if (!saved.current) { saved.current = true; saveResult(name.trim(), score, total).catch(() => {}); }
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 } });
      confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);
  const msg = pct >= 90 ? "Jsi angličtinový šampion! 🏆" : pct >= 70 ? "Skvělý výkon! 🌟" : pct >= 50 ? "Dobrá práce, jen tak dál! 💪" : "Každý pokus tě posouvá dál! 🍀";
  return (
    <div className="pop-card p-10 text-center space-y-6 animate-pop-in">
      <div className="text-8xl animate-wiggle">{pct >= 70 ? "🏆" : "🎈"}</div>
      <h2 className="text-4xl font-bold">{name.trim() ? `${name.trim()}, ` : ""}{msg}</h2>
      <p className="font-display text-7xl font-bold text-primary">{score} / {total}</p>
      <p className="text-xl text-muted-foreground">Úspěšnost {pct} %</p>
      <button onClick={onRestart} className="pop-btn bg-secondary text-secondary-foreground px-10 py-4 text-2xl">Zkusit znovu 🔄</button>
    </div>
  );
}
