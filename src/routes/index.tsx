import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { fetchQuestions, fetchResults, hasPlayerName, saveResult, shuffle, type Question, type QuizResult } from "@/lib/quiz";
import { ChoiceQuestion } from "@/components/quiz/ChoiceQuestion";
import { MatchQuestion } from "@/components/quiz/MatchQuestion";
import { SUBJECTS, SubjectMenu, type SubjectId } from "@/lib/subjects";

const questionsQuery = queryOptions({ queryKey: ["questions"], queryFn: fetchQuestions, staleTime: Infinity });
const resultsQuery = queryOptions({ queryKey: ["quiz-results"], queryFn: fetchResults, staleTime: 30_000 });

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "English Quest for Eli" },
      { name: "description", content: "200 otázek na slovíčka, gramatiku a předložky. Pro děti 10–14 let." },
      { property: "og:title", content: "English Quest for Eli" },
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
  const { data: everything } = useSuspenseQuery(questionsQuery);
  const [subject, setSubject] = useState<SubjectId>("en");
  const all = everything.filter((q) => (q.subject ?? "en") === subject);
  const counts = everything.reduce<Record<string, number>>((m, q) => ((m[q.subject ?? "en"] = (m[q.subject ?? "en"] ?? 0) + 1), m), {});
  const subj = SUBJECTS.find((s) => s.id === subject)!;
  const [wrong, setWrong] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [phase, setPhase] = useState<"start" | "play" | "end">("start");
  const [name, setName] = useState("");
  const [round, setRound] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const start = (count: number) => {
    if (!hasPlayerName(name)) return;
    setRound(shuffle(all).slice(0, count));
    setI(0); setScore(0); setWrong(0); setStreak(0); setPhase("play");
  };

  const answer = (ok: boolean) => {
    const list = ok ? cheers : oops;
    setToast({ text: list[Math.floor(Math.random() * list.length)] ?? "", ok });
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, scalar: 0.8 });
    } else { setStreak(0); setWrong((w) => w + 1); }
    setTimeout(() => {
      setToast(null);
      if (i + 1 >= round.length) setPhase("end");
      else setI(i + 1);
    }, 700);
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-[90rem] px-2 flex flex-col md:flex-row gap-8 md:gap-16 lg:gap-24">
        <SubjectMenu value={subject} counts={counts} showResults={showResults} onResults={() => { if (phase !== "play" || confirm("Ukončit rozehrané kolo?")) { setShowResults(true); setPhase("start"); } }} onChange={(s) => { if (phase !== "play" || confirm("Ukončit rozehrané kolo?")) { setSubject(s); setShowResults(false); setPhase("start"); } }} />
        <div className="flex-1 min-w-0 max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            <span className="text-primary">English</span> <span className="text-secondary">Quest</span>{" "}
            <span className="text-accent">for Eli</span>
          </h1>
          <p className="mt-2 font-display text-xl">{subj.icon} {subj.label}</p>
        </header>
        {showResults && <Results />}
        {!showResults && phase === "start" && all.length === 0 && (
          <div className="pop-card p-8 text-center space-y-4"><div className="text-6xl">🚧</div><p className="text-lg">V sekci <b>{subj.label}</b> zatím nejsou žádné otázky. Přidejte je v administraci.</p><Link to="/admin" className="underline">⚙️ Administrace</Link></div>
        )}
        {!showResults && phase === "start" && all.length > 0 && <Start subject={subj.label} total={all.length} name={name} setName={setName} onStart={start} />}
        {!showResults && phase === "play" && round[i] && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 font-display font-semibold">
              <span className="pop-btn bg-card px-3 py-1 text-sm">{round[i].category}</span>
              <span>Otázka {i + 1} / {round.length}</span>
              <span className="flex gap-2"><span className="pop-btn bg-accent px-3 py-1 text-sm" title="Správně">⭐ {score}{streak >= 3 ? ` · 🔥${streak}` : ""}</span><span className="pop-btn bg-destructive/20 px-3 py-1 text-sm" title="Špatně">❌ {wrong}</span></span>
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
        {!showResults && phase === "end" && <End score={score} wrong={wrong} total={round.length} name={name} onRestart={() => setPhase("start")} />}
        </div>
      </div>
    </main>
  );
}

function Start({ subject, total, name, setName, onStart }: { subject: string; total: number; name: string; setName: (s: string) => void; onStart: (n: number) => void }) {
  const named = hasPlayerName(name);
  return (
    <div className="pop-card p-8 text-center space-y-6 animate-pop-in">
      <div className="text-7xl animate-float">🦉📚✨</div>
      <p className="text-lg">
        Téma <b>{subject}</b>. V databázi čeká <b>{total} otázek</b> – vyber si, kolik jich zvládneš.
      </p>
      <input
        value={name}
        maxLength={30}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tvoje jméno"
        aria-label="Tvoje jméno"
        className="w-full max-w-xs mx-auto block rounded-xl border-[3px] px-4 py-3 text-lg text-center font-display bg-background"
      />
      <p className={`font-display font-semibold ${named ? "text-success" : "text-destructive"}`}>
        {named ? `Super, ${name.trim()}! Teď vyber kolo 👇` : "✍️ Nejdřív napiš svoje jméno – bez něj kvíz nespustíš."}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {total > 20 && <button onClick={() => onStart(20)} disabled={!named} className="pop-btn bg-secondary text-secondary-foreground px-6 py-3 text-xl disabled:opacity-40 disabled:cursor-not-allowed">Rychlovka · 20</button>}
        {total > 50 && <button onClick={() => onStart(50)} disabled={!named} className="pop-btn bg-primary text-primary-foreground px-6 py-3 text-xl disabled:opacity-40 disabled:cursor-not-allowed">Výzva · 50</button>}
        <button onClick={() => onStart(total)} disabled={!named} className="pop-btn bg-accent px-6 py-3 text-xl disabled:opacity-40 disabled:cursor-not-allowed">Mistr · všech {total}</button>
      </div>
      <Link to="/admin" className="inline-block text-sm text-muted-foreground underline">⚙️ Administrace</Link>
    </div>
  );
}

function End({ score, wrong, total, name, onRestart }: { score: number; wrong: number; total: number; name: string; onRestart: () => void }) {
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
      <p className="text-2xl font-display">⭐ {score} správně · ❌ {wrong} špatně</p>
      <p className="text-xl text-muted-foreground">Úspěšnost {pct} %</p>
      <button onClick={onRestart} className="pop-btn bg-secondary text-secondary-foreground px-10 py-4 text-2xl">Zkusit znovu 🔄</button>
    </div>
  );
}

function Results() {
  const { data: results } = useSuspenseQuery(resultsQuery);
  const byPlayer = new Map<string, QuizResult[]>();
  for (const r of results) {
    const list = byPlayer.get(r.player_name) ?? [];
    list.push(r);
    byPlayer.set(r.player_name, list);
  }
  const players = [...byPlayer.entries()].sort((a, b) => {
    const best = (rs: QuizResult[]) => Math.max(...rs.map((r) => r.score / r.total));
    return best(b[1]) - best(a[1]);
  });
  if (results.length === 0) {
    return <div className="pop-card p-8 text-center space-y-4 animate-pop-in"><div className="text-6xl">🏆</div><p className="text-lg">Zatím tu nejsou žádné výsledky. Zahraj si první kolo!</p></div>;
  }
  return (
    <div className="space-y-6 animate-pop-in">
      <h2 className="text-4xl font-bold text-center">🏆 Výsledky</h2>
      {players.map(([player, rs]) => {
        const bestPct = Math.round(Math.max(...rs.map((r) => r.score / r.total)) * 100);
        const avgPct = Math.round((rs.reduce((s, r) => s + r.score / r.total, 0) / rs.length) * 100);
        return (
          <div key={player} className="pop-card p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-2xl font-bold">{player}</h3>
              <div className="flex gap-2 font-display text-sm">
                <span className="pop-btn bg-card px-3 py-1">🎮 {rs.length}× hráno</span>
                <span className="pop-btn bg-accent px-3 py-1">🥇 nejlepší {bestPct} %</span>
                <span className="pop-btn bg-secondary text-secondary-foreground px-3 py-1">📊 průměr {avgPct} %</span>
              </div>
            </div>
            <ul className="space-y-1">
              {rs.slice(0, 5).map((r) => {
                const pct = Math.round((r.score / r.total) * 100);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 text-sm font-display">
                    <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString("cs-CZ")}</span>
                    <span className="flex-1 h-3 rounded-full border-2 bg-card overflow-hidden mx-2">
                      <span className={`block h-full ${pct >= 70 ? "bg-success" : pct >= 50 ? "bg-accent" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </span>
                    <span className="font-bold whitespace-nowrap">⭐ {r.score}/{r.total} · {pct} %</span>
                  </li>
                );
              })}
            </ul>
            {rs.length > 5 && <p className="text-xs text-muted-foreground">…a {rs.length - 5} dalších kol</p>}
          </div>
        );
      })}
    </div>
  );
}
