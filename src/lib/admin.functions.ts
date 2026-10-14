import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const questionSchema = z
  .object({
    kind: z.enum(["choice", "sentence"]),
    category: z.string().trim().min(1).max(40),
    prompt: z.string().trim().min(1).max(300),
    options: z.array(z.string().trim().min(1).max(100)).length(4),
    answer: z.string().trim().min(1).max(100),
    emoji: z.string().trim().max(16).optional().nullable(),
    audio: z.string().trim().max(300).optional().nullable(),
  })
  .refine((q) => q.options.includes(q.answer), { message: "Správná odpověď musí být jednou ze 4 možností" })
  .refine((q) => q.kind !== "sentence" || q.prompt.includes("___"), { message: "Věta musí obsahovat ___ na místě mezery" });

export type QuestionInput = z.infer<typeof questionSchema>;

function checkPassword(pw: string) {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) throw new Error("Heslo administrace není nastavené.");
  if (pw !== expected) throw new Error("Špatné heslo.");
}

function toRow(q: QuestionInput, subject?: string) {
  return {
    ...(subject ? { subject } : {}),
    kind: q.kind,
    category: q.category,
    prompt: q.prompt,
    options: q.options,
    answer: q.answer,
    images: q.emoji ? [q.emoji] : null,
    audio: q.audio || (q.kind === "sentence" ? q.prompt.replace("___", q.answer) : null),
  };
}

export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    return { ok: true };
  });

export const addQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; subject: string; questions: QuestionInput[] }) =>
    z.object({ password: z.string().max(200), subject: z.enum(["en", "cs", "math"]), questions: z.array(questionSchema).min(1).max(1000) }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("questions").insert(data.questions.map((q) => toRow(q, data.subject)));
    if (error) throw new Error(error.message);
    return { inserted: data.questions.length };
  });

export const updateQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: number; question: QuestionInput }) =>
    z.object({ password: z.string().max(200), id: z.number().int(), question: questionSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("questions").update(toRow(data.question)).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: number }) =>
    z.object({ password: z.string().max(200), id: z.number().int() }).parse(d),
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
