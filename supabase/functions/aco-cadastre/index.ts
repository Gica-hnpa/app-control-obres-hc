// APP CONTROL D'OBRES · V87.670 · Funció «aco-cadastre» (Supabase Edge Function), amb «Verify JWT» apagat (com «aco-ia»: l'usuari es comprova aquí).
// Baixa la fitxa d'un immoble del Cadastre (la «Consulta descriptiva i gràfica de dades cadastrals», el PDF públic de la Seu Electrònica del
// Cadastre) amb la referència cadastral de 20 caràcters, perquè l'app la desi sola a Documents › «01 Documentació prèvia» (l'Héctor, 27/11/2026:
// «un botó que sigui descarregar la fitxa de la finca treta del cadastre i que després automàticament s'adjunti a documents»).
// El navegador no la pot baixar directament (la Seu del Cadastre no permet que una altra web la llegeixi: CORS); aquí sí.
// No guarda res ni fa servir cap clau: només la sessió de l'usuari de l'app.
//   POST { rc: "9872023VH5797S0001WX" }  →  el PDF (application/pdf), o { error } en JSON
const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const claus = (nom: string) => { try { return String(JSON.parse(Deno.env.get(nom) ?? "{}")?.default ?? ""); } catch { return ""; } };
const SB_ANON = claus("SUPABASE_PUBLISHABLE_KEYS") || (Deno.env.get("SUPABASE_ANON_KEY") ?? "");
const SEU = "https://www1.sedecatastro.gob.es/CYCBienInmueble/SECImprimirCroquisYDatos.aspx?refcat=";
const MAX_PDF = 15 * 1024 * 1024;
const PER_MINUT = 10;

// com «aco-ia»: des del navegador, només l'app (la de Render, la de l'ordinador i la de la xarxa de casa); més adreces al secret ACO_ORIGENS
const ORIGENS = ["https://app-control-obres-hc.onrender.com", ...(Deno.env.get("ACO_ORIGENS") ?? "").split(",").map((s) => s.trim()).filter(Boolean)];
const origenOk = (o: string) => ORIGENS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(o);
const corsDe = (req: Request): Record<string, string> => {
  const o = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": origenOk(o) ? o : ORIGENS[0], "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};
const json = (body: unknown, status: number, c: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...c, "Content-Type": "application/json" } });

async function usuari(req: Request): Promise<string> {
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: req.headers.get("apikey") || SB_ANON, Authorization: req.headers.get("Authorization") ?? "" } });
  if (!r.ok) throw new Error("Cal entrar a l'app.");
  const u = await r.json();
  if (!u?.id) throw new Error("Cal entrar a l'app.");
  return String(u.id);
}
// com a molt PER_MINUT fitxes per minut i compte (en aquesta instància de la funció)
const vistes = new Map<string, number[]>();
function massa(id: string): boolean {
  const ara = Date.now(), l = (vistes.get(id) ?? []).filter((t) => ara - t < 60000);
  l.push(ara); vistes.set(id, l);
  return l.length > PER_MINUT;
}

Deno.serve(async (req) => {
  const c = corsDe(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: c });
  const origen = req.headers.get("origin");
  if (origen && !origenOk(origen)) return json({ error: "Només es pot fer servir des de l'app." }, 403, c);
  if (req.method !== "POST") return json({ error: "Només POST." }, 405, c);
  let id: string, rc: string;
  try {
    const cos = JSON.parse((await req.text()).slice(0, 2000) || "{}");
    rc = String(cos?.rc ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    id = await usuari(req);
  } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 401, c); }
  if (cos_ok(rc) === false) return json({ error: "Cal la referència cadastral de l'immoble (20 caràcters)." }, 400, c);
  if (massa(id)) return json({ error: "Massa fitxes seguides: espera un minut." }, 429, c);
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 45000);
    const r = await fetch(SEU + rc, { signal: ctl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; G3C)" } });
    clearTimeout(t);
    const tipus = r.headers.get("content-type") ?? "";
    if (!r.ok || !/pdf/i.test(tipus)) return json({ error: "El Cadastre no ha donat la fitxa d'aquesta referència." }, 502, c);
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.length < 1000 || buf.length > MAX_PDF) return json({ error: "El Cadastre no ha donat la fitxa d'aquesta referència." }, 502, c);
    return new Response(buf, { status: 200, headers: { ...c, "Content-Type": "application/pdf", "Cache-Control": "no-store" } });
  } catch {
    return json({ error: "No s'ha pogut connectar amb el Cadastre." }, 504, c);
  }
});
function cos_ok(rc: string): boolean { return /^[0-9A-Z]{20}$/.test(rc); }
