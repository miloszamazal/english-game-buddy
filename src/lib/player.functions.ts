import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { playerCredentials, playerEmail } from "@/lib/player-credentials";

export const authenticatePlayer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => playerCredentials.parse(input))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Přihlášení nyní není dostupné.");
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const email = await playerEmail(data.username);
    const result = data.register
      ? await client.auth.signUp({ email, password: data.password, options: { data: { username: data.username } } })
      : await client.auth.signInWithPassword({ email, password: data.password });
    if (result.error || !result.data.session) {
      return { session: null, error: data.register
        ? "Jméno už může být obsazené nebo heslo není dostatečně bezpečné. Zkus přihlášení nebo jiné heslo."
        : "Jméno nebo heslo není správné. Zkus to znovu." };
    }
    return { session: { access_token: result.data.session.access_token, refresh_token: result.data.session.refresh_token }, error: null };
  });