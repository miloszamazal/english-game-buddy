import { z } from "zod";

export const playerCredentials = z.object({
  username: z.string().trim().min(1, "Napiš svoje jméno.").max(30, "Jméno může mít nejvýše 30 znaků."),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků.").max(10, "Heslo může mít nejvýše 10 znaků."),
  register: z.boolean(),
});

export async function playerEmail(username: string) {
  const bytes = new TextEncoder().encode(username.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return `${Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("")}@players.invalid`;
}