import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { fetchPlayerNames, fetchQuestions, fetchResults, groupResultsByPlayer, groupResultsBySubject, hasPlayerName, isSoundOn, mistakeQuestions, ROUND_SIZES, saveResult, setSoundEnabled, shuffle, type Question, type QuestionAttempt, type QuizResult } from "@/lib/quiz";
import { PlayerAuth, usePlayer } from "@/components/quiz/PlayerAuth";
import { RotateCcw } from "lucide-react";
import { ChoiceQuestion } from "@/components/quiz/ChoiceQuestion";
import { MatchQuestion } from "@/components/quiz/MatchQuestion";
import { MistakeReview } from "@/components/quiz/MistakeReview";
import { Button } from "@/components/ui/button";
import { SUBJECTS, SubjectMenu, subjectMeta, type SubjectId } from "@/lib/subjects";

const questionsQuery = queryOptions({ queryKey: ["questions"], queryFn: fetchQuestions, staleTime: Infinity });
const resultsQuery = queryOptions({ queryKey: ["quiz-results"], queryFn: fetchResults, staleTime: 30_000 });
const playersQuery = queryOptions({ queryKey: ["player-names"], queryFn: fetchPlayerNames, staleTime: 30_000 });

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Eli's tests" },
      { name: "description", content: "200 otázek na slovíčka, gramatiku a předložky. Pro děti 10–14 let." },
      { property: "og:title", content: "Eli's tests" },
      { property: "og:description", content: "200 otázek na slovíčka, gramatiku a předložky. Pro děti 10–14 let." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(questionsQuery), context.queryClient.ensureQueryData(resultsQuery), context.queryClient.ensureQueryData(playersQuery)]),
  pendingComponent: () => <div className="min-h-screen flex items-center justify-center font-display text-3xl animate-pulse">Načítám otázky… 🚀</div>,
  errorComponent: ({ error }) => <div className="p-8 text-center">Otázky se nepodařilo načíst: {error instanceof Error ? error.message : String(error)}</div>,
  notFoundComponent: () => <div className="p-8 text-center">Nenalezeno.</div>,
  component: Index,
});

const cheers = ["Super! 🎉", "Výborně! ⭐", "Skvělá práce! 🚀", "Jsi hvězda! 🌟", "Bomba! 💥"];
const oops = ["Nevadí, příště! 💪", "Skoro! 🙂", "Zkus to dál! 🍀"];

function Index() {
  const { data: everything } = useSuspenseQuery(questionsQuery);
  const { data: results } = useSuspenseQuery(resultsQuery);
  const [subject, setSubject] = useState<SubjectId>("en");
  const all = everything.filter((q) => (q.subject ?? "en") === subject);
  const counts = everything.reduce<Record<string, number>>((m, q) => ((m[q.subject ?? "en"] = (m[q.subject ?? "en"] ?? 0) + 1), m), {});
  const subj = subjectMeta(subject);
  const [wrong, setWrong] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [phase, setPhase] = useState<"start" | "play" | "end">("start");
  const { player, loading: playerLoading } = usePlayer();
  const name = player?.username ?? "";
  const [round, setRound] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundOn);
  const retryQuestions = mistakeQuestions(everything, results, name, subject);

  const beginRound = (questions: Question[]) => {
    if (!player || playerLoading || !hasPlayerName(name) || questions.length === 0) return;
    setRound(shuffle(questions));
    setAttempts([]);
    setI(0); setScore(0); setWrong(0); setStreak(0); setPhase("play");
  };

  const start = (count: number) => {
    if (!ROUND_SIZES.some((size) => size === count) || all.length < count) return;
    beginRound(shuffle(all).slice(0, count));
  };

  const answer = (attempt: QuestionAttempt) => {
    const ok = attempt.correct;
    setAttempts((previous) => [...previous, attempt]);
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
            <span className="text-primary">{"Eli's"}</span> <span className="text-secondary">tests</span>
          </h1>
          <div className="mt-2 flex items-center justify-center gap-3">
            <p className="font-display text-xl">{subj.icon} {subj.label}</p>
            <button
              onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); }}
              className={`pop-btn px-3 py-1 text-sm ${soundOn ? "bg-card" : "bg-destructive/20"}`}
              aria-label={soundOn ? "Vypnout zvuk" : "Zapnout zvuk"}
              title={soundOn ? "Vypnout zvuk" : "Zapnout zvuk"}
            >
              {soundOn ? "🔊 Zvuk" : "🔇 Zvuk"}
            </button>
          </div>
        </header>
        {showResults && <Results />}
        {!showResults && phase === "start" && all.length === 0 && (
          <div className="pop-card p-8 text-center space-y-4"><div className="text-6xl">🚧</div><p className="text-lg">V sekci <b>{subj.label}</b> zatím nejsou žádné otázky. Přidejte je v administraci.</p><Link to="/admin" className="underline">⚙️ Administrace</Link></div>
        )}
        {!showResults && phase === "start" && all.length > 0 && <Start subject={subj.label} total={all.length} name={name} onStart={start} mistakeCount={retryQuestions.length} onRetry={() => beginRound(retryQuestions)} />}
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
        {!showResults && phase === "end" && <End score={score} wrong={wrong} total={round.length} name={name} subject={subject} attempts={attempts} onRestart={() => setPhase("start")} mistakeCount={retryQuestions.length} onRetry={() => beginRound(retryQuestions)} />}
        </div>
      </div>
    </main>
  );
}

function Start({ subject, total, name, onStart, mistakeCount, onRetry }: { subject: string; total: number; name: string; onStart: (n: number) => void; mistakeCount: number; onRetry: () => void }) {
  const { data: names } = useSuspenseQuery(playersQuery);
  const { player, loading } = usePlayer();
  const named = Boolean(player) && !loading;
  return (
    <div className="pop-card p-8 text-center space-y-6 animate-pop-in">
      <div className="text-7xl animate-float">🦉📚✨</div>
      <p className="text-lg">
        Téma <b>{subject}</b>. V databázi čeká <b>{total} otázek</b> – vyber si, kolik jich zvládneš.
      </p>
      <PlayerAuth names={names} />
      <p className={`font-display font-semibold ${named ? "text-success" : "text-destructive"}`}>
        {named ? `Super, ${name.trim()}! Teď vyber kolo 👇` : "🔐 Nejdřív se přihlas nebo si vytvoř hráče."}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {ROUND_SIZES.map((count, index) => (
          <Button key={count} variant="ghost" onClick={() => onStart(count)} disabled={!named || total < count} title={total < count ? `V tomto oboru zatím není ${count} otázek` : undefined} className={`pop-btn h-auto whitespace-normal px-6 py-3 text-xl ${index === 0 ? "bg-secondary text-secondary-foreground" : index === 1 ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
            {["Rychlovka", "Výzva", "Mistr"][index]} · {count}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <Button variant="ghost" onClick={onRetry} disabled={!named || mistakeCount === 0} className="pop-btn h-auto whitespace-normal bg-card px-6 py-3 text-lg max-w-full">
          <RotateCcw className="size-5 shrink-0" /> Procvičit chyby · {mistakeCount}
        </Button>
        {named && mistakeCount === 0 && <p className="text-sm text-muted-foreground">Pro toto jméno a předmět zatím nejsou uložené chybné otázky.</p>}
      </div>
    </div>
  );
}

function End({ score, wrong, total, name, subject, attempts, onRestart, mistakeCount, onRetry }: { score: number; wrong: number; total: number; name: string; subject: string; attempts: QuestionAttempt[]; onRestart: () => void; mistakeCount: number; onRetry: () => void }) {
  const queryClient = useQueryClient();
  const saved = useRef<Promise<QuizResult> | null>(null);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saving");
  const [showMistakes, setShowMistakes] = useState(false);
  const pct = Math.round((score / total) * 100);
  const persist = () => {
    setSaveState("saving");
    saved.current ??= saveResult(name.trim(), score, total, subject, attempts);
    saved.current.then((result) => {
      queryClient.setQueryData<QuizResult[]>(resultsQuery.queryKey, (previous) => [result, ...(previous ?? []).filter((row) => row.id !== result.id)]);
      setSaveState("saved");
      void queryClient.invalidateQueries({ queryKey: resultsQuery.queryKey });
    }).catch(() => { saved.current = null; setSaveState("error"); });
  };
  useEffect(() => {
    persist();
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
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="ghost" onClick={onRetry} disabled={saveState !== "saved" || mistakeCount === 0} className="pop-btn h-auto whitespace-normal bg-accent px-6 py-3 text-lg max-w-full"><RotateCcw className="size-5 shrink-0" /> Procvičit chyby · {mistakeCount}</Button>
        <Button variant="ghost" onClick={() => setShowMistakes((show) => !show)} aria-expanded={showMistakes} aria-controls="mistake-review" className="pop-btn h-auto whitespace-normal bg-card px-6 py-3 text-lg">{showMistakes ? "Skrýt chybné odpovědi" : `Zobrazit chybné odpovědi (${wrong})`}</Button>
        <Button variant="ghost" onClick={onRestart} className="pop-btn h-auto whitespace-normal bg-secondary text-secondary-foreground px-6 py-3 text-xl">Zkusit znovu 🔄</Button>
      </div>
      {saveState === "saving" && <p role="status" className="text-sm text-muted-foreground">Ukládám výsledek a chybné otázky…</p>}
      {saveState === "error" && <div role="alert" className="space-y-2 text-destructive"><p>Výsledek a chybné otázky se nepodařilo uložit.</p><Button variant="outline" onClick={persist}>Zkusit uložit znovu</Button></div>}
      {showMistakes && <MistakeReview attempts={attempts} />}
    </div>
  );
}

function ResultRow({ r, showPlayer, showSubject }: { r: QuizResult; showPlayer?: boolean; showSubject?: boolean }) {
  const pct = Math.round((r.score / r.total) * 100);
  const subj = subjectMeta(r.subject);
  return (
    <li className="flex items-center justify-between gap-3 text-sm font-display">
      <span className={showPlayer ? "font-bold whitespace-nowrap" : "text-muted-foreground whitespace-nowrap"}>{showPlayer ? `👤 ${r.player_name}` : new Date(r.created_at).toLocaleString("cs-CZ")}</span>
      {showSubject && (
        <span className="pop-btn bg-card px-2 py-0.5 text-xs whitespace-nowrap" title={`Obor: ${subj.label}`}>
          {subj.icon} {subj.label}
        </span>
      )}
      <span className="flex-1 h-3 rounded-full border-2 bg-card overflow-hidden mx-2">
        <span className={`block h-full ${pct >= 70 ? "bg-success" : pct >= 50 ? "bg-accent" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </span>
      {showPlayer && <span className="text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString("cs-CZ")}</span>}
      <span className="font-bold whitespace-nowrap">⭐ {r.score}/{r.total} · {pct} %</span>
    </li>
  );
}

function Results() {
  const { data: results } = useSuspenseQuery(resultsQuery);
  const [view, setView] = useState<"name" | "subject">("name");
  if (results.length === 0) {
    return <div className="pop-card p-8 text-center space-y-4 animate-pop-in"><div className="text-6xl">🏆</div><p className="text-lg">Zatím tu nejsou žádné výsledky. Zahraj si první kolo!</p></div>;
  }
  const groups = view === "name" ? groupResultsByPlayer(results) : groupResultsBySubject(results);
  return (
    <div className="space-y-6 animate-pop-in">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold">🏆 Výsledky</h2>
        <div className="inline-flex gap-2">
          <button onClick={() => setView("name")} className={`pop-btn px-5 py-2 text-lg ${view === "name" ? "bg-accent" : "bg-card"}`}>👤 Podle jména</button>
          <button onClick={() => setView("subject")} className={`pop-btn px-5 py-2 text-lg ${view === "subject" ? "bg-accent" : "bg-card"}`}>📚 Podle oboru</button>
        </div>
      </div>
      {groups.map(([key, rs]) => {
        const isName = view === "name";
        const title = isName ? key : `${SUBJECTS.find((s) => s.id === key)?.icon ?? "❓"} ${SUBJECTS.find((s) => s.id === key)?.label ?? key}`;
        const bestPct = Math.round(Math.max(...rs.map((r) => r.score / r.total)) * 100);
        const avgPct = Math.round((rs.reduce((s, r) => s + r.score / r.total, 0) / rs.length) * 100);
        return (
          <div key={key} className="pop-card p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-2xl font-bold">{title}</h3>
              <div className="flex gap-2 font-display text-sm">
                <span className="pop-btn bg-card px-3 py-1">🎮 {rs.length}× hráno</span>
                <span className="pop-btn bg-accent px-3 py-1">🥇 nejlepší {bestPct} %</span>
                <span className="pop-btn bg-secondary text-secondary-foreground px-3 py-1">📊 průměr {avgPct} %</span>
              </div>
            </div>
            <ul className="space-y-1">
              {rs.slice(0, 5).map((r) => <ResultRow key={r.id} r={r} showPlayer={!isName} showSubject={isName} />)}
            </ul>
            {rs.length > 5 && <p className="text-xs text-muted-foreground">…a {rs.length - 5} dalších kol</p>}
          </div>
        );
      })}
    </div>
  );
}
