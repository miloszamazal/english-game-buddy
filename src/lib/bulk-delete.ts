import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const bulkDeleteSchema = z.object({
  password: z.string().max(200),
  subject: z.enum(["en", "cs", "math"]),
  ids: z.array(z.number().int().positive()).min(1).max(1000),
});

export async function deleteSelectedQuestions(
  client: Pick<SupabaseClient<Database>, "from">,
  subject: z.infer<typeof bulkDeleteSchema>["subject"],
  ids: number[],
) {
  const { data, error } = await client.from("questions").delete()
    .eq("subject", subject).in("id", [...new Set(ids)]).select("id");
  if (error) throw new Error(error.message);
  return { deleted: data?.length ?? 0 };
}