import { Check, X } from "lucide-react";
import { incorrectAttempts, type QuestionAttempt } from "@/lib/quiz";

export function MistakeReview({ attempts }: { attempts: QuestionAttempt[] }) {
  const mistakes = incorrectAttempts(attempts);
  return (
    <section id="mistake-review" className="space-y-4 text-left">
      <h3 className="font-display text-2xl font-bold">Chybné odpovědi · {mistakes.length}</h3>
      {mistakes.length === 0 && <p className="text-success font-bold">Všechny odpovědi jsou správně! 🎉</p>}
      <ol className="space-y-4">
        {mistakes.map(({ question: q, response }, index) => (
          <li key={q.id} className="border-t pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{q.category} · Otázka {attempts.findIndex((a) => a.question.id === q.id) + 1}</p>
            <h4 className="text-xl font-bold break-words">{q.kind !== "match" && q.images?.[0]} {q.prompt}</h4>
            {q.kind === "match" && typeof response !== "string" ? (
              <ul className="space-y-2">
                {q.options.map((word, i) => (
                  <li key={`${index}-${i}`} className="flex flex-wrap items-center gap-2">
                    <span className="text-3xl" aria-hidden="true">{q.images?.[i]}</span>
                    {response[i] !== word && <span className="inline-flex items-center gap-1 text-destructive break-all"><X className="size-4 shrink-0" />Tvoje odpověď: {response[i] ?? "Bez odpovědi"}</span>}
                    <span className="inline-flex items-center gap-1 rounded-md bg-success/25 px-3 py-2 font-bold break-all"><Check className="size-4 shrink-0 text-success" />Správně: {word}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2">
                <p className="flex items-start gap-2 text-destructive break-words"><X className="size-5 shrink-0" /><span>Tvoje odpověď: {typeof response === "string" ? response : "Bez odpovědi"}</span></p>
                <p className="flex items-start gap-2 rounded-md bg-success/25 px-3 py-2 font-bold break-words"><Check className="size-5 shrink-0 text-success" /><span>Správně: {q.kind === "sentence" ? q.prompt.replaceAll("___", q.answer ?? "") : q.answer}</span></p>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}