// V87.257 · Núvol (Supabase) amb usuari i contrasenya.
// - En obrir l'app: si tens sessió, es baixen els canvis fets des d'altres aparells
//   abans de mostrar l'app. Si no en tens, et demana el correu i la contrasenya.
// - Cada canvi es puja sol al cap de pocs segons (només el que ha canviat: cada
//   clau de l'app és una fila i les dades de cada expedient, una fila pròpia).
// - Cada 20 s (i en tornar a l'app) es mira si un altre aparell ha canviat res.
// - Sense cobertura l'app continua funcionant; els canvis es pugen en tornar-n'hi.
import { CLOUD_URL, CLOUD_KEY } from "./cloudConfig.js";
import { t } from "./i18n.js";
import { merge3, conflictLabels, diffLabels } from "./merge3.js";

const VERSION = "V87.417";
const APP_KEY = /^aco_/;
// Claus que són pròpies de cada aparell i no s'han de compartir.
const EXCLUDE = /(auto_timer|agenda_view|_sync_tick|aco_supabase)/;
const SPLIT = /__aco_odata$/;
// V87.259 · Comptes d'empresa: entren amb un usuari curt (brava, oriol…) que es
// converteix en un correu intern. Cada compte té el seu espai de dades separat dins
// del navegador (aco_v8782__emp_<usuari>__…), així es poden provar diversos comptes
// al mateix ordinador sense barrejar res.
const USER_DOMAIN = "usuaris.controlobres.app";
function toEmail(v) { v = String(v || "").trim(); return v.includes("@") ? v.toLowerCase() : `${v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9._-]/g, "")}@${USER_DOMAIN}`; }
function companyOf(email) { const e = String(email || "").toLowerCase(); if (!e.endsWith("@" + USER_DOMAIN)) return null; const u = e.split("@")[0]; return { username: u, internal: "emp_" + u.replace(/[^a-z0-9]/g, "") }; }
function inScope(k) { const c = companyOf(session?.email); if (c) return k.startsWith(`aco_v8782__${c.internal}__`); return !/(^|__)emp_/.test(k.replace(/^aco_v8782__/, "")); }
function metaKey() { return `nuvol-aco-estat__${session?.user_id || ""}`; }
function applyCompanyContext() {
  const c = companyOf(session?.email);
  window.__acoEmpresa = c ? { ...c, email: session.email } : null;
  try {
    if (c) { sessionStorage.setItem("aco_current_user8779", c.internal); sessionStorage.setItem("aco-reentrar-auto", c.internal); }
    else { const cur = sessionStorage.getItem("aco_current_user8779") || ""; if (cur.startsWith("emp_")) { sessionStorage.removeItem("aco_current_user8779"); sessionStorage.removeItem("aco-reentrar-auto"); } }
  } catch {}
}
const SESSION_KEY = "nuvol-aco-sessio", META_KEY = "nuvol-aco-estat", SKIP_KEY = "nuvol-aco-ara-no", DEVICE_KEY = "dispositiu-app-control-obres";

let session = null, meta = { userId: "", cursor: "", known: {} }, device = "", active = false;
let timer = null, busy = false, again = false, badge = null, lastOk = "", lastErr = "", remoteWaiting = null, lastInput = Date.now();
let applying = false; // canvis que venen del núvol: no s'han de tornar a pujar
// V87.303 · obres que l'usuari ha esborrat expressament en aquesta sessió («Eliminar» de l'obra): el fre no les compta
// Es desen a l'aparell fins que l'esborrat arriba al núvol: si s'esborren sense connexió i es tanca l'app, en tornar-la a obrir
// el fre tampoc les compta.
const deliberate = new Set(), DELIB_KEY = "nuvol-aco-esborrades";
const deliberateStore = () => window.__acoStore?.real || localStorage;
function loadDeliberate() { try { (JSON.parse(deliberateStore().getItem(DELIB_KEY) || "[]") || []).forEach(x => deliberate.add(String(x))); } catch {} }
function saveDeliberate() { try { if (deliberate.size) deliberateStore().setItem(DELIB_KEY, JSON.stringify([...deliberate].slice(-200))); else deliberateStore().removeItem(DELIB_KEY); } catch {} }

// ---------- utilitats ----------
function hash(str) {
  str = String(str ?? "");
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36) + ":" + str.length;
}
// V87.266 · Dates que l'app posa sola en obrir una obra (no són feina de ningú). No compten per decidir si una peça
// s'ha canviat «de debò» aquí i en un altre lloc: obrir la mateixa obra en dos aparells no ha de fer saltar cap pregunta.
const TOUCH = new Set(["updatedAt", "lastOpenedAt", "lastWorkedAt"]);
function contentHash(v) {
  if (v == null || v === "") return "";
  try { return hash(JSON.stringify(JSON.parse(v), (k, x) => (TOUCH.has(k) ? undefined : x))); } catch { return hash(v); }
}
// Versió coneguda d'una peça (la que hi ha al núvol segons aquest aparell) i el seu contingut sense dates.
function know(k, v) {
  meta.kc ||= {};
  if (v === undefined) { delete meta.known[k]; delete meta.kc[k]; } else { meta.known[k] = hash(v); meta.kc[k] = contentHash(v); }
  setBase(k, v);
}
// V87.293 · Darrera versió comuna de cada peça (la que hi havia al núvol segons aquest aparell). Serveix per ajuntar canvis
// fets alhora en dos llocs: es compara cada versió amb la comuna per saber què ha canviat cadascú. És de l'aparell (no es
// puja ni va al fitxer DADES): clau «nuvol-base__<usuari>__<peça>». Només per a peces amb dades (objectes o llistes).
const NO_BASE = /(aco_obra_foto_|aco_albara_foto_|aco_albara_pdf_|aco_versio_v878266_)/;
function baseKey(k) { return `nuvol-base__${session?.user_id || ""}__${k}`; }
function mergeable(k, v) { return !NO_BASE.test(k) && typeof v === "string" && v.length < 4e6 && /^[[{]/.test(v); }
function setBase(k, v) {
  if (!session) return;
  try { if (v === undefined || !mergeable(k, v)) { if (localStorage.getItem(baseKey(k)) != null) removeRaw(baseKey(k)); } else writeRaw(baseKey(k), v); } catch {}
}
function getBase(k) { try { return localStorage.getItem(baseKey(k)); } catch { return null; } }
function clearBases() {
  const pre = `nuvol-base__${session?.user_id || ""}__`, ks = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(pre)) ks.push(k); } } catch {}
  ks.forEach(k => { try { removeRaw(k); } catch {} });
  baseChecked.clear();
}
const baseChecked = new Set();
// Intenta ajuntar la versió d'aquí amb la del núvol. Torna { value } (ajuntada), { conflicts } (cal preguntar) o null
// (no es pot: no hi ha versió comuna o s'ha esborrat). «prefer»: en el que s'ha tocat als dos llocs, quina guanya.
// Detall dels conflictes en l'idioma de l'usuari («Pressupost › 01.02 › preu»)
function detall(conflicts) { return conflictLabels(conflicts).map(l => l.split(" › ").map(s => t(s)).join(" › ")); }
// V87.303 · què és diferent entre la d'aquí i la del núvol (quan no hi ha versió comuna per saber qui ha canviat què)
function diferencies(mine, theirs) {
  try { return diffLabels(mine == null ? null : JSON.parse(mine), theirs == null ? null : JSON.parse(theirs)).map(l => l.split(" › ").map(s => t(s)).join(" › ")); } catch { return []; }
}
function diferenciesShared(loc, remote) {
  try {
    const f = diffLabels(JSON.parse(loc?.obra || "{}"), JSON.parse(remote?.obra || "{}")).map(l => "Fitxa › " + l);
    const d = diffLabels(JSON.parse(loc?.dades || "null"), JSON.parse(remote?.dades || "null"));
    const out = [...f, ...d]; if ((loc?.foto || "") !== (remote?.foto || "")) out.push("Foto de l’obra");
    return out.slice(0, 5).map(l => l.split(" › ").map(s => t(s)).join(" › "));
  } catch { return []; }
}
function tryMerge(r, local, prefer) {
  if (r.deleted || !(r.key in local)) return null;
  const b = getBase(r.key);
  if (b == null || hash(b) !== meta.known[r.key]) return null;
  try {
    const res = merge3(JSON.parse(b), JSON.parse(local[r.key]), JSON.parse(r.value ?? "null"), prefer ? { prefer } : {});
    return res.ok ? { value: JSON.stringify(res.value) } : { conflicts: res.conflicts };
  } catch { return null; }
}
function readJson(k, f) { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? f; } catch { return f; } }
function writeRaw(k, v) { applying = true; try { localStorage.setItem(k, v); } finally { applying = false; } }
function removeRaw(k) { applying = true; try { localStorage.removeItem(k); } finally { applying = false; } }
function saveMeta() { try { writeRaw(metaKey(), JSON.stringify(meta)); } catch (e) { console.warn("No es pot desar l'estat del núvol", e); } }
function fmtTime(iso) { try { return new Date(iso).toLocaleString("ca-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }
function isLocalServer() { return !!window.__acoLocalDisk; }
function makeDevice() {
  let d = "";
  try { d = localStorage.getItem(DEVICE_KEY) || ""; if (!d) { const kind = ["iPhone", "iPad", "Android", "Windows", "Macintosh", "Linux"].find(k => navigator.userAgent.includes(k)) || "Aparell"; d = `${kind}-${Math.random().toString(36).slice(2, 8)}`; localStorage.setItem(DEVICE_KEY, d); } } catch { d = "Aparell-" + Math.random().toString(36).slice(2, 8); }
  return d;
}
function hasObres(entriesObj) { return Object.keys(entriesObj).some(k => /(^|__)aco_obres$/.test(k) && String(entriesObj[k] || "").length > 10); }

// ---------- API Supabase ----------
async function api(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const h = { apikey: CLOUD_KEY, "Content-Type": "application/json", ...headers };
  if (auth) { await ensureToken(); h.Authorization = `Bearer ${session.access_token}`; }
  let r;
  try { r = await fetch(CLOUD_URL + path, { method, headers: h, body: body == null ? undefined : JSON.stringify(body), cache: "no-store" }); }
  catch { const e = new Error(t("No hi ha connexió amb el núvol.")); e.offline = true; throw e; }
  const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch {}
  if (!r.ok) { const e = new Error(j?.msg || j?.message || j?.error_description || j?.error || txt || `Error ${r.status}`); e.status = r.status; e.body = j; throw e; }
  return j;
}
// V87.303 · La sessió es desa al localStorage de debò del navegador, que totes les pestanyes veuen al moment. Abans era al
// de bigStore (IndexedDB), que cada pestanya llegeix només en obrir-se: amb l'app oberta en dues pestanyes, una renovava
// el permís (cada hora) i l'altra ho tornava a provar amb el permís vell; el núvol el rebutjava, la pestanya esborrava la
// sessió i en tornar a obrir l'app calia tornar a entrar (va passar el 19/10/2026).
// Es llegeixen tots dos llocs (el de bigStore, per a les sessions d'abans) i es queda la més nova (la renovada més tard).
const sessStore = () => window.__acoStore?.real || null;
function readSession() {
  const get = st => { try { const v = st && JSON.parse(st.getItem(SESSION_KEY) || "null"); return v && v.refresh_token ? v : null; } catch { return null; } };
  const a = get(sessStore()), b = get(localStorage);
  if (!a || !b) return a || b;
  return (b.expires_at || 0) > (a.expires_at || 0) ? b : a;
}
function writeSession(s) {
  const v = s ? JSON.stringify(s) : null;
  for (const st of [sessStore(), localStorage]) { if (!st) continue; try { if (v) st.setItem(SESSION_KEY, v); else st.removeItem(SESSION_KEY); } catch {} }
}
// Si una altra pestanya ja ha renovat el permís, es fa servir el seu (no es torna a renovar amb el vell).
function adoptNewer() {
  const s = readSession();
  if (s && session && s.user_id === session.user_id && s.refresh_token !== session.refresh_token && (s.expires_at || 0) >= (session.expires_at || 0)) session = s;
}
function setSession(j) {
  session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, email: j.user?.email || session?.email || "", user_id: j.user?.id || session?.user_id || "" };
  writeSession(session);
}
async function refreshToken() {
  adoptNewer();
  if (Date.now() < session.expires_at - 60000) return;
  const used = session.refresh_token;
  try { setSession(await api("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: used }, auth: false })); }
  catch (e) {
    if (!e.offline && e.status >= 400 && e.status < 500) {
      // potser una altra pestanya l'ha renovat just ara: si hi ha un permís més nou, es fa servir aquest
      const s = readSession();
      if (s && s.refresh_token !== used && (!session || s.user_id === session.user_id)) { session = s; return; }
      session = null; writeSession(null); e.relogin = true;
    }
    throw e;
  }
}
async function ensureToken() {
  if (!session) throw new Error(t("Cal entrar al núvol."));
  adoptNewer();
  if (Date.now() < session.expires_at - 60000) return;
  // Una sola pestanya renova alhora (les altres esperen i agafen el permís nou)
  if (navigator.locks?.request) await navigator.locks.request("aco-nuvol-sessio", () => refreshToken());
  else await refreshToken();
  if (!session) throw new Error(t("Cal entrar al núvol."));
}
async function login(email, password) {
  setSession(await api("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password }, auth: false }));
  // V87.260 · l'Héctor ha entrat amb la contrasenya del núvol: aquest aparell torna a obrir el seu espai sol
  // (treu la marca que hi posa el portal de client; mateix nom que PORTAL_LOCK_KEY878260 a App.jsx).
  if (!companyOf(session.email)) { try { localStorage.removeItem("portal-bloqueig-app-control-obres"); } catch {} }
}
// V87.262 · arxius (fotos, croquis, documents) a l'espai privat «aco-fitxers»; path = <propietari>/<obra>/<id>.
async function storageFetch(path, opts = {}) {
  await ensureToken();
  let r;
  try { r = await fetch(`${CLOUD_URL}/storage/v1/object/${path}`, { ...opts, headers: { apikey: CLOUD_KEY, Authorization: `Bearer ${session.access_token}`, ...(opts.headers || {}) }, cache: "no-store" }); }
  catch { const e = new Error(t("No hi ha connexió amb el núvol.")); e.offline = true; throw e; }
  return r;
}
async function storageUpload(path, blob, contentType) {
  const r = await storageFetch(`aco-fitxers/${path}`, { method: "POST", headers: { "Content-Type": contentType || "application/octet-stream", "x-upsert": "true" }, body: blob });
  if (!r.ok) { const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch {} const e = new Error(j?.message || j?.error || txt || `Error ${r.status}`); e.status = +(j?.statusCode || r.status); throw e; }
}
async function storageDownload(path) {
  const r = await storageFetch(`authenticated/aco-fitxers/${path}`);
  if (r.ok) return await r.blob();
  if (r.status === 400 || r.status === 404) return null; // encara no s'ha pujat
  const e = new Error(`Error ${r.status}`); e.status = r.status; throw e;
}
// V87.263 · espai ocupat al núvol (funció aco_espai de supabase/aco_espai_v87263.sql; null per als comptes d'empresa).
async function espai() { return api("/rest/v1/rpc/aco_espai", { method: "POST", body: {} }); }
// V87.260 · canviar la contrasenya del núvol del compte connectat (Héctor o empresa).
async function changePassword(password) {
  if (!session) throw new Error(t("Cal estar connectat al núvol."));
  await api("/auth/v1/user", { method: "PUT", body: { password } });
}
// V87.409.1 · Supabase compta la transferència (5 GB al mes al pla gratuït; el 27/10/2026, 11,56 GB). Amb cursor, primer
// només la llista (clau i data) i després el contingut de les peces que encara no tenim. Abans, a cada volta (cada 20 s)
// es tornava a baixar sencera la darrera peça canviada (pels 5 s de marge) i també la que s'acabava de pujar d'aquí.
// Una peça «ja» (la mateixa versió del servidor que aquest aparell coneix) només serveix per avançar el cursor.
const pgIn = list => encodeURIComponent(`(${list.map(k => `"${String(k).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")})`);
async function pullSince(cursor) {
  const out = []; let offset = 0;
  const since = cursor ? new Date(new Date(cursor).getTime() - 5000).toISOString() : "";
  const cols = since ? "key,deleted,device,updated_at" : "key,value,deleted,device,updated_at";
  for (;;) {
    const rows = await api(`/rest/v1/aco_kv?select=${cols}${since ? `&updated_at=gt.${encodeURIComponent(since)}` : ""}&order=updated_at.asc&limit=500&offset=${offset}`);
    out.push(...(rows || [])); if (!rows || rows.length < 500) break; offset += 500;
  }
  if (!since) return out;
  const ja = r => !!meta.at && meta.at[r.key] === r.updated_at && (r.updated_at <= cursor || r.device === device);
  const need = out.filter(r => !r.deleted && !ja(r)).map(r => r.key);
  const vals = new Map();
  for (let i = 0; i < need.length; i += 40) {
    const rows = await api(`/rest/v1/aco_kv?select=key,value,deleted,device,updated_at&key=in.${pgIn(need.slice(i, i + 40))}`);
    (rows || []).forEach(r => vals.set(r.key, r));
  }
  return out.map(r => (r.deleted ? r : ja(r) ? { ...r, ja: true } : vals.get(r.key) || { ...r, ja: true }));
}
// V87.266 · Edició alhora. Pujada amb comprovació de versió: una peça que ja és al núvol només es desa si
// encara hi ha la versió que aquest aparell coneixia (meta.at = data del servidor de cada peça). Si algú
// l'ha canviada mentrestant, no es trepitja: es torna com a «canvi alhora» perquè l'usuari triï.
// «force»: s'ha decidit expressament (primera connexió, restauració): es desa sense comprovar.
async function pushRows(rows, { force = false } = {}) {
  meta.at ||= {};
  const clash = [], plain = [];
  for (const r of rows) {
    const at = meta.at[r.key];
    if (force || !at) { plain.push(r); continue; }
    const body = { value: r.deleted ? null : r.value, deleted: !!r.deleted, device };
    const patch = when => api(`/rest/v1/aco_kv?user_id=eq.${session.user_id}&key=eq.${encodeURIComponent(r.key)}&updated_at=eq.${encodeURIComponent(when)}&select=key,updated_at`, { method: "PATCH", headers: { Prefer: "return=representation" }, body });
    let res = await patch(at);
    if (!(Array.isArray(res) && res.length)) {
      const cur = (await api(`/rest/v1/aco_kv?select=key,value,deleted,device,updated_at&user_id=eq.${session.user_id}&key=eq.${encodeURIComponent(r.key)}`))?.[0];
      if (!cur) { plain.push(r); continue; } // ja no hi és: es torna a crear
      // Al núvol hi ha el que coneixíem (només no quadrava la data): es torna a provar amb la data bona.
      const same = cur.deleted ? !(r.key in meta.known) : meta.known[r.key] === hash(cur.value ?? "");
      if (same) res = await patch(cur.updated_at);
      if (!(Array.isArray(res) && res.length)) { clash.push({ key: r.key, theirs: cur }); continue; }
    }
    meta.at[r.key] = res[0].updated_at;
  }
  let batch = [], size = 0;
  const flush = async () => {
    if (!batch.length) return;
    const res = await api("/rest/v1/aco_kv?on_conflict=user_id,key&select=key,updated_at", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: batch });
    (Array.isArray(res) ? res : []).forEach(x => { meta.at[x.key] = x.updated_at; });
    batch = []; size = 0;
  };
  for (const r of plain) {
    const s = String(r.value || "").length;
    if (batch.length && size + s > 1500000) await flush();
    batch.push({ user_id: session.user_id, key: r.key, value: r.deleted ? null : r.value, deleted: !!r.deleted, device });
    size += s;
  }
  await flush();
  return clash;
}
// Data del servidor de cada peça (per a la comprovació de versió). Es carrega una vegada (o després d'una
// primera connexió o una restauració) i després es manté sola amb el que es baixa i es puja.
async function loadAt() {
  const at = {};
  for (let offset = 0; ; offset += 1000) {
    const rows = await api(`/rest/v1/aco_kv?select=key,updated_at&order=key.asc&limit=1000&offset=${offset}`);
    (rows || []).forEach(r => { at[r.key] = r.updated_at; });
    if (!rows || rows.length < 1000) break;
  }
  meta.at = at;
}

// ---------- V87.266 · canvis alhora: avís, tria i versions guardades ----------
const VERSIO_PREFIX = "aco_versio_v878266_";
let carry = new Map(); // canvis alhora pendents de preguntar (es dictava o hi havia una finestra oberta)
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function pieceLabel(key) {
  const [, id] = splitKey(key);
  if (id !== null) { const o = readArr(kObres(), []).find(x => x?.id === id); return t("Obra «{nom}»", { nom: o?.nom || id }); }
  const k = key.replace(/^aco_v8782__.+?__/, "");
  const names = { aco_obres: t("Llista d’expedients"), aco_clients: t("Clients"), aco_agenda_v86: t("Agenda") };
  return names[k] || t("Altres dades ({nom})", { nom: k.replace(/^aco_/, "").replace(/_v\d+$/, "") });
}
// Qui ha fet un canvi: l'aparell (ordinador, iPhone…) o, a les obres compartides, el compte.
const KIND = { Windows: "ordinador Windows", Macintosh: "Mac o iPad", Linux: "ordinador Linux", iPhone: "iPhone", iPad: "iPad", Android: "Android" }; // es tradueix en mostrar-ho
function devLabel(dev) {
  if (!dev) return t("Un altre aparell");
  // V87.303 · si és el mateix compte, es diu (l'Héctor no entenia qui havia canviat Verbania: era ell, des d'un altre lloc)
  if (String(dev).includes("@") && session?.email && String(dev).toLowerCase() === String(session.email).toLowerCase()) return t("Tu mateix, des d’un altre aparell o pestanya");
  if (String(dev).includes("@")) return t("Usuari {nom}", { nom: companyOf(dev)?.username || dev });
  const k = KIND[String(dev).split("-")[0]];
  return k ? t("Aparell ({nom})", { nom: t(k) }) : t("Un altre aparell");
}
function whoLabel(dev) { return dev === device ? t("Aquest aparell") : devLabel(dev); }
function askConflict(items) {
  hold(true);
  return new Promise(resolve => {
    const el = overlay(`
      <h1>${t("Canvis alhora")}</h1>
      <p>${items.some(i => i.det) ? t("Mentre treballaves aquí, s’ha canviat el mateix des d’un altre lloc:") : t("Aquest aparell i el núvol tenen dues versions diferents de:")}</p>
      <ul class="conflict-list-v878266">${items.map(i => `<li><b>${esc(i.label)}</b><span>${esc(t("Al núvol: {qui}", { qui: i.who }))}${i.when ? " · " + esc(fmtTime(i.when)) : ""}</span>${i.det ? `<small>${esc(t("Tots dos heu canviat:"))} ${esc(i.det.join(" · "))}</small>` : i.dif?.length ? `<small>${esc(t("Què és diferent:"))} ${esc(i.dif.join(" · "))}</small>` : ""}</li>`).join("")}</ul>
      <p>${items.some(i => i.det) ? t("La resta de canvis ja s’han ajuntat. Per al que heu canviat tots dos, tria quina versió es queda. <b>L’altra no es perd</b>: es guarda a Configuració → «Versions guardades».") : t("Tria quina versió es queda. <b>L’altra no es perd</b>: es guarda a Configuració → «Versions guardades» i la pots recuperar quan vulguis.")}</p>
      <div class="choices">
        <button type="button" data-v="meva"><b>${t("Quedar-me la meva")}</b><span>${items.some(i => i.det) ? t("Per al que heu canviat tots dos, el d’aquest aparell.") : t("La que tens en aquest aparell.")}</span></button>
        <button type="button" data-v="altre"><b>${t("Quedar-me la de l’altre")}</b><span>${items.some(i => i.det) ? t("Per al que heu canviat tots dos, el de l’altre (el que ja és al núvol).") : t("La que ja és al núvol.")}</span></button>
      </div>`);
    el.classList.add("conflict-v878266");
    el.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => { el.remove(); hold(false); resolve(b.dataset.v); }));
  });
}
function versionPrefix() { return `aco_v8782__${ownNs()}__${VERSIO_PREFIX}`; }
function listVersions() {
  const pre = versionPrefix(), out = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(pre)) { try { const v = JSON.parse(localStorage.getItem(k)); if (v?.id) out.push(v); } catch {} } }
  return out.sort((a, b) => String(b.data).localeCompare(String(a.data)));
}
// Cada versió és una peça pròpia (es puja una sola vegada i no topa amb cap altra). Es guarden les 50 últimes
// dels últims 90 dies.
function saveVersion(v) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const item = { ...v, id, data: new Date().toISOString(), etiqueta: v.etiqueta || pieceLabel(v.peca) };
  try { writeRaw(versionPrefix() + id, JSON.stringify(item)); } catch (e) { console.warn("No s'ha pogut guardar la versió", e); }
  const old = Date.now() - 90 * 864e5;
  listVersions().filter((x, i) => i >= 50 || Date.parse(x.data) < old).forEach(x => removeRaw(versionPrefix() + x.id));
  schedule(2000);
}
// V87.266 · Abans de preguntar: si la diferència només són les dates que l'app posa sola, es decideix sense preguntar.
//  - el mateix contingut als dos llocs, o aquí només s'ha obert l'obra → la del núvol («theirs»)
//  - allà només s'ha obert (el contingut del núvol és el que ja coneixíem) → la d'aquí («mine»)
//  - feina de debò als dos llocs → es pregunta («ask»)
function triage(rows, local) {
  const ask = [], theirs = [], mine = [];
  for (const r of rows) {
    const cm = contentHash(local[r.key]), ct = r.deleted ? "" : contentHash(r.value ?? ""), base = meta.kc?.[r.key];
    if (cm === ct || (base !== undefined && cm === base)) theirs.push(r);
    else if (base !== undefined && ct === base) mine.push(r);
    else ask.push(r);
  }
  return { ask, theirs, mine };
}
// «La meva» sense preguntar: la del núvol es dona per vista i la d'aquí es puja damunt (amb comprovació de versió).
function keepMine(r) { meta.at[r.key] = r.updated_at; know(r.key, r.deleted ? undefined : (r.value ?? "")); }
// Pregunta quina versió es queda; la que no es tria es guarda.
// «meva»: la del núvol es dona per vista (meta.known/at) i la d'aquí es puja damunt (amb comprovació de versió).
// «altre»: torna les files del núvol que s'han d'aplicar.
// V87.293 · «items»: [{ r, conflicts }]. Si la peça es pot ajuntar (hi ha conflictes concrets), es pregunta només per
// això i la resta de canvis de tots dos es queda («merged»: clau → valor ajuntat, que s'aplica i després es puja).
async function resolveConflicts(items, local) {
  items = items.map(x => (x && x.r ? x : { r: x, conflicts: null }));
  const choice = await askConflict(items.map(({ r, conflicts }) => ({ label: pieceLabel(r.key), who: whoLabel(r.device), when: r.updated_at, det: conflicts ? detall(conflicts) : null, dif: conflicts ? null : diferencies(local[r.key], r.deleted ? null : (r.value ?? null)) })));
  const mine = [], theirs = [], merged = new Map();
  for (const { r, conflicts } of items) {
    if (conflicts) {
      const mg = tryMerge(r, local, choice === "meva" ? "mine" : "theirs");
      if (mg?.value !== undefined) {
        saveVersion(choice === "meva"
          ? { peca: r.key, tipus: "dades", quina: "la de l’altre", origen: whoLabel(r.device), valor: r.deleted ? null : (r.value ?? "") }
          : { peca: r.key, tipus: "dades", quina: "la meva", origen: devLabel(device), valor: local[r.key] ?? null });
        merged.set(r.key, mg.value);
        continue;
      }
    }
    if (choice === "meva") {
      saveVersion({ peca: r.key, tipus: "dades", quina: "la de l’altre", origen: whoLabel(r.device), valor: r.deleted ? null : (r.value ?? "") });
      meta.at[r.key] = r.updated_at;
      know(r.key, r.deleted ? undefined : (r.value ?? ""));
      mine.push(r.key);
    } else {
      saveVersion({ peca: r.key, tipus: "dades", quina: "la meva", origen: devLabel(device), valor: local[r.key] ?? null });
      theirs.push(r);
    }
  }
  return { mine, theirs, merged };
}
function writePiece(key, value) {
  const [base, id] = splitKey(key);
  if (id !== null) {
    let o = {}; try { o = JSON.parse(localStorage.getItem(base) || "{}") || {}; } catch {}
    if (value == null) delete o[id]; else { try { o[id] = JSON.parse(value); } catch {} }
    localStorage.setItem(base, JSON.stringify(o));
  } else if (value == null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}
// Recuperar una versió guardada: la d'ara també es guarda abans (així tampoc es perd).
async function restoreVersion(id) {
  const v = listVersions().find(x => x.id === id); if (!v) throw new Error(t("No trobo aquesta versió."));
  const { id: _id, data: _data, ...rest } = v;
  if (v.tipus === "compartida") {
    const loc = localShare(v.peca);
    if (loc) saveVersion({ ...rest, quina: "la d’abans de recuperar", origen: devLabel(device), valor: loc });
    applyShared({ obra_id: v.peca, ...v.valor, owner: v.owner, owner_email: v.ownerEmail, owner_nom: v.ownerNom }, !!v.owned, true);
  } else {
    const local = entries();
    if (v.peca in local) saveVersion({ peca: v.peca, tipus: "dades", quina: "la d’abans de recuperar", origen: devLabel(device), valor: local[v.peca] });
    writePiece(v.peca, v.valor);
  }
  await reloadSafely();
}

// ---------- dades locals ----------
function entries() {
  const out = {};
  // V87.259 · les obres que m'han compartit altres comptes viuen a la taula aco_shared,
  // no al meu espai: no es pugen ni es compten aquí.
  const foreign = foreignIds();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !APP_KEY.test(k) || EXCLUDE.test(k) || !inScope(k)) continue;
    let v = localStorage.getItem(k);
    if (foreign.size && OBRES_RE.test(k)) { try { const a = JSON.parse(v); if (Array.isArray(a) && a.some(o => foreign.has(o?.id))) v = JSON.stringify(a.filter(o => !foreign.has(o?.id))); } catch {} }
    if (foreign.size && FOTO_RE.test(k) && foreign.has(k.replace(FOTO_RE, "$1"))) continue;
    if (SPLIT.test(k)) {
      let o = null; try { o = JSON.parse(v); } catch {}
      if (o && typeof o === "object" && !Array.isArray(o)) { for (const id of Object.keys(o)) { if (!foreign.has(id)) out[`${k}#${id}`] = JSON.stringify(o[id]); } continue; }
    }
    out[k] = v;
  }
  return out;
}
const OBRES_RE = /__aco_obres$/, FOTO_RE = /^.*__aco_obra_foto_v878259_(.+)$/;
function foreignIds() {
  const ids = new Set();
  try { const a = JSON.parse(localStorage.getItem(kObres()) || "[]"); if (Array.isArray(a)) a.forEach(o => { if (o?.compartida && o.compartida.owner !== session?.user_id) ids.add(o.id); }); } catch {}
  return ids;
}
// Quan arriba del núvol la llista d'obres pròpia, es conserven les compartides per altres.
function keepForeign(key, val) {
  if (!OBRES_RE.test(key) || val == null) return val;
  try {
    const cur = JSON.parse(localStorage.getItem(key) || "[]"), inc = JSON.parse(val);
    if (!Array.isArray(cur) || !Array.isArray(inc)) return val;
    const extra = cur.filter(o => o?.compartida && o.compartida.owner !== session?.user_id && !inc.some(x => x?.id === o.id));
    return extra.length ? JSON.stringify([...inc, ...extra]) : val;
  } catch { return val; }
}
function splitKey(key) { const i = key.indexOf("#"); if (i > 0 && SPLIT.test(key.slice(0, i))) return [key.slice(0, i), key.slice(i + 1)]; return [key, null]; }
function pendingKeys(local) {
  const out = [];
  for (const k in local) if (meta.known[k] !== hash(local[k])) out.push(k);
  for (const k in meta.known) if (!(k in local)) out.push(k);
  return out;
}
// Aplica files del núvol al navegador. «skip»: claus amb canvis locals que guanyen.
function applyRows(rows, skip = new Set()) {
  const local = entries(); let n = 0; const patches = {};
  meta.at ||= {};
  for (const r of rows) {
    if (skip.has(r.key)) continue;
    const theirs = r.deleted ? undefined : (r.value ?? "");
    const val = r.merged !== undefined ? r.merged : theirs;
    const cur = local[r.key];
    if (r.updated_at) meta.at[r.key] = r.updated_at;
    if (r.merged !== undefined && r.merged !== theirs) again = true; // V87.293 · l'ajuntada es puja al cicle següent
    if (val === cur) { know(r.key, theirs); continue; }
    const [base, id] = splitKey(r.key);
    if (id !== null) (patches[base] ??= {})[id] = val;
    else if (val === undefined) removeRaw(r.key);
    else { try { writeRaw(r.key, keepForeign(r.key, val)); } catch (e) { console.warn("Núvol: no hi cap", r.key, e); continue; } }
    know(r.key, theirs);
    n++;
  }
  for (const base in patches) {
    let o = {}; try { o = JSON.parse(localStorage.getItem(base) || "{}") || {}; } catch {}
    for (const id in patches[base]) { const v = patches[base][id]; if (v === undefined) delete o[id]; else { try { o[id] = JSON.parse(v); } catch {} } }
    try { writeRaw(base, JSON.stringify(o)); } catch (e) { console.warn("Núvol: no hi cap", base, e); }
  }
  return n;
}
// Deixa l'aparell igual que el núvol. Primer s'esborren les dades d'aquí (així hi ha
// lloc per a les noves, encara que les velles ocupessin molt) i després s'escriuen.
function replaceWithCloud(live) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && APP_KEY.test(k) && !EXCLUDE.test(k) && inScope(k)) keys.push(k); }
  keys.forEach(k => { try { removeRaw(k); } catch {} });
  const plain = {}, split = {};
  for (const r of live) {
    const [base, id] = splitKey(r.key);
    if (id !== null) { split[base] ??= {}; try { split[base][id] = JSON.parse(r.value); } catch {} }
    else plain[r.key] = r.value ?? "";
  }
  for (const base in split) plain[base] = JSON.stringify(split[base]);
  const failed = [];
  Object.entries(plain).sort((a, b) => a[1].length - b[1].length).forEach(([k, v]) => { try { writeRaw(k, v); } catch { failed.push(k); } });
  const known = {};
  live.forEach(r => { known[r.key] = hash(r.value ?? ""); });
  if (failed.length) { const e = new Error(`Aquest aparell no té prou espai per a les dades del núvol (${failed.length} parts).`); e.space = true; throw e; }
  return known;
}
function countObres(rowsOrEntries) {
  const list = Array.isArray(rowsOrEntries) ? rowsOrEntries : Object.entries(rowsOrEntries).map(([key, value]) => ({ key, value }));
  const r = list.find(x => /__hector__aco_obres$/.test(x.key)) || list.find(x => /(^|__)aco_obres$/.test(x.key));
  try { return JSON.parse(r.value).length; } catch { return 0; }
}
function maxTime(rows, cur) { return rows.reduce((m, r) => (r.updated_at && r.updated_at > m ? r.updated_at : m), cur || ""); }

// ---------- rètol ----------
function paint(state, text) {
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "cloud-badge-v878257"; badge.setAttribute("role", "status");
    badge.addEventListener("click", () => { if (badge.dataset.state === "remote") applyWaitingAndReload(); else if (badge.dataset.state === "login") connect(); else syncNow(); });
    document.body.appendChild(badge);
  }
  badge.dataset.state = state;
  badge.classList.toggle("over-local", !!document.querySelector(".local-save-badge-v878252"));
  badge.textContent = text || (state === "busy" ? t("Núvol · sincronitzant…")
    : state === "offline" ? t("Núvol · sense connexió (es pujarà després)")
    : state === "error" ? t("Núvol · error (clica per tornar-ho a provar)")
    : state === "remote" ? t("Canvis d’un altre aparell · Actualitzar")
    : state === "login" ? t("Núvol · cal tornar a entrar")
    : t("Núvol · al dia {quan}", { quan: fmtTime(lastOk) }));
  // V87.268 · al mòbil i l'iPad el rètol és un punt petit a la capçalera amb una paraula
  badge.dataset.short = state === "busy" ? "…" : state === "offline" ? t("Sense connexió") : state === "error" ? t("Error") : state === "remote" ? t("Actualitzar") : state === "login" ? t("Entrar") : "";
  badge.setAttribute("aria-label", badge.textContent);
  badge.title = lastErr || (session ? t("Connectat com {correu}", { correu: session.email }) : "");
}

// ---------- finestres d'inici ----------
function overlay(html) {
  const el = document.createElement("div");
  el.className = "cloud-overlay-v878257";
  el.innerHTML = `<div class="box">${html}</div>`;
  document.body.appendChild(el);
  return el;
}
function askLogin({ allowSkip = true, message = "" } = {}) {
  return new Promise(resolve => {
    const el = overlay(`
      <div class="logo">CO</div>
      <h1>${t("Entra al núvol")}</h1>
      <p>${t("Amb el teu compte veuràs les mateixes dades a l’ordinador, al mòbil i a la tauleta.")}</p>
      <form>
        <label><span>${t("Usuari o correu")}</span><input name="email" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></label>
        <label><span>${t("Contrasenya")}</span><input name="password" type="password" autocomplete="current-password" required></label>
        <p class="err" role="alert">${message}</p>
        <button class="primary" type="submit">${t("Entrar")}</button>
        ${allowSkip ? `<button class="link" type="button" data-skip>${isLocalServer() ? t("Ara no · treballar només en aquest ordinador") : t("Ara no · treballar sense núvol en aquest aparell")}</button>` : ""}
      </form>`);
    const form = el.querySelector("form"), err = el.querySelector(".err"), btn = el.querySelector("button.primary");
    const email = form.elements.email; email.value = localStorage.getItem("nuvol-aco-correu") || ""; (email.value ? form.elements.password : email).focus();
    form.addEventListener("submit", async e => {
      e.preventDefault(); err.textContent = ""; btn.disabled = true; btn.textContent = t("Entrant…");
      try {
        await login(toEmail(form.elements.email.value), form.elements.password.value);
        try { localStorage.setItem("nuvol-aco-correu", form.elements.email.value.trim()); } catch {}
        el.remove(); resolve("ok");
      } catch (x) {
        err.textContent = x.offline ? t("No hi ha connexió amb el núvol. Revisa Internet i torna-ho a provar.")
          : /invalid login|invalid_grant|credentials/i.test(x.message) ? t("Usuari o contrasenya incorrectes.")
          : /not confirmed/i.test(x.message) ? t("Aquest correu encara no està confirmat a Supabase.")
          : x.message;
        btn.disabled = false; btn.textContent = t("Entrar");
      }
    });
    el.querySelector("[data-skip]")?.addEventListener("click", () => { el.remove(); resolve("skip"); });
  });
}
function askChoice({ cloudWhen, cloudDevice, localObres, cloudObres }) {
  return new Promise(resolve => {
    const el = overlay(`
      <h1>${t("Ja hi ha dades al núvol")}</h1>
      <p>${t("Al núvol hi ha <b>{n} expedients</b>, desats el {quan}. En aquest aparell n’hi ha <b>{m}</b>. Quines dades vols fer servir?", { n: cloudObres, quan: fmtTime(cloudWhen), m: localObres })}</p>
      <div class="choices">
        <button type="button" data-v="cloud"><b>${t("Les del núvol ({n} expedients)", { n: cloudObres })}</b><span>${t("Aquest aparell es posa igual que el núvol. És el normal al mòbil, a la tauleta o a qualsevol aparell nou.")}</span></button>
        <button type="button" data-v="local"><b>${t("Les d’aquest aparell ({n} expedients)", { n: localObres })}</b><span>${t("Esborra el que hi ha al núvol i hi posa les dades d’aquí. Només si saps que aquestes són les bones.")}</span></button>
      </div>
      <div class="confirm" hidden>
        <p>${t("<b>Segur?</b> Les {n} obres del núvol se substituiran per les {m} d’aquest aparell, també als altres aparells.", { n: cloudObres, m: localObres })}</p>
        <div class="choices"><button type="button" data-ok><b>${t("Sí, substituir el núvol")}</b></button><button type="button" data-back><b>${t("No, tornar enrere")}</b></button></div>
      </div>`);
    const first = el.querySelector(".choices"), confirm = el.querySelector(".confirm");
    el.querySelector("[data-v=cloud]").addEventListener("click", () => { el.remove(); resolve("cloud"); });
    el.querySelector("[data-v=local]").addEventListener("click", () => { first.hidden = true; confirm.hidden = false; });
    el.querySelector("[data-back]").addEventListener("click", () => { first.hidden = false; confirm.hidden = true; });
    el.querySelector("[data-ok]").addEventListener("click", () => { el.remove(); resolve("local"); });
  });
}

// ---------- sincronització ----------
async function firstSync() {
  const rows = await pullSince("");
  const live = rows.filter(r => !r.deleted);
  const local = entries();
  // L'estat del núvol només es desa si TOT acaba bé; si falla a mig camí, aquest
  // aparell no puja res i la pregunta tornarà a sortir la propera vegada.
  const m = { userId: session.user_id, cursor: maxTime(rows, ""), known: {} };
  const cloudObres = live.some(r => /(^|__)aco_obres$/.test(r.key) && String(r.value || "").length > 10);
  if (!cloudObres) {
    await pushRows(Object.keys(local).map(k => ({ key: k, value: local[k] })), { force: true });
    for (const k in local) m.known[k] = hash(local[k]);
  } else if (!hasObres(local)) {
    m.known = replaceWithCloud(live);
  } else {
    const last = live.reduce((m, r) => (r.updated_at > (m?.updated_at || "") ? r : m), null);
    const choice = await askChoice({ cloudWhen: last?.updated_at, cloudDevice: last?.device, localObres: countObres(local), cloudObres: countObres(live) });
    if (choice === "cloud") {
      m.known = replaceWithCloud(live);
    } else {
      const localKeys = new Set(Object.keys(local));
      await pushRows([...Object.keys(local).map(k => ({ key: k, value: local[k] })), ...live.filter(r => !localKeys.has(r.key)).map(r => ({ key: r.key, deleted: true }))], { force: true });
      for (const k in local) m.known[k] = hash(local[k]);
    }
  }
  clearBases();
  meta = m;
  saveMeta();
}
// ---------- V87.259 · obres compartides (taula aco_shared) ----------
function ownNs() { const c = companyOf(session?.email); return c ? c.internal : "hector"; }
function kObres() { return `aco_v8782__${ownNs()}__aco_obres`; }
function kOdata() { return `aco_v8782__${ownNs()}__aco_odata`; }
function kFoto(id) { return `aco_v8782__${ownNs()}__aco_obra_foto_v878259_${id}`; }
function sharedMetaKey() { return `nuvol-aco-compartits__${session?.user_id || ""}`; }
function readArr(k, f) { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? f; } catch { return f; } }
function stripShareMeta(o) { const { compartida, imatge, ...rest } = o || {}; return rest; }
function localShare(id) {
  const o = readArr(kObres(), []).find(x => x?.id === id); if (!o) return null;
  const d = readArr(kOdata(), {})[id];
  const obra = stripShareMeta(o);
  if (!o.compartida) { const c = readArr(`aco_v8782__${ownNs()}__aco_clients`, []).find(x => String(x?.id) === String(o.client)); if (c) obra.clientNomCompartit = c.nom || c.rao || ""; }
  return { obra: JSON.stringify(obra), dades: JSON.stringify(d ?? null), foto: localStorage.getItem(kFoto(id)) || "" };
}
function shHash(x) { return hash((x?.obra || "") + "\u0001" + (x?.dades || "") + "\u0001" + (x?.foto || "")); }
// V87.266 · contingut d'una obra compartida sense les dates que l'app posa sola en obrir-la
function shContent(x) { return contentHash(x?.obra || "") + "\u0001" + contentHash(x?.dades || "") + "\u0001" + hash(x?.foto || ""); }
// V87.293 · Versió comuna d'una obra compartida (fitxa i dades; de la foto només l'empremta), per ajuntar canvis fets
// alhora des de dos comptes. És de l'aparell: «nuvol-base-sh__<usuari>__<obra>».
const shBaseH = new Map();
function shBaseKey(id) { return `nuvol-base-sh__${session?.user_id || ""}__${id}`; }
function setShBase(id, x, h) {
  if (shBaseH.get(id) === h) return;
  try { writeRaw(shBaseKey(id), JSON.stringify({ h, obra: x?.obra || "", dades: x?.dades || "", fotoH: hash(x?.foto || "") })); shBaseH.set(id, h); } catch {}
}
function dropShBase(id) { shBaseH.delete(id); try { removeRaw(shBaseKey(id)); } catch {} }
// Torna { value:{obra,dades,foto} } (ajuntada), { conflicts } (cal preguntar) o null (no es pot)
function tryMergeShared(id, loc, remote, known, prefer) {
  let b = null; try { b = JSON.parse(localStorage.getItem(shBaseKey(id)) || "null"); } catch {}
  if (!b || b.h !== known) return null;
  try {
    const opt = prefer ? { prefer } : {};
    const ro = merge3(JSON.parse(b.obra || "{}"), JSON.parse(loc.obra || "{}"), JSON.parse(remote.obra || "{}"), opt);
    const rd = merge3(JSON.parse(b.dades || "null"), JSON.parse(loc.dades || "null"), JSON.parse(remote.dades || "null"), opt);
    const conflicts = [...ro.conflicts.map(c => ({ ...c, label: "Fitxa › " + c.label })), ...rd.conflicts];
    let foto = loc.foto;
    if (loc.foto !== remote.foto) {
      if (hash(loc.foto || "") === b.fotoH) foto = remote.foto;
      else if (hash(remote.foto || "") !== b.fotoH) { conflicts.push({ path: ["foto"], label: "Foto de l’obra" }); if (prefer === "theirs") foto = remote.foto; }
    }
    if (conflicts.length && !prefer) return { conflicts };
    return { value: { obra: JSON.stringify(ro.value), dades: JSON.stringify(rd.value), foto } };
  } catch { return null; }
}
function ownerNom() { const e = readArr(`aco_v8782__${ownNs()}__aco_empresa_v878259`, null); return e?.nom || companyOf(session?.email)?.username || "Héctor Cubero"; }
function applyShared(r, owned, editor) {
  let o = {}; try { o = JSON.parse(r.obra || "{}") || {}; } catch {}
  if (!owned) o.compartida = { owner: r.owner, ownerEmail: r.owner_email || "", ownerNom: r.owner_nom || "", ownerUsuari: companyOf(r.owner_email)?.username || r.owner_email || "", perm: editor ? "edicio" : "consulta" };
  const list = readArr(kObres(), []); const prev = list.find(x => x?.id === r.obra_id);
  if (owned && prev) { delete o.compartida; delete o.clientNomCompartit; }
  writeRaw(kObres(), JSON.stringify(prev ? list.map(x => x?.id === r.obra_id ? o : x) : [...list, o]));
  const od = readArr(kOdata(), {}); let d = null; try { d = JSON.parse(r.dades || "null"); } catch {}
  if (d == null) delete od[r.obra_id]; else od[r.obra_id] = d;
  writeRaw(kOdata(), JSON.stringify(od));
  if (r.foto) writeRaw(kFoto(r.obra_id), r.foto); else removeRaw(kFoto(r.obra_id));
}
function removeForeign(ids) {
  const set = new Set(ids);
  writeRaw(kObres(), JSON.stringify(readArr(kObres(), []).filter(o => !set.has(o?.id))));
  const od = readArr(kOdata(), {}); ids.forEach(id => { delete od[id]; removeRaw(kFoto(id)); }); writeRaw(kOdata(), JSON.stringify(od));
}
let sharedOwned = new Set(), sharedTableMissing = false;
// V87.409.1 · obres compartides ja baixades en aquesta sessió (obra_id → fila sencera): una obra que espera (es pot aplicar
// més tard) no es torna a baixar a cada volta.
const shCache = new Map();
const SH_LLISTA = "obra_id,owner,owner_email,owner_nom,lectors,editors,updated_at,updated_by";
async function sharedCycle(canApply) {
  if (sharedTableMissing) return { applied: 0, waiting: false };
  let rows;
  // V87.409.1 · primer només la llista (sense l'obra, les dades ni la foto). Abans es baixaven totes senceres a cada volta
  // (cada 20 s, a cada aparell obert): amb les 12 obres compartides, 3,8 MB cada vegada.
  try { rows = await api(`/rest/v1/aco_shared?select=${SH_LLISTA}`); }
  catch (e) { if (e.status === 404 || /aco_shared/.test(e.message)) { sharedTableMissing = true; return { applied: 0, waiting: false }; } throw e; }
  const me = session.user_id, email = session.email;
  const sm = readArr(sharedMetaKey(), null) || { known: {} };
  sm.kc ||= {}; sm.at ||= {};
  // «at»: la data del núvol de la versió coneguda (sm.known). Si al núvol hi ha la mateixa data, l'obra no ha canviat.
  const knowSh = (id, x, h, at) => { sm.known[id] = h; sm.kc[id] = shContent(x); setShBase(id, x, h); if (at) sm.at[id] = at; else delete sm.at[id]; };
  const conegut = r => r.obra_id in sm.known && sm.at[r.obra_id] === r.updated_at;
  const need = rows.filter(r => !(conegut(r) && localShare(r.obra_id)) && shCache.get(r.obra_id)?.updated_at !== r.updated_at).map(r => r.obra_id);
  for (let i = 0; i < need.length; i += 10) {
    const full = await api(`/rest/v1/aco_shared?select=*&obra_id=in.${pgIn(need.slice(i, i + 10))}`);
    (full || []).forEach(x => shCache.set(x.obra_id, x));
  }
  // la que s'ha canviat aquí puja damunt de la del núvol (només si encara hi ha la versió que s'acaba de llegir)
  const pujaMeva = async (r, loc, lh) => {
    const res = await api(`/rest/v1/aco_shared?obra_id=eq.${encodeURIComponent(r.obra_id)}&updated_at=eq.${encodeURIComponent(r.updated_at)}&select=obra_id,updated_at`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: { ...loc, updated_by: email } });
    if (Array.isArray(res) && res.length) { knowSh(r.obra_id, loc, lh, res[0].updated_at); if (shCache.has(r.obra_id)) shCache.set(r.obra_id, { ...shCache.get(r.obra_id), ...loc, updated_at: res[0].updated_at }); }
    else again = true;
  };
  // V87.293 · desa al núvol l'obra ajuntada (només si encara hi ha la versió que s'acaba de llegir)
  const pujaAjuntada = async (r, owned, editor, remote, rh, v) => {
    applyShared({ ...r, obra: v.obra, dades: v.dades, foto: v.foto }, owned, editor);
    knowSh(r.obra_id, remote, rh, r.updated_at);
    const res = await api(`/rest/v1/aco_shared?obra_id=eq.${encodeURIComponent(r.obra_id)}&updated_at=eq.${encodeURIComponent(r.updated_at)}&select=obra_id,updated_at`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: { ...v, updated_by: email } });
    if (Array.isArray(res) && res.length) knowSh(r.obra_id, v, shHash(v), res[0].updated_at); else again = true;
  };
  let applied = 0, waiting = false;
  sharedOwned = new Set(rows.filter(r => r.owner === me).map(r => r.obra_id));
  for (const r0 of rows) {
    const owned = r0.owner === me, editor = owned || (r0.editors || []).includes(email);
    const loc = localShare(r0.obra_id), lh = loc ? shHash(loc) : "";
    const known = sm.known[r0.obra_id];
    const c = shCache.get(r0.obra_id), r = c && c.updated_at === r0.updated_at ? { ...c, ...r0 } : null;
    if (!r) {
      // al núvol hi ha la versió que ja coneixem: només cal pujar el que s'hagi canviat aquí
      if (conegut(r0) && loc && lh !== known && editor) await pujaMeva(r0, loc, lh);
      continue;
    }
    const remote = { obra: r.obra || "", dades: r.dades || "", foto: r.foto || "" }, rh = shHash(remote);
    if (lh === rh) { knowSh(r.obra_id, remote, rh, r.updated_at); continue; }
    if (!(r.obra_id in sm.kc)) { if (loc && lh === known) sm.kc[r.obra_id] = shContent(loc); else if (rh === known) sm.kc[r.obra_id] = shContent(remote); }
    let remoteChanged = rh !== known;
    let localChanged = !!loc && lh !== known;
    if (remoteChanged && localChanged) {
      // Si la diferència només són dates d'obrir l'obra, es decideix sense preguntar (com a la resta de dades).
      const cm = shContent(loc), ct = shContent(remote), base = sm.kc[r.obra_id];
      if (cm === ct || (base !== undefined && cm === base)) localChanged = false;
      else if (base !== undefined && ct === base) { knowSh(r.obra_id, remote, rh, r.updated_at); remoteChanged = false; }
    }
    // V87.266 · l'obra s'ha canviat aquí i també des d'un altre compte: es pregunta (abans guanyava el núvol)
    if (remoteChanged && localChanged) {
      const nom = (() => { try { return JSON.parse(r.obra || "{}").nom || r.obra_id; } catch { return r.obra_id; } })();
      const who = r.updated_by ? whoLabel(r.updated_by) : "Un altre compte";
      const version = (valor, quina, origen) => ({ peca: r.obra_id, tipus: "compartida", quina, origen, valor, owner: r.owner, ownerEmail: r.owner_email || "", ownerNom: r.owner_nom || "", owned, etiqueta: `Obra compartida «${nom}»` });
      if (!editor) {
        // Només consulta: el canvi d'aquí no es pot desar al núvol, però tampoc es perd (es guarda com a versió).
        if (!canApply) { waiting = true; continue; }
        saveVersion(version(loc, "la meva (sense permís per desar-la)", devLabel(device)));
        applyShared(r, owned, editor); knowSh(r.obra_id, remote, rh, r.updated_at); applied++;
        continue;
      }
      if (holds) { waiting = true; continue; }
      // V87.293 · primer s'intenta ajuntar: canvis en apartats o elements diferents no pregunten
      const mg = tryMergeShared(r.obra_id, loc, remote, known);
      if (mg?.value) {
        if (!canApply) { waiting = true; continue; }
        await pujaAjuntada(r, owned, editor, remote, rh, mg.value); applied++;
        continue;
      }
      const choice = await askConflict([{ label: `Obra compartida «${nom}»`, who, when: r.updated_at, det: mg?.conflicts ? detall(mg.conflicts) : null, dif: mg?.conflicts ? null : diferenciesShared(loc, remote) }]);
      if (mg?.conflicts) {
        const mp = tryMergeShared(r.obra_id, loc, remote, known, choice === "meva" ? "mine" : "theirs");
        if (mp?.value) {
          saveVersion(choice === "meva" ? version(remote, "la de l’altre", who) : version(loc, "la meva", devLabel(device)));
          await pujaAjuntada(r, owned, editor, remote, rh, mp.value); applied++;
          continue;
        }
      }
      if (choice === "altre") {
        saveVersion(version(loc, "la meva", devLabel(device)));
        applyShared(r, owned, editor); knowSh(r.obra_id, remote, rh, r.updated_at); applied++;
        continue;
      }
      // «La meva»: la de l'altre es guarda i es dona per vista; la d'aquí es puja damunt (amb comprovació).
      saveVersion(version(remote, "la de l’altre", who));
      knowSh(r.obra_id, remote, rh, r.updated_at); remoteChanged = false;
    }
    if (remoteChanged || !loc) {
      // Guanya el núvol (com a la resta de dades). Només s'aplica si es pot recarregar.
      if (!canApply) { waiting = true; continue; }
      applyShared(r, owned, editor); knowSh(r.obra_id, remote, rh, r.updated_at); applied++;
    } else if (localChanged && editor) {
      // V87.266 · només es desa si al núvol encara hi ha la versió que s'acaba de llegir; si algú l'ha canviada
      // just ara, no es trepitja: el cicle següent ho veurà i preguntarà.
      await pujaMeva(r, loc, lh);
    }
  }
  const ids = new Set(rows.map(r => r.obra_id));
  const gone = readArr(kObres(), []).filter(o => o?.compartida && o.compartida.owner !== me && !ids.has(o.id)).map(o => o.id);
  if (gone.length) { if (canApply) { removeForeign(gone); gone.forEach(id => { delete sm.known[id]; delete sm.kc[id]; delete sm.at[id]; shCache.delete(id); }); applied++; } else waiting = true; }
  for (const id of [...shCache.keys()]) if (!ids.has(id)) shCache.delete(id);
  writeRaw(sharedMetaKey(), JSON.stringify(sm));
  try { window.dispatchEvent(new CustomEvent("aco-shared-changed")); } catch {}
  return { applied, waiting };
}
async function shareObra(obraId, lectors = [], editors = []) {
  if (!session) throw new Error(t("Cal estar connectat al núvol."));
  const loc = localShare(obraId); if (!loc) throw new Error(t("No trobo aquesta obra."));
  const norm = a => [...new Set(a.map(toEmail).filter(e => e && e !== session.email))];
  const res = await api(`/rest/v1/aco_shared?on_conflict=obra_id&select=obra_id,updated_at`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: [{ obra_id: obraId, owner: session.user_id, owner_email: session.email, owner_nom: ownerNom(), lectors: norm(lectors), editors: norm(editors), ...loc, updated_by: session.email }] });
  const sm = readArr(sharedMetaKey(), null) || { known: {} }; sm.known[obraId] = shHash(loc); (sm.kc ||= {})[obraId] = shContent(loc);
  sm.at ||= {}; const at = Array.isArray(res) && res[0]?.updated_at; if (at) sm.at[obraId] = at; else delete sm.at[obraId];
  writeRaw(sharedMetaKey(), JSON.stringify(sm));
  setShBase(obraId, loc, sm.known[obraId]);
  sharedOwned.add(obraId);
}
async function unshareObra(obraId) {
  await api(`/rest/v1/aco_shared?obra_id=eq.${encodeURIComponent(obraId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  const sm = readArr(sharedMetaKey(), null) || { known: {} }; delete sm.known[obraId]; if (sm.kc) delete sm.kc[obraId]; if (sm.at) delete sm.at[obraId]; writeRaw(sharedMetaKey(), JSON.stringify(sm));
  shCache.delete(obraId);
  dropShBase(obraId);
  sharedOwned.delete(obraId);
}
async function sharedInfo(obraId) {
  const rows = await api(`/rest/v1/aco_shared?select=obra_id,owner,owner_nom,lectors,editors,updated_at,updated_by&obra_id=eq.${encodeURIComponent(obraId)}`);
  const r = rows?.[0]; if (!r) return null;
  const short = e => companyOf(e)?.username || e;
  return { ...r, propi: r.owner === session.user_id, lectors: (r.lectors || []).map(short), editors: (r.editors || []).map(short) };
}
// Un cicle: baixa el que ha canviat, puja el que és d'aquí i decideix si cal recarregar.
async function cycle({ startup = false, returning = false } = {}) {
  if (!active || !session) return;
  if (busy) { again = true; return; }
  busy = true; paint("busy");
  try {
    // Primera vegada amb aquest compte en aquest aparell: cal decidir com s'ajunten les dades.
    if (meta.userId !== session.user_id) {
      if (!startup) { lastErr = t("Tanca i torna a obrir l'app per acabar de connectar-la al núvol."); paint("error", t("Núvol · torna a obrir l’app")); return; }
      await firstSync();
    }
    if (!meta.at) await loadAt();
    const all = await pullSince(meta.cursor), rows = all.filter(r => !r.ja);
    let local = entries();
    meta.kc ||= {};
    for (const k in local) if (!(k in meta.kc) && meta.known[k] === hash(local[k])) meta.kc[k] = contentHash(local[k]);
    // V87.293 · versió comuna de les peces que encara no en tenen (una vegada per sessió): la d'aquí, si és la del núvol
    for (const k in local) if (!baseChecked.has(k)) { baseChecked.add(k); if (mergeable(k, local[k]) && getBase(k) == null && meta.known[k] === hash(local[k])) { try { writeRaw(baseKey(k), local[k]); } catch {} } }
    const pend = pendingKeys(local);
    const pendSet = new Set(pend);
    // Canvis d'altres aparells que encara no tenim.
    // V87.261 · pullSince torna a llegir els últims 5 s abans del cursor: una peça que ja teníem (mateixa
    // versió que meta.known) NO és un canvi nou encara que aquí l'haguem modificat després. Abans es
    // prenia per nova, «guanyava el núvol» i el canvi fet aquí es perdia (p. ex. fotos posades al mòbil
    // en una obra que l'ordinador acabava de tocar).
    const isNew = r => r.deleted ? r.key in meta.known : meta.known[r.key] !== hash(r.value ?? "");
    const differs = r => (r.deleted ? r.key in local : local[r.key] !== (r.value ?? ""));
    let remote = rows.filter(r => r.device !== device && differs(r) && isNew(r));
    // V87.266 · canvis alhora que s'havien deixat per més tard (es dictava o hi havia una finestra oberta)
    for (const [k, r] of carry) if (!remote.some(x => x.key === k) && differs(r) && isNew(r)) remote.push(r);
    carry = new Map();
    // V87.266 · Edició alhora: una peça canviada aquí i també des d'un altre lloc. Abans guanyava el núvol en
    // silenci; ara es pregunta quina es queda, i l'altra es guarda a «Versions guardades». Mentre es dicta o hi
    // ha una finestra oberta no es pregunta: la peça espera (ni es puja ni s'aplica).
    const held = new Set();
    let tookTheirs = false;
    // V87.293 · peces ajuntades soles (canvis en apartats o elements diferents): s'apliquen com un canvi d'un altre
    // aparell (quan es pot recarregar l'app) i després es puja l'ajuntada. Si ara no es pot, esperen.
    const mergedVal = new Map();
    const canApplyNow = startup || (!typing() && (returning || Date.now() - lastInput > 60000));
    const conflictRows = remote.filter(r => pendSet.has(r.key));
    if (conflictRows.length) {
      const tri = triage(conflictRows, local);
      const mine = new Set(tri.mine.map(r => r.key));
      tri.mine.forEach(keepMine);
      const ask = [];
      for (const r of tri.ask) {
        const mg = tryMerge(r, local);
        if (mg?.value !== undefined) { if (canApplyNow) mergedVal.set(r.key, mg.value); else { carry.set(r.key, r); held.add(r.key); } }
        else ask.push({ r, conflicts: mg?.conflicts || null });
      }
      if (ask.length) {
        if (holds) ask.forEach(({ r }) => { carry.set(r.key, r); held.add(r.key); });
        else {
          const res = await resolveConflicts(ask, local);
          res.mine.forEach(k => mine.add(k));
          res.merged.forEach((v, k) => mergedVal.set(k, v));
          if (res.theirs.length || res.merged.size) tookTheirs = true;
          local = entries(); // les versions guardades també es pugen
        }
      }
      // «theirs» sense preguntar es queda a «remote» i s'aplica com qualsevol canvi d'un altre aparell.
      remote = remote.filter(r => !mine.has(r.key) && !held.has(r.key)).map(r => (mergedVal.has(r.key) ? { ...r, merged: mergedVal.get(r.key) } : r));
    }
    const remoteKeys = new Set(remote.map(r => r.key));
    const waitingKeys = new Set((remoteWaiting?.rows || []).map(r => r.key));
    const toPush = pendingKeys(local).filter(k => !remoteKeys.has(k) && !waitingKeys.has(k) && !held.has(k));
    if (toPush.length) {
      const risk = await massChange(toPush, local);
      if (risk) { await stopForSafety(risk); return; }
      const clash = await pushRows(toPush.map(k => (k in local ? { key: k, value: local[k] } : { key: k, deleted: true })));
      const clashKeys = new Set(clash.map(c => c.key));
      toPush.forEach(k => { if (!clashKeys.has(k)) know(k, local[k]); });
      // les obres esborrades que ja han arribat al núvol ja no cal recordar-les
      toPush.forEach(k => { const id = splitKey(k)[1]; if (id !== null && !(k in local) && !clashKeys.has(k)) deliberate.delete(String(id)); });
      saveDeliberate();
      // Algú ha desat la mateixa peça just ara: no s'ha trepitjat. Es pregunta (o, si ara no es pot, després).
      if (clash.length) {
        const tri = triage(clash.map(c => c.theirs), local);
        tri.mine.forEach(keepMine);
        remote.push(...tri.theirs);
        const ask = [];
        for (const r of tri.ask) {
          const mg = tryMerge(r, local);
          if (mg?.value !== undefined) { if (canApplyNow) { remote.push({ ...r, merged: mg.value }); tookTheirs = true; } else carry.set(r.key, r); }
          else ask.push({ r, conflicts: mg?.conflicts || null });
        }
        if (ask.length) {
          if (holds) ask.forEach(({ r }) => carry.set(r.key, r));
          else {
            const res = await resolveConflicts(ask, local);
            if (res.theirs.length) { remote.push(...res.theirs); tookTheirs = true; }
            res.merged.forEach((v, k) => { const x = ask.find(i => i.r.key === k); if (x) { remote.push({ ...x.r, merged: v }); tookTheirs = true; } });
          }
        }
        again = true; // «la meva» es puja al cicle següent (damunt de la de l'altre, ja vista)
      }
    }
    meta.obres = countObres(local) || meta.obres || 0;
    if (!remote.length) {
      // Les files pròpies o iguals també serveixen per avançar el cursor.
      rows.forEach(r => { if (!pendSet.has(r.key) && r.device !== device) { know(r.key, r.deleted ? undefined : (r.value ?? "")); meta.at[r.key] = r.updated_at; } });
      meta.cursor = maxTime(all, meta.cursor); saveMeta();
      // Obres compartides
      const canApply = startup || (!typing() && (returning || Date.now() - lastInput > 60000));
      const sh = await sharedCycle(canApply);
      if (sh.applied && !startup) { lastOk = new Date().toISOString(); await reloadSafely(); return; }
      lastOk = new Date().toISOString(); lastErr = ""; paint(sh.waiting || held.size ? "remote" : "ok");
    } else if (startup || tookTheirs || (!typing() && (returning || Date.now() - lastInput > 60000))) {
      applyRows(remote);
      meta.cursor = maxTime(all, meta.cursor); saveMeta();
      lastOk = new Date().toISOString(); lastErr = "";
      if (startup) { try { await sharedCycle(true); } catch (e) { console.warn("Compartides:", e); } }
      if (!startup) { await reloadSafely(); return; }
      paint("ok");
    } else {
      remoteWaiting = { rows: remote, all: rows, skip: new Set() };
      saveMeta(); paint("remote");
    }
  } catch (e) {
    lastErr = String(e?.message || e);
    if (meta.userId !== session?.user_id) active = false;
    if (e.relogin) paint("login"); else if (e.space) paint("error", t("Núvol · aquest aparell no té prou espai")); else paint(e.offline ? "offline" : "error");
    if (startup) throw e;
  } finally {
    busy = false;
    if (again) { again = false; schedule(1500); }
  }
}

// Fre de seguretat: si d'una tirada es buiden o s'esborren diverses obres, no es puja res.
// V87.303 · Sense avisos falsos (19/10/2026, un navegador que feia dies que no es connectava):
// - les obres que l'usuari esborra expressament («Eliminar» de l'obra) no compten;
// - «deixar el núvol amb N expedients» només es mira si l'aparell puja de debò la llista d'obres, i abans d'aturar-se es
//   pregunta al núvol quantes n'hi ha ara (el número que l'aparell recordava podia ser de fa dies).
async function massChange(keys, local) {
  let dels = 0, shrinks = 0;
  for (const k of keys) {
    const id = splitKey(k)[1];
    if (id === null) continue;
    if (!(k in local) || local[k] === "null") { if (!deliberate.has(String(id))) dels++; continue; }
    const oldLen = +String(meta.known[k] || "").split(":")[1] || 0;
    if (oldLen > 20000 && local[k].length < oldLen * 0.4) shrinks++;
  }
  const obresKey = keys.find(k => /__hector__aco_obres$/.test(k)) || keys.find(k => /(^|__)aco_obres$/.test(k));
  const obresNow = countObres(local);
  let obresBefore = meta.obres || 0, lost = false;
  if (obresKey && obresBefore && obresNow + deliberate.size < obresBefore - 2) {
    try {
      const rows = await api(`/rest/v1/aco_kv?select=value,deleted&key=eq.${encodeURIComponent(obresKey)}`);
      const r = rows?.[0]; let nc = 0; try { nc = r && !r.deleted ? (JSON.parse(r.value || "[]") || []).length : 0; } catch {}
      obresBefore = nc;
    } catch {}
    lost = obresBefore > 0 && obresNow + deliberate.size < obresBefore - 2;
  }
  if (dels + shrinks >= 3 || lost) return { dels, shrinks, obresNow, obresBefore, lost };
  return null;
}
async function stopForSafety(risk) {
  active = false;
  lastErr = t("Aturat per seguretat: aquest aparell volia esborrar o buidar diverses obres del núvol.");
  paint("error", t("Núvol · aturat per seguretat"));
  const el = overlay(`
    <h1>${t("Aturat per seguretat")}</h1>
    <p>${t("Aquest aparell volia {que} del núvol. Segurament té dades velles. No s’ha pujat res.", { que: [risk.dels ? t("esborrar {n} obres", { n: risk.dels }) : "", risk.shrinks ? t("buidar {n} obres", { n: risk.shrinks }) : "", risk.lost ? t("deixar el núvol amb {n} expedients (n’hi havia {m})", { n: risk.obresNow, m: risk.obresBefore }) : ""].filter(Boolean).join(t(" i ")) })}</p>
    <div class="choices">
      <button type="button" data-v="cloud"><b>${t("Carregar les dades del núvol")}</b><span>${t("Recomanat. Aquest aparell es posa igual que el núvol.")}</span></button>
      <button type="button" data-v="later"><b>${t("Ara no")}</b><span>${t("Aquest aparell continua sense sincronitzar fins que el tornis a obrir.")}</span></button>
    </div>`);
  const choice = await new Promise(res => el.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => { el.remove(); res(b.dataset.v); })));
  if (choice === "cloud") {
    const rows = await pullSince("");
    const live = rows.filter(r => !r.deleted);
    const known = replaceWithCloud(live);
    clearBases();
    meta = { userId: session.user_id, cursor: maxTime(rows, ""), known, obres: countObres(live) };
    saveMeta();
    await reloadSafely();
  }
}
// Restauració: el núvol queda exactament igual que aquest aparell (només des de l'ordinador,
// quan el fitxer de DADES porta la marca «forcarNuvol»).
async function forcePushAll() {
  const rows = await pullSince("");
  const local = entries();
  const live = rows.filter(r => !r.deleted);
  await pushRows([...Object.keys(local).map(k => ({ key: k, value: local[k] })), ...live.filter(r => !(r.key in local)).map(r => ({ key: r.key, deleted: true }))], { force: true });
  const known = {}; for (const k in local) known[k] = hash(local[k]);
  clearBases();
  meta = { userId: session.user_id, cursor: maxTime(rows, ""), known, obres: countObres(local) };
  saveMeta();
  try { await fetch("/__dades-locals/netejar-marca", { method: "POST" }); } catch {}
}
async function applyWaitingAndReload() {
  // V87.266 · amb una finestra oberta (acta a mig fer, formulari…) no es recarrega: es perdria el que no s'ha desat.
  if (holds) { alert(t("Hi ha canvis d’un altre aparell. Desa o tanca primer el que tens obert i torna a clicar «Actualitzar».")); return; }
  remoteWaiting = null;
  await cycle({ returning: true });
}
async function reloadSafely() {
  active = false;
  try { await window.__acoStore?.flush?.(); } catch {}
  try { sessionStorage.setItem("aco-reentrar-auto", sessionStorage.getItem("aco_current_user8779") || ""); } catch {}
  try { await window.__acoLocalDisk?.flush?.(); } catch {}
  location.reload();
}
// V87.263 · «hold»: l'app està fent una feina sense tecles ni tocs (dictat per veu; des de la V87.266 també una
// finestra oberta o una acta a mig fer).
// Mentre duri, els canvis d'altres aparells esperen (com quan s'està escrivint) i l'app no es recarrega sola.
let holds = 0;
function hold(on) { holds = Math.max(0, holds + (on ? 1 : -1)); if (!on && !holds) { lastInput = Date.now(); if (carry.size) schedule(1500); } }
function typing() { if (holds) return true; const el = document.activeElement; return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable); }
function schedule(ms = 4000) { clearTimeout(timer); timer = setTimeout(() => cycle(), ms); }
async function syncNow() { await cycle({ returning: true }); }
// V87.258.2 · entrar amb un altre compte des de la pantalla d'entrada de l'app.
// V87.259.2 · funcions de Supabase (p. ex. «llegir-albara»), amb la sessió de l'usuari.
// V87.409 · funcions del núvol que es criden amb el compte connectat (p. ex. les peticions de signatura a distància)
async function rpc(name, body) { if (!session) throw new Error(t("Cal estar connectat al núvol.")); return api(`/rest/v1/rpc/${name}`, { method: "POST", body: body || {} }); }
async function callFunction(name, body) { if (!session) throw new Error(t("Cal estar connectat al núvol.")); return api(`/functions/v1/${name}`, { method: "POST", body }); }
async function switchTo(user, pass) {
  const was = active; active = false;
  try { await login(toEmail(user), pass); } catch (e) { active = was; throw e; }
  try { localStorage.setItem("nuvol-aco-correu", String(user).trim()); localStorage.removeItem(SKIP_KEY); sessionStorage.removeItem(SKIP_KEY); sessionStorage.removeItem("aco_current_user8779"); sessionStorage.removeItem("aco-reentrar-auto"); } catch {}
  try { await window.__acoLocalDisk?.flush?.(); } catch {}
  try { await window.__acoStore?.flush?.(); } catch {}
  location.reload();
}
async function connect() { try { localStorage.removeItem(SKIP_KEY); sessionStorage.removeItem(SKIP_KEY); } catch {} try { await window.__acoStore?.flush?.(); } catch {} location.reload(); }
// Tancar la sessió: les dades d'aquest compte es queden en aquest aparell i en
// tornar a entrar continuen sincronitzant. En recarregar surt «Entra al núvol».
async function logout() {
  active = false;
  writeSession(null);
  try { sessionStorage.removeItem("aco_current_user8779"); sessionStorage.removeItem("aco-reentrar-auto"); } catch {}
  try { await window.__acoLocalDisk?.flush?.(); } catch {}
  try { await window.__acoStore?.flush?.(); } catch {}
  location.reload();
}
function hook() {
  const watch = k => { if (active && !applying && k != null && APP_KEY.test(String(k)) && !EXCLUDE.test(String(k)) && inScope(String(k))) schedule(); };
  if (window.__acoStore) window.__acoStore.onChange(watch);
  else {
    const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) { set.call(this, k, v); if (this === window.localStorage) watch(k); };
    Storage.prototype.removeItem = function (k) { remove.call(this, k); if (this === window.localStorage) watch(k); };
  }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(ev => window.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { clearTimeout(timer); cycle(); }
    else cycle({ returning: true });
  });
  window.addEventListener("online", () => cycle({ returning: true }));
  setInterval(() => { if (document.visibilityState === "visible") cycle(); }, 20000);
}

export async function startCloudSync() {
  if (!CLOUD_URL || !CLOUD_KEY) return;
  device = makeDevice();
  loadDeliberate();
  window.__acoCloud = { status: () => ({ connected: !!session && active, email: session?.email || "", usuari: companyOf(session?.email)?.username || session?.email || "", lastOk, lastErr, device }), syncNow, connect, logout, switchTo, esborrada: id => { if (id) { deliberate.add(String(id)); saveDeliberate(); } }, shareObra, unshareObra, sharedInfo, sharedOwned: () => sharedOwned, myEmail: () => session?.email || "", callFunction, rpc, changePassword, storageUpload, storageDownload, espai, hold, versions: listVersions, restoreVersion, userId: () => session?.user_id || "" };
  session = readSession();
  const skipped = (() => { try { return localStorage.getItem(SKIP_KEY) === "1" || sessionStorage.getItem(SKIP_KEY) === "1"; } catch { return false; } })();
  if (!session) {
    if (skipped) { applyCompanyContext(); return; }
    const r = await askLogin({ allowSkip: true });
    if (r === "skip") { try { (isLocalServer() ? localStorage : sessionStorage).setItem(SKIP_KEY, "1"); } catch {} applyCompanyContext(); return; }
  }
  applyCompanyContext();
  // Estat de sincronització propi de cada compte (abans n'hi havia un de sol).
  meta = readJson(metaKey(), null);
  if (!meta) { const legacy = readJson(META_KEY, null); meta = legacy && legacy.userId === session.user_id ? legacy : { userId: "", cursor: "", known: {} }; }
  hook();
  active = true;
  try {
    if (window.__acoLocalDisk?.forcarNuvol && !window.__acoEmpresa) {
      paint("busy", "Núvol · restaurant amb les dades d’aquest ordinador…");
      await forcePushAll();
      lastOk = new Date().toISOString(); paint("ok");
    }
    await cycle({ startup: true });
  } catch (e) {
    if (e.relogin) {
      const r = await askLogin({ allowSkip: true, message: "La sessió ha caducat. Torna a entrar." });
      if (r === "ok") { applyCompanyContext(); meta = readJson(metaKey(), null) || { userId: "", cursor: "", known: {} }; try { await cycle({ startup: true }); } catch {} }
      else { active = false; return; }
    }
    // Sense connexió: l'app s'obre igualment amb les dades d'aquest aparell.
  }
}
