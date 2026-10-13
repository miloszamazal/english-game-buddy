import { questionSchema, type QuestionInput } from "./admin.functions";

export const CSV_HEADER = "kind;category;prompt;option1;option2;option3;option4;correct;emoji";
export const CSV_EXAMPLE = `${CSV_HEADER}
sentence;Gramatika;She ___ to school every day.;goes;go;going;gone;1;
choice;Slovíčka;Co znamená slovo „dog“?;pes;kočka;kůň;myš;1;🐶
sentence;Předložky;The cat is ___ the table.;at;under;of;to;2;`;

export const JSON_EXAMPLE = `[
  {
    "kind": "sentence",
    "category": "Gramatika",
    "prompt": "I ___ a student.",
    "options": ["am", "is", "are", "be"],
    "answer": "am"
  }
]`;

function parseLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export type ParseResult = { valid: QuestionInput[]; errors: string[] };

function validate(raw: unknown[], label: (i: number) => string): ParseResult {
  const valid: QuestionInput[] = [];
  const errors: string[] = [];
  raw.forEach((r, i) => {
    const res = questionSchema.safeParse(r);
    if (res.success) valid.push(res.data);
    else errors.push(`${label(i)}: ${res.error.issues.map((x) => x.message).join(", ")}`);
  });
  return { valid, errors };
}

export function parseFile(name: string, text: string): ParseResult {
  if (name.toLowerCase().endsWith(".json")) {
    let data: unknown;
    try { data = JSON.parse(text); } catch { return { valid: [], errors: ["Soubor není platný JSON."] }; }
    if (!Array.isArray(data)) return { valid: [], errors: ["JSON musí být pole otázek [ ... ]."] };
    return validate(data, (i) => `Otázka ${i + 1}`);
  }
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { valid: [], errors: ["CSV musí mít hlavičku a alespoň jeden řádek."] };
  const sep = (lines[0] ?? "").includes(";") ? ";" : ",";
  const rows = lines.slice(1).map((l) => {
    const [kind, category, prompt, o1, o2, o3, o4, correct, emoji] = parseLine(l, sep);
    const options = [o1, o2, o3, o4].map((o) => o ?? "");
    const idx = Number(correct) - 1;
    return { kind, category, prompt, options, answer: options[idx] ?? "", emoji: emoji || null };
  });
  return validate(rows, (i) => `Řádek ${i + 2}`);
}
