import { Button } from "@/components/ui/button";

export const SUBJECTS = [
  { id: "en", label: "Angličtina", icon: "🇬🇧", lang: "en-GB" },
  { id: "cs", label: "Čeština", icon: "🇨🇿", lang: "cs-CZ" },
  { id: "math", label: "Matematika", icon: "🔢", lang: "cs-CZ" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];

export function subjectLang(id: string | undefined) {
  return SUBJECTS.find((s) => s.id === id)?.lang ?? "en-GB";
}

export function subjectMeta(id: string | undefined) {
  return SUBJECTS.find((s) => s.id === (id || "en")) ?? SUBJECTS[0];
}

export function SubjectMenu({ value, onChange, counts, showResults, onResults }: { value: SubjectId; onChange: (s: SubjectId) => void; counts?: Record<string, number>; showResults?: boolean; onResults?: () => void }) {
  return (
    <nav aria-label="Výběr oboru" className="pop-card p-2 md:p-3 grid grid-cols-2 md:flex md:flex-col gap-2 w-full min-w-0 md:w-52 shrink-0 md:sticky md:top-6 self-start">
      {SUBJECTS.map((s, i) => (
        <Button
          variant="ghost"
          key={s.id}
          onClick={() => onChange(s.id)}
          aria-pressed={!showResults && value === s.id}
          className={`pop-btn h-auto min-h-14 min-w-0 px-2 md:px-4 py-2 md:py-3 text-left grid grid-cols-[auto_minmax(0,1fr)] md:flex items-center justify-start gap-x-2 gap-y-0 whitespace-normal md:whitespace-nowrap ${!showResults && value === s.id ? "bg-accent" : "bg-card"}`}
        >
          <span className="text-xl md:text-2xl shrink-0">{s.icon}</span>
          <span className="min-w-0 md:flex-1 text-sm md:text-base"><span className="hidden md:inline">{i + 1}. </span>{s.label}</span>
          {counts && <span className="col-start-2 text-xs text-muted-foreground">{counts[s.id] ?? 0}</span>}
        </Button>
      ))}
      {onResults && (
        <Button
          variant="ghost"
          onClick={onResults}
          aria-pressed={Boolean(showResults)}
          className={`pop-btn h-auto min-h-14 min-w-0 px-2 md:px-4 py-2 md:py-3 text-left grid grid-cols-[auto_minmax(0,1fr)] md:flex items-center justify-start gap-2 whitespace-normal md:whitespace-nowrap ${showResults ? "bg-accent" : "bg-card"}`}
        >
          <span className="text-xl md:text-2xl shrink-0">🏆</span>
          <span className="min-w-0 md:flex-1 text-sm md:text-base"><span className="hidden md:inline">{SUBJECTS.length + 1}. </span>Výsledky</span>
        </Button>
      )}
    </nav>
  );
}
