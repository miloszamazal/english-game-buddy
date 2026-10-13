import { useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { shuffle, speak, type Question } from "@/lib/quiz";

const tileColors = ["bg-sun", "bg-sky", "bg-secondary/40", "bg-primary/25"];

export function ChoiceQuestion({ q, onDone }: { q: Question; onDone: (correct: boolean) => void }) {
  const options = useMemo(() => shuffle(q.options), [q.id]);
  const [picked, setPicked] = useState<string | null>(null);
  const isSentence = q.kind === "sentence";

  const playAudio = () => {
    if (!q.audio) return;
    if (isSentence && !picked) speak(q.prompt.replace("___", "…"));
    else speak(q.audio);
  };

  const pick = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === q.answer;
    if (isSentence && q.audio) speak(q.audio);
    setTimeout(() => onDone(ok), 1300);
  };

  const parts = q.prompt.split("___");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        {q.images?.[0] && <span className="text-7xl animate-float">{q.images[0]}</span>}
        <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
          {isSentence ? (
            <>
              {parts[0]}
              <span className={`inline-block min-w-24 mx-1 px-2 rounded-lg border-b-4 ${picked ? (picked === q.answer ? "bg-success/25 border-success" : "bg-destructive/20 border-destructive") : "border-primary"}`}>
                {picked ? q.answer : "\u00a0"}
              </span>
              {parts[1]}
            </>
          ) : (
            q.prompt
          )}
        </h2>
        <button onClick={playAudio} className="pop-btn bg-accent px-4 py-2 flex items-center gap-2" aria-label="Přehrát výslovnost">
          <Volume2 className="size-5" /> Poslechnout
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {options.map((o, i) => {
          let cls = tileColors[i % 4];
          if (picked) {
            if (o === q.answer) cls = "bg-success text-success-foreground animate-pop-in";
            else if (o === picked) cls = "bg-destructive text-destructive-foreground animate-shake";
            else cls = "bg-muted opacity-60";
          }
          return (
            <button key={o} onClick={() => pick(o)} disabled={!!picked} className={`pop-btn ${cls} px-5 py-4 text-xl text-left flex items-center gap-3`}>
              <span className="size-9 shrink-0 rounded-full bg-card text-foreground border-2 flex items-center justify-center text-base">
                {"ABCD"[i]}
              </span>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
