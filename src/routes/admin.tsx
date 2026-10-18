import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addQuestions, deleteQuestion, deleteQuestions, updateQuestion, verifyAdmin, type QuestionInput } from "@/lib/admin.functions";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { CSV_EXAMPLE, JSON_EXAMPLE, parseFile, type ParseResult } from "@/lib/import-parse";
import type { Question } from "@/lib/quiz";
import { SUBJECTS, SubjectMenu, type SubjectId } from "@/lib/subjects";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administrace – Eli's tests" },
      { name: "description", content: "Správa otázek kvízu Eli's tests." },
      { property: "og:title", content: "Administrace – Eli's tests" },
      { property: "og:description", content: "Správa otázek kvízu Eli's tests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const KEY = "eq-admin-pw";
const input = "w-full rounded-xl border-[3px] px-3 py-2 bg-background font-sans";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

function Admin() {
  const [pw, setPw] = useState<string | null>(null);
  const [tab, setTab] = useState<"form" | "upload" | "db">("form");
  const [subject, setSubject] = useState<SubjectId>("en");
  useEffect(() => setPw(sessionStorage.getItem(KEY)), []);

  if (!pw) return <Login onOk={(p) => { sessionStorage.setItem(KEY, p); setPw(p); }} />;

  const tabs = [
    ["form", "✏️ Formulář"],
    ["upload", "📁 Nahrát soubor"],
    ["db", "🗄️ Databáze"],
  ] as const;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-[90rem] px-2 flex flex-col md:flex-row gap-8 md:gap-16 lg:gap-24">
        <SubjectMenu value={subject} onChange={setSubject} />
        <div className="flex-1 min-w-0 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold"><span className="text-primary">Admin</span> <span className="text-secondary">Quest</span> <span className="text-2xl">· {SUBJECTS.find((x) => x.id === subject)?.icon} {SUBJECTS.find((x) => x.id === subject)?.label}</span></h1>
          <div className="flex gap-2">
            <Link to="/" className="pop-btn bg-card px-4 py-2">← Kvíz</Link>
            <button onClick={() => { sessionStorage.removeItem(KEY); setPw(null); }} className="pop-btn bg-muted px-4 py-2">Odhlásit</button>
          </div>
        </header>
        <nav className="flex flex-wrap gap-3">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`pop-btn px-5 py-2 ${tab === k ? "bg-accent" : "bg-card"}`}>{l}</button>
          ))}
        </nav>
        <section className="pop-card p-6">
          {tab === "form" && <FormTab key={subject} subject={subject} pw={pw} />}
          {tab === "upload" && <UploadTab key={subject} subject={subject} pw={pw} />}
          {tab === "db" && <DbTab key={subject} subject={subject} pw={pw} />}
        </section>
        </div>
      </div>
    </main>
  );
}

function Login({ onOk }: { onOk: (pw: string) => void }) {
  const verify = useServerFn(verifyAdmin);
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form
        className="pop-card p-8 w-full max-w-sm space-y-4 text-center"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr("");
          try { await verify({ data: { password: v } }); onOk(v); } catch (x) { setErr(errMsg(x)); }
        }}
      >
        <div className="text-5xl">🔐</div>
        <h1 className="text-3xl font-bold">Administrace</h1>
        <input type="password" value={v} onChange={(e) => setV(e.target.value)} placeholder="Heslo" className={input} />
        {err && <p className="text-destructive font-semibold">{err}</p>}
        <button className="pop-btn bg-primary text-primary-foreground px-6 py-2 w-full">Vstoupit</button>
        <Link to="/" className="block text-sm text-muted-foreground underline">Zpět na kvíz</Link>
      </form>
    </main>
  );
}

const empty: QuestionInput = { kind: "sentence", category: "Gramatika", prompt: "", options: ["", "", "", ""], answer: "", emoji: "" };

function QuestionForm({ initial, submitLabel, onSubmit }: { initial: QuestionInput; submitLabel: string; onSubmit: (q: QuestionInput) => Promise<void> }) {
  const [q, setQ] = useState(initial);
  const [correct, setCorrect] = useState(Math.max(0, initial.options.indexOf(initial.answer)));
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setMsg(null);
        try {
          await onSubmit({ ...q, answer: q.options[correct] ?? "" });
          setMsg({ ok: true, t: "Uloženo! 🎉" });
          if (submitLabel === "Přidat") { setQ({ ...empty, kind: q.kind, category: q.category }); setCorrect(0); }
        } catch (x) { setMsg({ ok: false, t: errMsg(x) }); }
        setBusy(false);
      }}
    >
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="space-y-1"><span className="font-semibold">Typ</span>
          <select className={input} value={q.kind} onChange={(e) => setQ({ ...q, kind: e.target.value as QuestionInput["kind"] })}>
            <option value="sentence">Doplň do věty</option>
            <option value="choice">Otázka / slovíčko</option>
          </select>
        </label>
        <label className="space-y-1"><span className="font-semibold">Kategorie</span>
          <input className={input} list="cats" value={q.category} onChange={(e) => setQ({ ...q, category: e.target.value })} />
          <datalist id="cats"><option value="Gramatika" /><option value="Předložky" /><option value="Slovíčka" /><option value="Pravopis" /><option value="Počítání" /><option value="Slovní úlohy" /></datalist>
        </label>
        <label className="space-y-1"><span className="font-semibold">Emoji (nepovinné)</span>
          <input className={input} value={q.emoji ?? ""} onChange={(e) => setQ({ ...q, emoji: e.target.value })} placeholder="🐶" />
        </label>
      </div>
      <label className="block space-y-1"><span className="font-semibold">Otázka</span>
        <input className={input} value={q.prompt} onChange={(e) => setQ({ ...q, prompt: e.target.value })}
          placeholder={q.kind === "sentence" ? "She ___ to school every day." : "Co znamená slovo „dog“?"} />
        {q.kind === "sentence" && <span className="text-sm text-muted-foreground">Místo chybějícího slova napiš ___ (tři podtržítka).</span>}
      </label>
      <div className="space-y-2">
        <span className="font-semibold">Možnosti – zaškrtni správnou</span>
        {q.options.map((o, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-xl p-2 ${correct === i ? "bg-success/20" : ""}`}>
            <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="size-5 accent-[var(--success)]" />
            <input className={input} value={o} placeholder={`Možnost ${"ABCD"[i]}`}
              onChange={(e) => { const opts = [...q.options]; opts[i] = e.target.value; setQ({ ...q, options: opts }); }} />
          </div>
        ))}
      </div>
      {msg && <p className={`font-semibold ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.t}</p>}
      <button disabled={busy} className="pop-btn bg-primary text-primary-foreground px-8 py-3 text-lg disabled:opacity-50">{busy ? "Ukládám…" : submitLabel}</button>
    </form>
  );
}

function FormTab({ pw, subject }: { pw: string; subject: SubjectId }) {
  const add = useServerFn(addQuestions);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Přidat otázku</h2>
      <QuestionForm initial={empty} submitLabel="Přidat" onSubmit={async (q) => { await add({ data: { password: pw, subject, questions: [q] } }); }} />
    </div>
  );
}

function UploadTab({ pw, subject }: { pw: string; subject: SubjectId }) {
  const add = useServerFn(addQuestions);
  const [res, setRes] = useState<ParseResult | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Hromadné nahrání (CSV / JSON)</h2>
      <label className="pop-btn bg-secondary text-secondary-foreground px-6 py-3 inline-block cursor-pointer">
        📁 Vybrat soubor
        <input type="file" accept=".csv,.json" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setMsg(null);
          if (f.size > 2_000_000) { setRes({ valid: [], errors: ["Soubor je větší než 2 MB."] }); return; }
          setRes(parseFile(f.name, await f.text()));
          e.target.value = "";
        }} />
      </label>
      {res && (
        <div className="space-y-3">
          <p className="font-semibold">✅ Platných otázek: {res.valid.length} &nbsp; ❌ Chyb: {res.errors.length}</p>
          {res.errors.length > 0 && (
            <ul className="max-h-40 overflow-auto rounded-xl bg-destructive/10 p-3 text-sm space-y-1">
              {res.errors.map((er, i) => <li key={i}>{er}</li>)}
            </ul>
          )}
          {res.valid.length > 0 && (
            <button className="pop-btn bg-primary text-primary-foreground px-6 py-2" onClick={async () => {
              try {
                const r = await add({ data: { password: pw, subject, questions: res.valid } });
                setMsg({ ok: true, t: `Nahráno ${r.inserted} otázek! 🎉` }); setRes(null);
              } catch (x) { setMsg({ ok: false, t: errMsg(x) }); }
            }}>Nahrát {res.valid.length} platných otázek</button>
          )}
        </div>
      )}
      {msg && <p className={`font-semibold ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.t}</p>}
      <div className="rounded-2xl bg-muted p-4 space-y-3 text-sm">
        <h3 className="text-lg font-bold">Nápověda – formát CSV</h3>
        <p>První řádek je hlavička. Oddělovač je středník (lze i čárka). Sloupce:</p>
        <ul className="list-disc pl-5">
          <li><b>kind</b> – <code>sentence</code> (doplň do věty, mezera = ___) nebo <code>choice</code> (otázka)</li>
          <li><b>category</b> – např. Gramatika, Předložky, Slovíčka</li>
          <li><b>prompt</b> – text otázky</li>
          <li><b>option1–option4</b> – čtyři možnosti</li>
          <li><b>correct</b> – číslo správné možnosti (1–4)</li>
          <li><b>emoji</b> – nepovinný obrázek</li>
        </ul>
        <pre className="overflow-auto rounded-xl bg-card p-3 border-2">{CSV_EXAMPLE}</pre>
        <h3 className="text-lg font-bold">Formát JSON</h3>
        <pre className="overflow-auto rounded-xl bg-card p-3 border-2">{JSON_EXAMPLE}</pre>
        <button className="underline" onClick={() => {
          const url = URL.createObjectURL(new Blob(["\uFEFF" + CSV_EXAMPLE], { type: "text/csv" }));
          const a = document.createElement("a"); a.href = url; a.download = "vzor-otazky.csv"; a.click(); URL.revokeObjectURL(url);
        }}>Stáhnout vzorový CSV</button>
      </div>
    </div>
  );
}

function DbTab({ pw, subject }: { pw: string; subject: SubjectId }) {
  const del = useServerFn(deleteQuestion);
  const bulkDel = useServerFn(deleteQuestions);
  const queryClient = useQueryClient();
  const upd = useServerFn(updateQuestion);
  const [rows, setRows] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; t: string } | null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("questions").select("*").eq("subject", subject).order("id", { ascending: false });
    if (error) { setMessage({ ok: false, t: error.message }); return; }
    setRows((data ?? []) as Question[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => (!category || r.category === category) && `${r.prompt} ${r.category} ${r.options.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const changeFilter = () => { setSelected(new Set()); setEditing(null); setMessage(null); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Databáze otázek ({rows.length})</h2>
        <input aria-label="Hledat otázky" className={`${input} max-w-xs`} placeholder="Hledat…" value={search} disabled={busy} onChange={(e) => { setSearch(e.target.value); changeFilter(); }} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Filtrovat podle kategorie" className={`${input} sm:max-w-xs`} value={category} disabled={busy} onChange={(e) => { setCategory(e.target.value); changeFilter(); }}>
          <option value="">Všechny kategorie</option>
          {[...new Set(rows.map((r) => r.category))].sort().map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" className="size-5 accent-primary" checked={allSelected} disabled={busy || filtered.length === 0} onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((r) => r.id)) : new Set())} />
          Vybrat zobrazené ({filtered.length})
        </label>
        <span className="text-muted-foreground">Vybráno: {selected.size}</span>
        <Button variant="destructive" disabled={busy || selected.size === 0} onClick={() => { setMessage(null); setConfirmOpen(true); }}><Trash2 /> Smazat vybrané ({selected.size})</Button>
      </div>
      {message && <p role="status" className={`font-semibold ${message.ok ? "text-success" : "text-destructive"}`}>{message.t}</p>}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!busy) setConfirmOpen(open); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat vybrané otázky ({selected.size})?</AlertDialogTitle>
            <AlertDialogDescription>Obor: {SUBJECTS.find((s) => s.id === subject)?.label}. Trvale smažete pouze označené otázky. Ostatní otázky a výsledky kvízů zůstanou zachované. Smazání nelze vrátit.</AlertDialogDescription>
          </AlertDialogHeader>
          {message && !message.ok && <p role="alert" className="text-destructive">{message.t}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Zrušit</AlertDialogCancel>
            <Button variant="destructive" disabled={busy} onClick={async () => {
              setBusy(true); setMessage(null);
              try {
                const result = await bulkDel({ data: { password: pw, subject, ids: [...selected] } });
                setRows((current) => current.filter((r) => !selected.has(r.id)));
                setSelected(new Set()); setEditing(null); setConfirmOpen(false);
                setMessage({ ok: true, t: `Smazáno ${result.deleted} otázek.` });
                await queryClient.invalidateQueries({ queryKey: ["questions"] });
                await load();
              } catch (e) { setMessage({ ok: false, t: errMsg(e) }); }
              finally { setBusy(false); }
            }}><Trash2 /> {busy ? "Mažu…" : "Trvale smazat"}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="max-h-[60vh] overflow-auto space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground py-4">Žádné otázky pro tento výběr.</p>}
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border-2 p-3">
            {editing === r.id && r.kind !== "match" ? (
              <QuestionForm
                initial={{ kind: r.kind, category: r.category, prompt: r.prompt, options: r.options, answer: r.answer ?? "", emoji: r.images?.[0] ?? "" }}
                submitLabel="Uložit změny"
                onSubmit={async (q) => { await upd({ data: { password: pw, id: r.id, question: q } }); setEditing(null); await load(); }}
              />
            ) : (
              <div className="flex flex-wrap items-start gap-3">
                <input type="checkbox" aria-label={`Vybrat otázku ${r.id}`} className="size-5 shrink-0 accent-primary" disabled={busy} checked={selected.has(r.id)} onChange={(e) => setSelected((current) => { const next = new Set(current); if (e.target.checked) next.add(r.id); else next.delete(r.id); return next; })} />
                <div className="text-sm min-w-0 flex-1 break-words">
                  <span className="font-bold">#{r.id}</span> · <span className="text-muted-foreground">{r.category} · {r.kind}</span>
                  <p className="font-semibold text-base">{r.images?.[0] && r.kind !== "match" ? `${r.images[0]} ` : ""}{r.prompt}</p>
                  <p>{r.kind === "match" ? r.options.map((o, i) => `${r.images?.[i]} ${o}`).join(" · ") : r.options.map((o) => (o === r.answer ? `✅ ${o}` : o)).join(" · ")}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.kind !== "match" && <Button disabled={busy} onClick={() => setEditing(r.id)} variant="outline" size="sm">Upravit</Button>}
                  <Button disabled={busy} onClick={async () => {
                    if (!confirm("Opravdu smazat?")) return;
                    setBusy(true); setMessage(null);
                    try { await del({ data: { password: pw, id: r.id } }); setSelected((current) => { const next = new Set(current); next.delete(r.id); return next; }); await queryClient.invalidateQueries({ queryKey: ["questions"] }); await load(); }
                    catch (e) { setMessage({ ok: false, t: errMsg(e) }); } finally { setBusy(false); }
                  }} variant="destructive" size="sm">Smazat</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
