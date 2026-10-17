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
    <nav className="pop-card p-3 flex md:flex-col gap-2 md:w-52 shrink-0 md:sticky md:top-6 self-start overflow-x-auto">
      {SUBJECTS.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`pop-btn px-4 py-3 text-left flex items-center gap-2 whitespace-nowrap ${!showResults && value === s.id ? "bg-accent" : "bg-card"}`}
        >
          <span className="text-2xl">{s.icon}</span>
          <span className="flex-1">{i + 1}. {s.label}</span>
          {counts && <span className="text-xs text-muted-foreground">{counts[s.id] ?? 0}</span>}
        </button>
      ))}
      {onResults && (
        <button
          onClick={onResults}
          className={`pop-btn px-4 py-3 text-left flex items-center gap-2 whitespace-nowrap ${showResults ? "bg-accent" : "bg-card"}`}
        >
          <span className="text-2xl">🏆</span>
          <span className="flex-1">{SUBJECTS.length + 1}. Výsledky</span>
        </button>
      )}
    </nav>
  );
}
