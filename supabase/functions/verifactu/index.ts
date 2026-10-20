// APP CONTROL D'OBRES · V87.285 (reforçada a la V87.313) · Funció «verifactu» (Supabase Edge Function)
// Emet les factures de les obres amb VERI*FACTU a través de l'intermediari (Verifacti).
//  · Només per als comptes activats a la taula aco_verifactu_comptes (els activa l'Héctor, al panell de Supabase).
//  · El número el dona el servidor (aco_reservar_factura → aco_seguent_numero): correlatiu per compte, sèrie i any. Es
//    reserva i es desa al registre en un sol pas, amb les línies (`entrada`); si l'enviament falla o s'atura a mig camí,
//    la factura es torna a enviar amb el MATEIX número (sense forats). Dues peticions alhora per a la mateixa
//    certificació reben la mateixa factura.
//  · La clau del compte de Verifacti és un secret de Supabase (Edge Functions → Secrets → VERIFACTI_API_KEY) i no surt
//    mai d'aquí. Amb aquesta clau es demana a Verifacti la clau de cada empresa (NIF). Alternativa: VERIFACTI_KEYS amb
//    {"B12345678":"clau de l'empresa", …}.
//  · Cada factura queda a aco_verifactu_registres (l'app la pot llegir, però no canviar ni esborrar).
// Accions (POST, JSON, amb la sessió de l'usuari): compte · emetre · reenviar · estat · anular
//
// PENDENT DE COMPROVAR amb el compte de proves de Verifacti (la documentació pública no ho diu tot): la capçalera
// d'autenticació (ara «Authorization: Bearer …»), el nom de l'entorn a /nifs/keys ({test|prod}), el nom del camp de la
// clau a la resposta i el de l'estat («estado»). Tot està en funcions petites (vfHeaders, nifKey, estatDe) per canviar-ho
// fàcilment.

const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const VF_URL = (Deno.env.get("VERIFACTI_URL") ?? "https://api.verifacti.com").replace(/\/$/, "");
const VF_KEY = Deno.env.get("VERIFACTI_API_KEY") ?? "";
const VF_KEYS: Record<string, string> = (() => { try { return JSON.parse(Deno.env.get("VERIFACTI_KEYS") ?? "{}"); } catch { return {}; } })();
const QR_URL: Record<string, string> = {
  test: "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR",
  prod: "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
class Err extends Error { constructor(msg: string, public status = 400, public extra: Record<string, unknown> = {}) { super(msg); } }

type Compte = { user_id: string; actiu: boolean; entorn: "test" | "prod"; nif: string; nom: string; adreca: string; cp: string; poblacio: string; serie: string };
type Registre = Record<string, unknown> & { id: string; serie: string; numero: string; data_expedicio: string; estat: string; total: number };

// ── Supabase (amb la clau del servidor) ─────────────────────────────────────────────────────────────────────────
async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) },
  });
  const tx = await r.text();
  if (!r.ok) throw new Err(`Base de dades: ${tx.slice(0, 300)}`, 500);
  return tx ? JSON.parse(tx) : null;
}
async function usuari(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_ANON, Authorization: auth } });
  if (!r.ok) throw new Err("Cal entrar a l'app amb el teu compte.", 401);
  return await r.json() as { id: string; email: string };
}
async function compteDe(uid: string): Promise<Compte | null> {
  const rows = await db(`aco_verifactu_comptes?user_id=eq.${uid}&select=*`, { method: "GET" });
  return rows?.[0] ?? null;
}
async function registre(uid: string, id: string): Promise<Registre> {
  const rows = await db(`aco_verifactu_registres?user_id=eq.${uid}&id=eq.${encodeURIComponent(id)}&select=*`, { method: "GET" });
  if (!rows?.[0]) throw new Err("No trobo aquesta factura.", 404);
  return rows[0];
}
async function desa(id: string, canvis: Record<string, unknown>): Promise<Registre> {
  const rows = await db(`aco_verifactu_registres?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ ...canvis, updated_at: new Date().toISOString() }) });
  return rows[0];
}

// ── Verifacti ───────────────────────────────────────────────────────────────────────────────────────────────────
const vfHeaders = (key: string, idem?: string) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(idem ? { "Idempotency-Key": idem } : {}) });
const clausNif = new Map<string, string>();
async function nifKey(c: Compte) {
  if (VF_KEYS[c.nif]) return VF_KEYS[c.nif];
  const k = `${c.entorn}/${c.nif}`;
  if (clausNif.has(k)) return clausNif.get(k)!;
  if (!VF_KEY) throw new Err("Falta la clau VERIFACTI_API_KEY a Supabase.", 500);
  const r = await fetch(`${VF_URL}/nifs/keys/${c.entorn}/${encodeURIComponent(c.nif)}`, { headers: vfHeaders(VF_KEY) });
  const tx = await r.text();
  if (!r.ok) throw new Err(`Verifacti no dona la clau del NIF ${c.nif} (${r.status}). Cal donar d'alta l'empresa a Verifacti.`, 502);
  let key = tx.trim().replace(/^"|"$/g, "");
  try { const j = JSON.parse(tx); key = typeof j === "string" ? j : (j.api_key ?? j.apikey ?? j.key ?? j.token ?? key); } catch { /* text pla */ }
  clausNif.set(k, key);
  return key;
}
async function vf(c: Compte, path: string, body: unknown, idem?: string) {
  const key = await nifKey(c);
  const r = await fetch(`${VF_URL}${path}`, { method: "POST", headers: vfHeaders(key, idem), body: JSON.stringify(body) });
  const tx = await r.text();
  let j: Record<string, unknown> = {};
  try { j = JSON.parse(tx); } catch { j = { text: tx.slice(0, 500) }; }
  return { ok: r.ok, status: r.status, j };
}
const estatDe = (j: Record<string, unknown>, def = "Pendiente") => String(j.estado ?? j.estado_registro ?? j.status ?? def);

// ── Ajudes ──────────────────────────────────────────────────────────────────────────────────────────────────────
const r2 = (x: number) => Math.round((Number(x) || 0) * 100) / 100;
const s2 = (x: number) => r2(x).toFixed(2);
function avuiMadrid() { // AAAA-MM-DD
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p.slice(0, 10);
}
const ddmmaaaa = (iso: string) => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;
function urlQr(c: Compte, reg: Registre) {
  const q = new URLSearchParams({ nif: c.nif, numserie: `${reg.serie}${reg.numero}`, fecha: ddmmaaaa(String(reg.data_expedicio)), importe: s2(Number(reg.total)) });
  return `${QR_URL[c.entorn] ?? QR_URL.test}?${q}`;
}
const IVES = [0, 4, 5, 10, 21];
type Linia = { base: number; iva: number; qualificacio?: string };
// Cos de l'alta a Verifacti (POST /verifactu/create)
function peticio(reg: Registre, linies: Linia[], descripcio: string) {
  return {
    serie: reg.serie, numero: reg.numero, fecha_expedicion: ddmmaaaa(String(reg.data_expedicio)), tipo_factura: "F1",
    descripcion: descripcio.slice(0, 500), nif: reg.nif_destinatari, nombre: String(reg.nom_destinatari).slice(0, 120),
    lineas: linies.map(l => l.qualificacio === "S2"
      ? { base_imponible: s2(l.base), tipo_impositivo: "0", cuota_repercutida: "0", calificacion_operacion: "S2" }
      : { base_imponible: s2(l.base), tipo_impositivo: String(l.iva), cuota_repercutida: s2(l.base * l.iva / 100), calificacion_operacion: "S1" }),
    importe_total: s2(Number(reg.total)),
  };
}
async function envia(c: Compte, reg: Registre) {
  // La data d'expedició ha de ser la d'avui: si es torna a enviar un altre dia, es posa al dia. La petició es refà a partir
  // de les línies desades (`entrada`), així una factura reservada que no s'ha arribat a enviar es pot tornar a enviar.
  const avui = avuiMadrid();
  const ent = (reg.entrada ?? {}) as { linies?: Linia[]; descripcio?: string };
  const pet = ent.linies?.length
    ? peticio({ ...reg, data_expedicio: avui }, ent.linies, String(ent.descripcio ?? ""))
    : { ...((reg.peticio ?? {}) as Record<string, unknown>), fecha_expedicion: ddmmaaaa(avui) };
  if (!pet.lineas) throw new Err("Aquesta factura no té les línies desades: no es pot enviar.", 500);
  if (String(reg.data_expedicio) !== avui || !reg.peticio) reg = await desa(reg.id, { data_expedicio: avui, peticio: pet });
  const r = await vf(c, "/verifactu/create", pet, `${reg.id}`);
  if (!r.ok) {
    const reg2 = await desa(reg.id, { estat: "error", resposta: { status: r.status, ...r.j } });
    throw new Err(`Verifacti ha tornat un error (${r.status}): ${String(r.j.error ?? r.j.message ?? r.j.text ?? "").slice(0, 200)}`, 502, { registre: publica(c, reg2) });
  }
  const reg2 = await desa(reg.id, { estat: estatDe(r.j), uuid_intermediari: String(r.j.uuid ?? ""), url_qr: urlQr(c, reg), resposta: r.j });
  return publica(c, reg2);
}
// El que rep l'app
function publica(c: Compte, reg: Registre) {
  const resp = (reg.resposta ?? {}) as Record<string, unknown>;
  return {
    id: reg.id, serie: reg.serie, numero: reg.numero, numSerie: `${reg.serie}${reg.numero}`, data: String(reg.data_expedicio),
    estat: reg.estat, uuid: reg.uuid_intermediari ?? "", urlQr: reg.url_qr ?? urlQr(c, reg), qr: typeof resp.qr === "string" ? resp.qr : "",
    entorn: c.entorn, emissor: { nif: c.nif, nom: c.nom, adreca: c.adreca, cp: c.cp, poblacio: c.poblacio },
    destinatari: { nif: reg.nif_destinatari, nom: reg.nom_destinatari }, base: Number(reg.base), quota: Number(reg.quota), total: Number(reg.total),
  };
}

// ── Accions ─────────────────────────────────────────────────────────────────────────────────────────────────────
async function emetre(uid: string, c: Compte, b: Record<string, unknown>) {
  const obraId = String(b.obraId ?? ""), certId = String(b.certId ?? "");
  const dest = (b.destinatari ?? {}) as { nif?: string; nom?: string };
  const nif = String(dest.nif ?? "").toUpperCase().replace(/[\s.-]/g, ""), nom = String(dest.nom ?? "").trim();
  const descripcio = String(b.descripcio ?? "").trim();
  const linies = ((b.linies ?? []) as Linia[]).map(l => ({ base: r2(l.base), iva: Number(l.iva), qualificacio: l.qualificacio === "S2" ? "S2" : "S1" }));
  if (!obraId || !certId) throw new Err("Falta l'obra o la certificació.");
  if (!/^[A-Z0-9]{8,9}$/.test(nif)) throw new Err("El NIF del client no és correcte.");
  if (!nom) throw new Err("Falta el nom del client.");
  if (!descripcio) throw new Err("Falta la descripció de la factura.");
  if (!linies.length || linies.some(l => !(l.base > 0) || !IVES.includes(l.iva) || (l.iva === 0 && l.qualificacio !== "S2"))) throw new Err("Les bases o l'IVA de la factura no són correctes.");
  const quota = r2(linies.reduce((s, l) => s + (l.qualificacio === "S2" ? 0 : r2(l.base * l.iva / 100)), 0));
  const base = r2(linies.reduce((s, l) => s + l.base, 0));
  const avui = avuiMadrid(), exercici = Number(avui.slice(0, 4)), serie = `${c.serie || "F"}${exercici}-`;
  // Una certificació, una factura: el servidor reserva el número i desa la factura en un sol pas; si ja n'hi ha una de
  // vigent (p. ex. dos aparells alhora), torna aquella i no gasta cap número.
  const reg = await db("rpc/aco_reservar_factura", {
    method: "POST",
    body: JSON.stringify({ p_user: uid, p_obra: obraId, p_cert: certId, p_serie: serie, p_exercici: exercici, p_data: avui, p_nif: nif, p_nom: nom, p_base: base, p_quota: quota, p_total: r2(base + quota), p_entrada: { linies, descripcio } }),
  }) as Registre & { ja_existia?: boolean };
  if (!reg?.id) throw new Err("No s'ha pogut reservar el número de la factura.", 500);
  if (reg.ja_existia) return { ...publica(c, reg), jaExistia: true };
  return await envia(c, reg);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const u = await usuari(req);
    const b = await req.json().catch(() => ({})) as Record<string, unknown>;
    const c = await compteDe(u.id);
    if (b.accio === "compte") return json(c ? { actiu: !!c.actiu, entorn: c.entorn, nif: c.nif, nom: c.nom, serie: c.serie } : { actiu: false });
    if (!c?.actiu) throw new Err("Aquest compte no té VeriFactu activat.", 403);
    if (b.accio === "emetre") return json(await emetre(u.id, c, b));
    const reg = await registre(u.id, String(b.id ?? ""));
    if (b.accio === "reenviar") {
      if (reg.estat !== "error" && reg.estat !== "reservada") return json(publica(c, reg));
      return json(await envia(c, reg));
    }
    if (b.accio === "estat") {
      if (reg.estat === "error" || reg.estat === "reservada") return json(publica(c, reg));
      const r = await vf(c, "/verifactu/status", { serie: reg.serie, numero: reg.numero, fecha_expedicion: ddmmaaaa(String(reg.data_expedicio)) });
      if (!r.ok) throw new Err(`Verifacti no dona l'estat (${r.status}).`, 502);
      return json(publica(c, await desa(reg.id, { estat: estatDe(r.j, reg.estat), resposta: { ...(reg.resposta as object ?? {}), estat: r.j } })));
    }
    if (b.accio === "anular") {
      if (reg.estat === "Anulada") return json(publica(c, reg));
      if (reg.estat === "error" || reg.estat === "reservada") throw new Err("Aquesta factura encara no consta a Hisenda: torna-la a enviar.", 409);
      const r = await vf(c, "/verifactu/cancel", { serie: reg.serie, numero: reg.numero, fecha_expedicion: ddmmaaaa(String(reg.data_expedicio)) }, `anular-${reg.id}`);
      if (!r.ok) throw new Err(`Verifacti no ha pogut anul·lar la factura (${r.status}).`, 502);
      return json(publica(c, await desa(reg.id, { estat: "Anulada", resposta: { ...(reg.resposta as object ?? {}), anulacio: r.j } })));
    }
    throw new Err("Acció desconeguda.");
  } catch (e) {
    const er = e as Err;
    return json({ error: String(er?.message ?? e), ...(er?.extra ?? {}) }, er?.status ?? 500);
  }
});
