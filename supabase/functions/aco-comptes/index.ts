// APP CONTROL D'OBRES · V87.613 · Funció «aco-comptes» (Supabase Edge Function): els comptes del núvol des de l'app, sense el panell de Supabase
// (l'Héctor, 15/11/2026: si algú oblida la contrasenya, ara només es pot canviar amb SQL; crear un compte nou també és feina del panell).
//   accio "ping"        → si la funció hi és i si qui la crida és administrador.
//   accio "llista"      → els comptes d'empresa (@usuaris.controlobres.app): usuari, quan es va crear i l'últim accés. Mai les contrasenyes.
//   accio "crea"        → {usuari, contrasenya}: un compte d'empresa nou, ja confirmat (com «Add user → Auto Confirm User» del panell).
//   accio "contrasenya" → {usuari, contrasenya}: posa una contrasenya nova a un compte d'empresa (quan l'ha oblidada).
// MAI esborra cap usuari (s'esborrarien totes les seves dades) ni toca el compte de les còpies («copies») ni cap compte que no sigui d'empresa.
// Només la poden fer servir els correus del secret ACO_ADMINS (Edge Functions → Secrets; separats per comes). Sense aquest secret no fa res.
// Instal·lació: docs/comptes-nuvol.md («Verify JWT» apagat, com aco-ia: la funció comprova ella mateixa qui la crida).

const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
// Claus de Supabase: les noves són diccionaris JSON ({"default": "sb_…"}) i, si no n'hi ha, les d'abans. La secreta nova va a «apikey».
const claus = (nom: string) => { try { return String(JSON.parse(Deno.env.get(nom) ?? "{}")?.default ?? ""); } catch { return ""; } };
const SB_ANON = claus("SUPABASE_PUBLISHABLE_KEYS") || (Deno.env.get("SUPABASE_ANON_KEY") ?? "");
const SB_SERVICE = claus("SUPABASE_SECRET_KEYS") || (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
const ADMINS = (Deno.env.get("ACO_ADMINS") ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
const DOMINI = "usuaris.controlobres.app";
const PROTEGITS = new Set(["copies"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const err = (codi: string, error: string, status = 400) => json({ codi, error }, status);

// API d'administració d'Auth amb la clau secreta (només al servidor)
const admin = (path: string, init: RequestInit = {}) => fetch(`${SB_URL}/auth/v1/admin/${path}`, {
  ...init,
  headers: { apikey: SB_SERVICE, ...(SB_SERVICE.startsWith("sb_") ? {} : { Authorization: `Bearer ${SB_SERVICE}` }), "Content-Type": "application/json", ...(init.headers ?? {}) },
});

// qui crida: el correu del seu compte (amb el seu token)
async function correuDe(req: Request): Promise<string> {
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: req.headers.get("apikey") || SB_ANON, Authorization: req.headers.get("Authorization") ?? "" } });
  if (!r.ok) return "";
  return String((await r.json())?.email || "").toLowerCase();
}

type Usuari = { id: string; email?: string; created_at?: string; last_sign_in_at?: string | null };
// tots els usuaris (per pàgines de 200)
async function tots(): Promise<Usuari[]> {
  const out: Usuari[] = [];
  for (let p = 1; p <= 50; p++) {
    const r = await admin(`users?page=${p}&per_page=200`);
    if (!r.ok) throw new Error(`Auth ${r.status}`);
    const d = await r.json();
    const us: Usuari[] = Array.isArray(d) ? d : (d?.users ?? []);
    out.push(...us);
    if (us.length < 200) break;
  }
  return out;
}
const usuariDe = (email = "") => email.toLowerCase().endsWith("@" + DOMINI) ? email.toLowerCase().slice(0, -(DOMINI.length + 1)) : "";
const usuariValid = (u: string) => /^[a-z0-9][a-z0-9-]{1,39}$/.test(u) && !u.endsWith("-") && !PROTEGITS.has(u);

// V87.646 · Supabase diu «weak_password» quan la contrasenya és massa curta, massa fàcil o surt en filtracions (HaveIBeenPwned)
async function feble(r: Response): Promise<boolean> {
  try { const j = await r.clone().json(); return j?.code === "weak_password" || j?.error_code === "weak_password" || !!j?.weak_password; } catch { return false; }
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return err("metode", "Només POST.", 405);
  if (!SB_URL || !SB_SERVICE) return err("config", "Falten les claus de Supabase a la funció.", 500);
  if (!ADMINS.length) return err("no-admin", "Falta el secret ACO_ADMINS (el correu de l'administrador).", 403);
  const qui = await correuDe(req);
  if (!qui) return err("entrar", "Cal entrar a l'app.", 401);
  if (!ADMINS.includes(qui)) return err("no-admin", "Només el compte principal.", 403);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return err("dades", "Dades no vàlides."); }
  const accio = String(body.accio || "");
  try {
    if (accio === "ping") return json({ ok: true });

    if (accio === "llista") {
      const comptes = (await tots())
        .map(u => ({ usuari: usuariDe(u.email), creat: u.created_at || null, ultim: u.last_sign_in_at || null }))
        .filter(c => c.usuari && !PROTEGITS.has(c.usuari))
        .sort((a, b) => a.usuari.localeCompare(b.usuari));
      return json({ comptes });
    }

    const usuari = String(body.usuari || "").trim().toLowerCase();
    const contrasenya = String(body.contrasenya || "");
    if (!usuariValid(usuari)) return err("usuari", "L'usuari només pot tenir lletres minúscules, números i guions (de 2 a 40).");
    // V87.646 · mínim 10 (com l'app i Supabase › Authentication); una contrasenya filtrada o massa fàcil la rebutja Supabase («weak_password»)
    if (contrasenya.length < 10 || contrasenya.length > 72) return err("contrasenya", "La contrasenya ha de tenir entre 10 i 72 caràcters.");
    const email = `${usuari}@${DOMINI}`;

    if (accio === "crea") {
      const r = await admin("users", { method: "POST", body: JSON.stringify({ email, password: contrasenya, email_confirm: true }) });
      if (!r.ok && await feble(r)) return err("feble", "Aquesta contrasenya surt en filtracions d'internet o és massa fàcil.", 422);
      if (r.status === 422 || r.status === 409) return err("existeix", "Aquest usuari ja existeix.", 409);
      if (!r.ok) return err("auth", `No s'ha pogut crear (${r.status}).`, 502);
      console.log(JSON.stringify({ accio: "crea", usuari, per: qui, at: new Date().toISOString() }));
      return json({ ok: true, usuari });
    }

    if (accio === "contrasenya") {
      const u = (await tots()).find(x => String(x.email || "").toLowerCase() === email);
      if (!u) return err("no-existeix", "Aquest usuari no existeix.", 404);
      const r = await admin(`users/${u.id}`, { method: "PUT", body: JSON.stringify({ password: contrasenya }) });
      if (!r.ok && await feble(r)) return err("feble", "Aquesta contrasenya surt en filtracions d'internet o és massa fàcil.", 422);
      if (!r.ok) return err("auth", `No s'ha pogut canviar (${r.status}).`, 502);
      console.log(JSON.stringify({ accio: "contrasenya", usuari, per: qui, at: new Date().toISOString() }));
      return json({ ok: true, usuari });
    }

    return err("accio", "Acció desconeguda.");
  } catch (e) {
    console.error(e);
    return err("servidor", "Error del servidor.", 500);
  }
});
