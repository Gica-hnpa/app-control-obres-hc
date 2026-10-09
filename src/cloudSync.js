// V87.257 · Núvol (Supabase) amb usuari i contrasenya.
// - En obrir l'app: si tens sessió, es baixen els canvis fets des d'altres aparells
//   abans de mostrar l'app. Si no en tens, et demana el correu i la contrasenya.
// - Cada canvi es puja sol al cap de pocs segons (només el que ha canviat: cada
//   clau de l'app és una fila i les dades de cada expedient, una fila pròpia).
// - Cada 20 s (i en tornar a l'app) es mira si un altre aparell ha canviat res.
// - Sense cobertura l'app continua funcionant; els canvis es pugen en tornar-n'hi.
import { CLOUD_URL, CLOUD_KEY } from "./cloudConfig.js";

const VERSION = "V87.257.1";
const APP_KEY = /^aco_/;
// Claus que són pròpies de cada aparell i no s'han de compartir.
const EXCLUDE = /(auto_timer|agenda_view|_sync_tick|aco_supabase)/;
const SPLIT = /__aco_odata$/;
const SESSION_KEY = "nuvol-aco-sessio", META_KEY = "nuvol-aco-estat", SKIP_KEY = "nuvol-aco-ara-no", DEVICE_KEY = "dispositiu-app-control-obres";

let session = null, meta = { userId: "", cursor: "", known: {} }, device = "", active = false;
let timer = null, busy = false, again = false, badge = null, lastOk = "", lastErr = "", remoteWaiting = null, lastInput = Date.now();
let rawSet = null, rawRemove = null;

// ---------- utilitats ----------
function hash(str) {
  str = String(str ?? "");
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36) + ":" + str.length;
}
function readJson(k, f) { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? f; } catch { return f; } }
function writeRaw(k, v) { (rawSet || Storage.prototype.setItem).call(localStorage, k, v); }
function saveMeta() { try { writeRaw(META_KEY, JSON.stringify(meta)); } catch (e) { console.warn("No es pot desar l'estat del núvol", e); } }
function fmtTime(iso) { try { return new Date(iso).toLocaleString("ca-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }
function isLocalServer() { return !!window.__acoLocalDisk; }
function makeDevice() {
  let d = "";
  try { d = localStorage.getItem(DEVICE_KEY) || ""; if (!d) { const kind = (navigator.userAgent.match(/iPhone|iPad|Android|Windows|Macintosh|Linux/) || ["Aparell"])[0]; d = `${kind}-${Math.random().toString(36).slice(2, 8)}`; localStorage.setItem(DEVICE_KEY, d); } } catch { d = "Aparell-" + Math.random().toString(36).slice(2, 8); }
  return d;
}
function hasObres(entriesObj) { return Object.keys(entriesObj).some(k => /(^|__)aco_obres$/.test(k) && String(entriesObj[k] || "").length > 10); }

// ---------- API Supabase ----------
async function api(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const h = { apikey: CLOUD_KEY, "Content-Type": "application/json", ...headers };
  if (auth) { await ensureToken(); h.Authorization = `Bearer ${session.access_token}`; }
  let r;
  try { r = await fetch(CLOUD_URL + path, { method, headers: h, body: body == null ? undefined : JSON.stringify(body), cache: "no-store" }); }
  catch { const e = new Error("No hi ha connexió amb el núvol."); e.offline = true; throw e; }
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch {}
  if (!r.ok) { const e = new Error(j?.msg || j?.message || j?.error_description || j?.error || t || `Error ${r.status}`); e.status = r.status; throw e; }
  return j;
}
function setSession(j) {
  session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, email: j.user?.email || session?.email || "", user_id: j.user?.id || session?.user_id || "" };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
}
async function ensureToken() {
  if (!session) throw new Error("Cal entrar al núvol.");
  if (Date.now() < session.expires_at - 60000) return;
  try { setSession(await api("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: session.refresh_token }, auth: false })); }
  catch (e) { if (!e.offline && e.status >= 400 && e.status < 500) { session = null; localStorage.removeItem(SESSION_KEY); e.relogin = true; } throw e; }
}
async function login(email, password) {
  setSession(await api("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password }, auth: false }));
}
async function pullSince(cursor) {
  const out = []; let offset = 0;
  const since = cursor ? new Date(new Date(cursor).getTime() - 5000).toISOString() : "";
  for (;;) {
    const rows = await api(`/rest/v1/aco_kv?select=key,value,deleted,device,updated_at${since ? `&updated_at=gt.${encodeURIComponent(since)}` : ""}&order=updated_at.asc&limit=500&offset=${offset}`);
    out.push(...(rows || [])); if (!rows || rows.length < 500) break; offset += 500;
  }
  return out;
}
async function pushRows(rows) {
  let batch = [], size = 0;
  const flush = async () => { if (!batch.length) return; await api("/rest/v1/aco_kv?on_conflict=user_id,key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: batch }); batch = []; size = 0; };
  for (const r of rows) {
    const s = String(r.value || "").length;
    if (batch.length && size + s > 1500000) await flush();
    batch.push({ user_id: session.user_id, key: r.key, value: r.deleted ? null : r.value, deleted: !!r.deleted, device });
    size += s;
  }
  await flush();
}

// ---------- dades locals ----------
function entries() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !APP_KEY.test(k) || EXCLUDE.test(k)) continue;
    const v = localStorage.getItem(k);
    if (SPLIT.test(k)) {
      let o = null; try { o = JSON.parse(v); } catch {}
      if (o && typeof o === "object" && !Array.isArray(o)) { for (const id of Object.keys(o)) out[`${k}#${id}`] = JSON.stringify(o[id]); continue; }
    }
    out[k] = v;
  }
  return out;
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
  for (const r of rows) {
    if (skip.has(r.key)) continue;
    const val = r.deleted ? undefined : (r.value ?? "");
    const cur = local[r.key];
    if (val === cur) { if (val === undefined) delete meta.known[r.key]; else meta.known[r.key] = hash(val); continue; }
    const [base, id] = splitKey(r.key);
    if (id !== null) (patches[base] ??= {})[id] = val;
    else if (val === undefined) (rawRemove || Storage.prototype.removeItem).call(localStorage, r.key);
    else { try { writeRaw(r.key, val); } catch (e) { console.warn("Núvol: no hi cap", r.key, e); continue; } }
    if (val === undefined) delete meta.known[r.key]; else meta.known[r.key] = hash(val);
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
  const remove = rawRemove || Storage.prototype.removeItem;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && APP_KEY.test(k) && !EXCLUDE.test(k)) keys.push(k); }
  keys.forEach(k => { try { remove.call(localStorage, k); } catch {} });
  const plain = {}, split = {};
  for (const r of live) {
    const [base, id] = splitKey(r.key);
    if (id !== null) { split[base] ??= {}; try { split[base][id] = JSON.parse(r.value); } catch {} }
    else plain[r.key] = r.value ?? "";
  }
  for (const base in split) plain[base] = JSON.stringify(split[base]);
  const failed = [];
  Object.entries(plain).sort((a, b) => a[1].length - b[1].length).forEach(([k, v]) => { try { writeRaw(k, v); } catch { failed.push(k); } });
  meta.known = {};
  live.forEach(r => { meta.known[r.key] = hash(r.value ?? ""); });
  if (failed.length) { const e = new Error(`Aquest aparell no té prou espai per a les dades del núvol (${failed.length} parts).`); e.space = true; throw e; }
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
  badge.textContent = text || (state === "busy" ? "Núvol · sincronitzant…"
    : state === "offline" ? "Núvol · sense connexió (es pujarà després)"
    : state === "error" ? "Núvol · error (clica per tornar-ho a provar)"
    : state === "remote" ? "Canvis d’un altre aparell · Actualitzar"
    : state === "login" ? "Núvol · cal tornar a entrar"
    : `Núvol · al dia ${fmtTime(lastOk)}`);
  badge.title = lastErr || (session ? `Connectat com ${session.email}` : "");
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
      <h1>Entra al núvol</h1>
      <p>Amb el teu compte veuràs les mateixes dades a l’ordinador, al mòbil i a la tauleta.</p>
      <form>
        <label><span>Correu</span><input name="email" type="email" autocomplete="username" required></label>
        <label><span>Contrasenya</span><input name="password" type="password" autocomplete="current-password" required></label>
        <p class="err" role="alert">${message}</p>
        <button class="primary" type="submit">Entrar</button>
        ${allowSkip ? `<button class="link" type="button" data-skip>${isLocalServer() ? "Ara no · treballar només en aquest ordinador" : "Ara no · treballar sense núvol en aquest aparell"}</button>` : ""}
      </form>`);
    const form = el.querySelector("form"), err = el.querySelector(".err"), btn = el.querySelector("button.primary");
    const email = form.elements.email; email.value = readJson(SESSION_KEY, null)?.email || localStorage.getItem("nuvol-aco-correu") || ""; (email.value ? form.elements.password : email).focus();
    form.addEventListener("submit", async e => {
      e.preventDefault(); err.textContent = ""; btn.disabled = true; btn.textContent = "Entrant…";
      try {
        await login(form.elements.email.value.trim(), form.elements.password.value);
        try { localStorage.setItem("nuvol-aco-correu", form.elements.email.value.trim()); } catch {}
        el.remove(); resolve("ok");
      } catch (x) {
        err.textContent = x.offline ? "No hi ha connexió amb el núvol. Revisa Internet i torna-ho a provar."
          : /invalid login|invalid_grant|credentials/i.test(x.message) ? "Correu o contrasenya incorrectes."
          : /not confirmed/i.test(x.message) ? "Aquest correu encara no està confirmat a Supabase."
          : x.message;
        btn.disabled = false; btn.textContent = "Entrar";
      }
    });
    el.querySelector("[data-skip]")?.addEventListener("click", () => { el.remove(); resolve("skip"); });
  });
}
function askChoice({ cloudWhen, cloudDevice, localObres, cloudObres }) {
  return new Promise(resolve => {
    const el = overlay(`
      <h1>Ja hi ha dades al núvol</h1>
      <p>Al núvol hi ha <b>${cloudObres} expedients</b>, desats el ${fmtTime(cloudWhen)}. En aquest aparell n’hi ha <b>${localObres}</b>. Quines dades vols fer servir?</p>
      <div class="choices">
        <button type="button" data-v="cloud"><b>Les del núvol (${cloudObres} expedients)</b><span>Aquest aparell es posa igual que el núvol. És el normal al mòbil, a la tauleta o a qualsevol aparell nou.</span></button>
        <button type="button" data-v="local"><b>Les d’aquest aparell (${localObres} expedients)</b><span>Esborra el que hi ha al núvol i hi posa les dades d’aquí. Només si saps que aquestes són les bones.</span></button>
      </div>
      <div class="confirm" hidden>
        <p><b>Segur?</b> Les ${cloudObres} obres del núvol se substituiran per les ${localObres} d’aquest aparell, també als altres aparells.</p>
        <div class="choices"><button type="button" data-ok><b>Sí, substituir el núvol</b></button><button type="button" data-back><b>No, tornar enrere</b></button></div>
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
  meta = { userId: session.user_id, cursor: maxTime(rows, ""), known: {} };
  const cloudObres = live.some(r => /(^|__)aco_obres$/.test(r.key) && String(r.value || "").length > 10);
  if (!cloudObres) {
    await pushRows(Object.keys(local).map(k => ({ key: k, value: local[k] })));
    for (const k in local) meta.known[k] = hash(local[k]);
  } else if (!hasObres(local)) {
    replaceWithCloud(live);
  } else {
    const last = live.reduce((m, r) => (r.updated_at > (m?.updated_at || "") ? r : m), null);
    const choice = await askChoice({ cloudWhen: last?.updated_at, cloudDevice: last?.device, localObres: countObres(local), cloudObres: countObres(live) });
    if (choice === "cloud") {
      replaceWithCloud(live);
    } else {
      const localKeys = new Set(Object.keys(local));
      await pushRows([...Object.keys(local).map(k => ({ key: k, value: local[k] })), ...live.filter(r => !localKeys.has(r.key)).map(r => ({ key: r.key, deleted: true }))]);
      for (const k in local) meta.known[k] = hash(local[k]);
    }
  }
  saveMeta();
}
// Un cicle: baixa el que ha canviat, puja el que és d'aquí i decideix si cal recarregar.
async function cycle({ startup = false, returning = false } = {}) {
  if (!active || !session) return;
  if (busy) { again = true; return; }
  busy = true; paint("busy");
  try {
    // Primera vegada amb aquest compte en aquest aparell: cal decidir com s'ajunten les dades.
    if (meta.userId !== session.user_id) {
      if (!startup) { lastErr = "Tanca i torna a obrir l'app per acabar de connectar-la al núvol."; paint("error", "Núvol · torna a obrir l’app"); return; }
      await firstSync();
    }
    const rows = await pullSince(meta.cursor);
    const local = entries();
    const pend = pendingKeys(local);
    const pendSet = new Set(pend);
    const remote = rows.filter(r => r.device !== device && !pendSet.has(r.key) && (r.deleted ? r.key in local : local[r.key] !== (r.value ?? "")));
    if (pend.length) {
      await pushRows(pend.map(k => (k in local ? { key: k, value: local[k] } : { key: k, deleted: true })));
      pend.forEach(k => { if (k in local) meta.known[k] = hash(local[k]); else delete meta.known[k]; });
    }
    if (!remote.length) {
      // Les files pròpies o iguals també serveixen per avançar el cursor.
      rows.forEach(r => { if (!pendSet.has(r.key) && r.device !== device) { if (r.deleted) delete meta.known[r.key]; else meta.known[r.key] = hash(r.value ?? ""); } });
      meta.cursor = maxTime(rows, meta.cursor); saveMeta();
      lastOk = new Date().toISOString(); lastErr = ""; paint("ok");
    } else if (startup || (!typing() && (returning || Date.now() - lastInput > 60000))) {
      applyRows(remote, pendSet);
      meta.cursor = maxTime(rows, meta.cursor); saveMeta();
      lastOk = new Date().toISOString(); lastErr = "";
      if (!startup) { await reloadSafely(); return; }
      paint("ok");
    } else {
      remoteWaiting = { rows: remote, all: rows, skip: pendSet };
      saveMeta(); paint("remote");
    }
  } catch (e) {
    lastErr = String(e?.message || e);
    if (e.relogin) paint("login"); else if (e.space) paint("error", "Núvol · aquest aparell no té prou espai"); else paint(e.offline ? "offline" : "error");
    if (startup) throw e;
  } finally {
    busy = false;
    if (again) { again = false; schedule(1500); }
  }
}
async function applyWaitingAndReload() {
  if (!remoteWaiting) { await cycle({ returning: true }); return; }
  const w = remoteWaiting; remoteWaiting = null;
  applyRows(w.rows, w.skip);
  meta.cursor = maxTime(w.all, meta.cursor); saveMeta();
  await reloadSafely();
}
async function reloadSafely() {
  active = false;
  try { await window.__acoLocalDisk?.flush?.(); } catch {}
  location.reload();
}
function typing() { const el = document.activeElement; return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable); }
function schedule(ms = 4000) { clearTimeout(timer); timer = setTimeout(() => cycle(), ms); }
async function syncNow() { await cycle({ returning: true }); }
async function connect() { try { localStorage.removeItem(SKIP_KEY); sessionStorage.removeItem(SKIP_KEY); } catch {} location.reload(); }
function logout() {
  try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(META_KEY); } catch {}
  try { localStorage.setItem(SKIP_KEY, "1"); } catch {}
  location.reload();
}
function hook() {
  rawSet = Storage.prototype.setItem; rawRemove = Storage.prototype.removeItem;
  const set = rawSet, remove = rawRemove;
  Storage.prototype.setItem = function (k, v) { set.call(this, k, v); if (active && this === window.localStorage && APP_KEY.test(String(k)) && !EXCLUDE.test(String(k))) schedule(); };
  Storage.prototype.removeItem = function (k) { remove.call(this, k); if (active && this === window.localStorage && APP_KEY.test(String(k))) schedule(); };
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(t => window.addEventListener(t, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
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
  window.__acoCloud = { status: () => ({ connected: !!session && active, email: session?.email || "", lastOk, lastErr, device }), syncNow, connect, logout };
  session = readJson(SESSION_KEY, null);
  meta = readJson(META_KEY, { userId: "", cursor: "", known: {} }) || { userId: "", cursor: "", known: {} };
  const skipped = (() => { try { return localStorage.getItem(SKIP_KEY) === "1" || sessionStorage.getItem(SKIP_KEY) === "1"; } catch { return false; } })();
  if (!session) {
    if (skipped) return;
    const r = await askLogin({ allowSkip: true });
    if (r === "skip") { try { (isLocalServer() ? localStorage : sessionStorage).setItem(SKIP_KEY, "1"); } catch {} return; }
  }
  hook();
  active = true;
  try {
    await cycle({ startup: true });
  } catch (e) {
    if (e.relogin) {
      const r = await askLogin({ allowSkip: true, message: "La sessió ha caducat. Torna a entrar." });
      if (r === "ok") { try { await cycle({ startup: true }); } catch {} }
      else { active = false; return; }
    }
    // Sense connexió: l'app s'obre igualment amb les dades d'aquest aparell.
  }
}
