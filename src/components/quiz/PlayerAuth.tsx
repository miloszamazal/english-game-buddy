import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { authenticatePlayer } from "@/lib/player.functions";
import { playerCredentials } from "@/lib/player-credentials";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Player = { id: string; username: string };
const PlayerContext = createContext<{ player: Player | null; loading: boolean }>({ player: null, loading: true });
export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let active = true;
    let version = 0;
    const refresh = async () => {
      const current = ++version;
      const { data: { user } } = await supabase.auth.getUser();
      const profile = user ? await supabase.from("profiles").select("id, username").eq("id", user.id).maybeSingle() : null;
      if (active && current === version) {
        setPlayer(profile?.data ?? null);
        setLoading(false);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      if (event === "SIGNED_OUT") { ++version; setPlayer(null); setLoading(false); }
      else { setLoading(true); setTimeout(() => { void refresh(); }, 0); }
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    void refresh();
    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient, router]);
  return <PlayerContext.Provider value={{ player, loading }}>{children}</PlayerContext.Provider>;
}

export function PlayerAuth({ names }: { names: string[] }) {
  const { player, loading } = usePlayer();
  const authenticate = useServerFn(authenticatePlayer);
  const [register, setRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const parsed = playerCredentials.safeParse({ username, password, register });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Zkontroluj jméno a heslo."); return; }
    if (register && password !== confirmation) { setError("Hesla se neshodují."); return; }
    setBusy(true);
    try {
      const result = await authenticate({ data: parsed.data });
      if (!result.session) { setError(result.error ?? "Přihlášení se nepodařilo."); return; }
      const { error: sessionError } = await supabase.auth.setSession(result.session);
      if (sessionError) throw sessionError;
      setPassword(""); setConfirmation("");
    } catch { setError("Přihlášení se nepodařilo. Zkus to znovu za chvíli."); }
    finally { setBusy(false); }
  };
  if (loading) return <p role="status" className="text-muted-foreground">Načítám hráče…</p>;
  if (player) return <div className="space-y-3"><p className="font-display text-xl text-success break-words">👤 {player.username}</p><Button variant="outline" onClick={async () => { const { error: logoutError } = await supabase.auth.signOut(); if (logoutError) setError("Odhlášení se nepodařilo."); }}><LogOut className="size-4" /> Odhlásit</Button>{error && <p role="alert" className="text-destructive">{error}</p>}</div>;
  return <form onSubmit={submit} className="mx-auto w-full max-w-xs space-y-4 text-left">
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant={register ? "outline" : "secondary"} aria-pressed={!register} onClick={() => { setRegister(false); setUsername(""); setPassword(""); setConfirmation(""); setError(""); }}>Přihlášení</Button>
      <Button type="button" variant={register ? "secondary" : "outline"} aria-pressed={register} onClick={() => { setRegister(true); setUsername(""); setPassword(""); setConfirmation(""); setError(""); }}>Nový hráč</Button>
    </div>
    <div className="space-y-2"><label htmlFor="player-name" className="font-display">Tvoje jméno</label>
      {register ? <input id="player-name" value={username} maxLength={30} autoComplete="username" onChange={(e) => setUsername(e.target.value)} className="w-full rounded-md border-2 px-3 py-2 bg-background" required />
        : <Select value={username} onValueChange={setUsername}><SelectTrigger id="player-name" aria-label="Vybrat hráče"><SelectValue placeholder="Vyber svoje jméno" /></SelectTrigger><SelectContent>{names.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>}
    </div>
    {!register && names.length === 0 && <p className="text-sm text-muted-foreground">Zatím tu není žádný registrovaný hráč. Zvol „Nový hráč“.</p>}
    <div className="space-y-2"><label htmlFor="player-password" className="font-display">{register ? "Zvol si heslo (6–10 znaků)" : "Heslo"}</label><input id="player-password" type="password" minLength={6} maxLength={10} autoComplete={register ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border-2 px-3 py-2 bg-background" required /></div>
    {register && <div className="space-y-2"><label htmlFor="player-confirmation" className="font-display">Zopakuj heslo</label><input id="player-confirmation" type="password" maxLength={10} autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="w-full rounded-md border-2 px-3 py-2 bg-background" required /><p className="text-sm text-muted-foreground">Heslo si zapamatuj. Bez e-mailu ho nelze obnovit.</p></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy || !username.trim()}>{register ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}{busy ? "Čekej…" : register ? "Vytvořit hráče" : "Přihlásit se"}</Button>
  </form>;
}