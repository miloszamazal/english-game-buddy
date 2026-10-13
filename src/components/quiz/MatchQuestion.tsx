import { useMemo, useState } from "react";
import { shuffle, speak, type Question } from "@/lib/quiz";

export function MatchQuestion({ q, onDone }: { q: Question; onDone: (correct: boolean) => void }) {
  const words = useMemo(() => shuffle(q.options), [q.id]);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const used = new Set(Object.values(placed));

  const drop = (idx: number, word: string) => {
    if (checked) return;
    setPlaced((p) => {
      const next = { ...p };
      for (const k of Object.keys(next)) if (next[+k] === word) delete next[+k];
      next[idx] = word;
      return next;
    });
    setSelected(null);
    speak(word);
  };

  const complete = Object.keys(placed).length === q.options.length;
  const check = () => {
    setChecked(true);
    const ok = q.options.every((w, i) => placed[i] === w);
    setTimeout(() => onDone(ok), 1400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-3 min-h-14">
        {words.map((w) =>
          used.has(w) ? null : (
            <button
              key={w}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", w)}
              onClick={() => setSelected(selected === w ? null : w)}
              className={`pop-btn px-5 py-2 text-lg cursor-grab ${selected === w ? "bg-accent animate-wiggle" : "bg-card"}`}
            >
              {w}
            </button>
          ),
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {q.images?.map((emoji, i) => {
          const word = placed[i];
          const state = checked ? (word === q.options[i] ? "bg-success/25" : "bg-destructive/20 animate-shake") : "bg-muted";
          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => drop(i, e.dataTransfer.getData("text/plain"))}
              onClick={() => selected && drop(i, selected)}
              className={`pop-card ${state} flex flex-col items-center gap-2 p-4 cursor-pointer transition-colors`}
            >
              <span className="text-6xl animate-float" style={{ animationDelay: `${i * 0.3}s` }}>{emoji}</span>
              <span className="min-h-10 w-full rounded-xl border-2 border-dashed flex items-center justify-center font-display font-semibold">
                {word ?? "?"}
              </span>
              {checked && word !== q.options[i] && (
                <span className="text-sm font-bold text-success">{q.options[i]}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground">Tip: slovo můžeš přetáhnout, nebo na něj klepnout a pak klepnout na obrázek.</p>
      <div className="flex justify-center">
        <button disabled={!complete || checked} onClick={check} className="pop-btn bg-secondary text-secondary-foreground px-8 py-3 text-xl disabled:opacity-40">
          Zkontrolovat
        </button>
      </div>
    </div>
  );
}
