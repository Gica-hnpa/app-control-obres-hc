// V87.295 · Agenda ↔ Google Calendar (decisió de l'Héctor del 17/10/2026: calendari propi «Control d'Obres» i en els
// dos sentits).
// - Permís: Google Identity Services (finestra de Google per triar el compte i donar permís). El permís dura una hora i
//   es demana amb un toc; no hi ha cap secret a l'app (l'identificador de client de Google és públic).
// - Les cites de l'app van al calendari «Control d'Obres» del compte de Google. Cada cita hi té un identificador fix
//   («aco» + l'id de l'app en hexadecimal): dos aparells que sincronitzen alhora no la dupliquen.
// - El que es canvia o s'esborra a Google torna a l'app; si s'ha canviat als dos llocs, guanya el canvi més nou.
// - Les cites del calendari principal de Google es poden veure a l'Agenda (només consulta).
import { GOOGLE_CLIENT_ID } from "./cloudConfig.js";

const ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const API = String(ENV.VITE_GOOGLE_API || "https://www.googleapis.com/calendar/v3").replace(/\/$/, "");
const SCOPE = "https://www.googleapis.com/auth/calendar";
export const CAL_NAME = "Control d'Obres";
const TZ = "Europe/Madrid";
// V87.331 · El permís (una hora) es desa per a cada usuari de l'app en aquest aparell (abans, només en aquesta pestanya: en tancar
// l'app s'havia de tornar a connectar). I es recorda que ja s'ha connectat: l'Agenda torna a demanar el permís sola al primer toc
// (Google obre i tanca la seva finestra; si el navegador la bloqueja, surt el botó com sempre).
const usr = () => { try { return sessionStorage.getItem("aco_current_user8779") || ""; } catch { return ""; } };
const TK = () => `google-cal-token__${usr()}`;
const FLAG = () => `google-cal-connectat__${usr()}`;

export function clientId() { return ENV.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID || ""; }
export function configured() { return !!clientId(); }

let token = null;
function tok() {
  if (token && token.u === usr()) return token;
  token = null;
  try { const t = JSON.parse(localStorage.getItem(TK()) || "null"); if (t?.exp > Date.now()) token = { ...t, u: usr() }; } catch {}
  return token;
}
export function connected() { const t = tok(); return !!t && t.exp - 60000 > Date.now(); }
function setToken(at, expiresIn) {
  token = { at, exp: Date.now() + (Number(expiresIn) || 3600) * 1000, u: usr() };
  try { localStorage.setItem(TK(), JSON.stringify({ at: token.at, exp: token.exp })); localStorage.setItem(FLAG(), "1"); } catch {}
  try { window.dispatchEvent(new Event("aco-google-connectat")); } catch {}
}
// «oblida»: l'usuari ja no vol el Google (no es tornarà a connectar sol)
export function disconnect(oblida = false) { token = null; try { localStorage.removeItem(TK()); if (oblida) localStorage.removeItem(FLAG()); } catch {} }
export function recorda() { try { localStorage.setItem(FLAG(), "1"); } catch {} }
export function potReconnectar() { try { return configured() && !connected() && localStorage.getItem(FLAG()) === "1"; } catch { return false; } }
// es carrega Google abans del toc: així la seva finestra s'obre dins del mateix toc i el navegador no la bloqueja
export function prepara() { if (!window.__acoGoogleMock && configured()) loadGis().catch(() => {}); }

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = () => res(); s.onerror = () => rej(new Error("No s’ha pogut carregar Google (sense connexió?)."));
    document.head.appendChild(s);
  });
}
// S'ha de cridar des d'un toc (Google obre la seva finestra). Si ja n'hi ha una d'oberta, s'espera aquella.
let enCurs = null;
export function connect() {
  if (!enCurs) enCurs = connect0().finally(() => { enCurs = null; });
  return enCurs;
}
async function connect0() {
  if (window.__acoGoogleMock) { const r = await window.__acoGoogleMock.requestToken(); setToken(r.access_token, r.expires_in); return true; }
  if (!configured()) throw new Error("Google Calendar encara no està configurat.");
  await loadGis();
  return new Promise((resolve, reject) => {
    const c = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId(), scope: SCOPE,
      callback: r => { if (r?.access_token) { setToken(r.access_token, r.expires_in); resolve(true); } else reject(new Error(r?.error_description || r?.error || "Google no ha donat permís.")); },
      error_callback: e => reject(new Error(e?.message || "Google no ha donat permís.")),
    });
    c.requestAccessToken({ prompt: "" });
  });
}
async function g(path, { method = "GET", body, query } = {}) {
  if (!connected()) { const e = new Error("Cal tornar a connectar amb Google."); e.relogin = true; throw e; }
  const qs = query ? "?" + new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== "")).toString() : "";
  let r;
  try { r = await fetch(API + path + qs, { method, headers: { Authorization: `Bearer ${tok().at}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); }
  catch { const e = new Error("Sense connexió amb Google."); e.offline = true; throw e; }
  if (r.status === 401) { disconnect(); const e = new Error("Cal tornar a connectar amb Google."); e.relogin = true; throw e; }
  if (r.status === 204) return null;
  const tx = await r.text(); let j = null; try { j = tx ? JSON.parse(tx) : null; } catch {}
  if (!r.ok) { const e = new Error(j?.error?.message || `Google ha tornat un error (${r.status}).`); e.status = r.status; throw e; }
  return j;
}

// ---------- conversió cita de l'app ↔ cita de Google ----------
const pad = n => String(n).padStart(2, "0");
const localIso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
function addDays(iso, n) { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return localIso(d); }
function plus1h(h) { const [a, b] = String(h || "09:00").split(":").map(Number); const m = Math.min(a * 60 + (b || 0) + 60, 23 * 60 + 59); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
const hex = s => Array.from(new TextEncoder().encode(String(s))).map(b => b.toString(16).padStart(2, "0")).join("");
export function gidFor(appId) { return ("aco" + hex(appId)).slice(0, 1000); }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ":" + s.length; }
// Empremta del que es veu a Google (si no canvia, no cal tornar a pujar)
export function signature(e) {
  return hashStr(JSON.stringify([e.title || "", e.iso || "", e.allDay ? "" : e.hora || "", e.allDay ? "" : e.horaFi || "", !!e.allDay, e.adreca || "", e.detail || "", e.obraId || "", e.tipus || "", e.avis ?? ""]));
}
export function toGoogle(e) {
  const fi = e.horaFi && e.horaFi > (e.hora || "") ? e.horaFi : plus1h(e.hora);
  return {
    summary: e.title || "Cita",
    description: [e.detail || "", e.obra ? `Obra: ${e.obra}` : ""].filter(Boolean).join("\n\n"),
    location: e.adreca || "",
    start: e.allDay ? { date: e.iso } : { dateTime: `${e.iso}T${e.hora || "09:00"}:00`, timeZone: TZ },
    end: e.allDay ? { date: addDays(e.iso, 1) } : { dateTime: `${e.iso}T${fi}:00`, timeZone: TZ },
    status: "confirmed",
    reminders: e.avis !== "" && e.avis != null ? { useDefault: false, overrides: [{ method: "popup", minutes: Number(e.avis) || 0 }] } : { useDefault: false, overrides: [] },
    extendedProperties: { private: { acoId: String(e.id), acoObra: e.obraId || "", acoTipus: e.tipus || "" } },
  };
}
export function fromGoogle(gv, base = {}) {
  let iso, hora = base.hora || "09:00", horaFi = "", allDay = false;
  if (gv.start?.date) { iso = gv.start.date; allDay = true; }
  else { const s = new Date(gv.start?.dateTime), f = new Date(gv.end?.dateTime || gv.start?.dateTime); iso = localIso(s); hora = hhmm(s); horaFi = hhmm(f); }
  const p = gv.extendedProperties?.private || {};
  const detail = String(gv.description || "").replace(/(?:\n\n)?Obra: [^\n]*$/, "").trim();
  const avis = gv.reminders?.useDefault === false ? (gv.reminders.overrides?.length ? String(gv.reminders.overrides[0].minutes) : "") : (base.avis ?? "");
  return { ...base, title: gv.summary || "(Sense títol)", iso, data: iso, hora, horaFi, allDay, adreca: gv.location || "", detail, avis, tipus: base.tipus || p.acoTipus || "Altres", obraId: base.obraId ?? p.acoObra ?? "" };
}

// ---------- calendari «Control d'Obres» ----------
export async function ensureCalendar(st) {
  if (st.calendarId) { try { await g(`/calendars/${encodeURIComponent(st.calendarId)}`); return st.calendarId; } catch (e) { if (e.relogin || e.offline) throw e; } }
  const list = []; let pageToken;
  do { const p = await g("/users/me/calendarList", { query: { pageToken } }); list.push(...(p?.items || [])); pageToken = p?.nextPageToken; } while (pageToken);
  const found = list.find(c => c.summary === CAL_NAME);
  if (found) return found.id;
  const c = await g("/calendars", { method: "POST", body: { summary: CAL_NAME, timeZone: TZ, description: "Cites de l’app Control d’Obres" } });
  return c.id;
}

// Sincronitza. «events»: totes les cites de l'app que han d'anar a Google; put(next, prev) desa una cita (nova si prev
// és null); del(prev) n'esborra una. «st»: estat desat { calendarId, known: { idApp: idGoogle }, lastPull }.
export async function syncGoogle({ events, put, del, st = {} }) {
  const out = { pujades: 0, baixades: 0, esborrades: 0 };
  st = { known: {}, lastPull: "", ...st, known: { ...(st.known || {}) } };
  const cal = await ensureCalendar(st);
  if (cal !== st.calendarId) { st.calendarId = cal; st.known = {}; st.lastPull = ""; }
  const C = `/calendars/${encodeURIComponent(cal)}/events`;
  const byId = new Map(events.map(e => [String(e.id), e]));
  // 1) El que ha canviat a Google
  const items = []; let pageToken, calUpdated = "";
  do {
    const p = await g(C, { query: { showDeleted: "true", singleEvents: "true", updatedMin: st.lastPull || undefined, maxResults: 250, pageToken } });
    items.push(...(p?.items || [])); pageToken = p?.nextPageToken; if (p?.updated) calUpdated = p.updated;
  } while (pageToken);
  const byGid = new Map(Object.entries(st.known).map(([a, gg]) => [gg, a]));
  let maxUpd = st.lastPull || "";
  for (const gv of items) {
    if (gv.updated > maxUpd) maxUpd = gv.updated;
    const appId = gv.extendedProperties?.private?.acoId || byGid.get(gv.id) || "";
    const e = appId ? byId.get(String(appId)) : null;
    if (e && e.gUpdated && gv.updated <= e.gUpdated) continue; // ja la tenim
    const canviadaAqui = !!e && (!e.gSynced || e.gSynced !== signature(e));
    if (gv.status === "cancelled") {
      if (e && !canviadaAqui) { del(e); byId.delete(String(e.id)); delete st.known[e.id]; out.esborrades++; }
      else if (!e && appId) delete st.known[appId];
      continue;
    }
    if (e) {
      if (canviadaAqui && String(e.editAt || "") > String(gv.updated)) continue; // la d'aquí és més nova: es pujarà
      const next = fromGoogle(gv, e); next.gId = gv.id; next.gUpdated = gv.updated; next.gSynced = signature(next);
      put(next, e); byId.set(String(e.id), next); st.known[e.id] = gv.id; out.baixades++;
    } else if (!appId || !(appId in st.known)) {
      const id = appId || `gc-${gv.id}`;
      if (byId.has(id)) continue;
      const next = fromGoogle(gv, { id, tipus: "Altres", obraId: "", avis: "" }); next.gId = gv.id; next.gUpdated = gv.updated; next.gSynced = signature(next);
      put(next, null); byId.set(id, next); st.known[id] = gv.id; out.baixades++;
    }
  }
  st.lastPull = maxUpd || calUpdated || st.lastPull;
  // 2) El que ha canviat a l'app
  for (const e of [...byId.values()]) {
    if (e.gSynced && e.gSynced === signature(e)) continue;
    const body = toGoogle(e), gid = e.gId || st.known[e.id] || gidFor(e.id);
    let res;
    try { res = await g(`${C}/${encodeURIComponent(gid)}`, { method: "PUT", body }); }
    catch (er) { if (er.status === 404 || er.status === 410) res = await g(C, { method: "POST", body: { ...body, id: gid } }); else throw er; }
    const next = { ...e, gId: res.id, gUpdated: res.updated, gSynced: signature(e) };
    put(next, e); byId.set(String(e.id), next); st.known[e.id] = res.id; out.pujades++;
  }
  // 3) Esborrades a l'app
  for (const [appId, gid] of Object.entries(st.known)) {
    if (byId.has(appId)) continue;
    try { await g(`${C}/${encodeURIComponent(gid)}`, { method: "DELETE" }); } catch (er) { if (er.status !== 404 && er.status !== 410) throw er; }
    delete st.known[appId]; out.esborrades++;
  }
  return { st, out };
}

// Cites del calendari principal de Google (només consulta) entre dues dates
export async function primaryEvents(fromIso, toIso) {
  const p = await g("/calendars/primary/events", { query: { timeMin: `${fromIso}T00:00:00Z`, timeMax: `${toIso}T23:59:59Z`, singleEvents: "true", orderBy: "startTime", maxResults: 250 } });
  return (p?.items || []).filter(x => x.status !== "cancelled").map(gv => ({ ...fromGoogle(gv, { id: `gp-${gv.id}`, tipus: "Google", obraId: "", avis: "" }), kind: "google", link: gv.htmlLink || "" }));
}
