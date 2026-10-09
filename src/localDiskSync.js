// V87.252 · Desat al teu ordinador.
// Si l'app s'ha obert amb OBRIR_APP.bat, el servidor local guarda totes les dades
// (claus «aco_…» del navegador) a DADES/app-control-obres-DADES-LOCALS.json.
// - En obrir: les dades del fitxer passen al navegador abans de mostrar l'app.
//   Si encara no hi ha fitxer, es fa servir la còpia «backup-complet» més recent de DADES.
// - Cada canvi: es desa al fitxer al cap d'un segon i mig.
// Si no hi ha servidor local (Render), no fa res i l'app funciona com sempre.
//
// V87.256 · Diversos dispositius a la mateixa wifi (OBRIR_APP_MOBIL.bat):
// - Només s'envien les claus que han canviat; el servidor les fusiona.
// - Cada 10 s es mira si un altre dispositiu ha desat. Si és així i no estàs
//   escrivint, l'app es posa al dia sola (en tornar-hi o després d'un minut sense
//   tocar res); si no, el rètol de baix et deixa actualitzar amb un clic.
const ENDPOINT = "/__dades-locals";
const APP_KEY = /^aco_/;
const VERSION = "V87.259";
const DEVICE_KEY = "dispositiu-app-control-obres";
let active = false, timer = null, dirty = false, saving = false, badge = null, lastSaved = "", lastError = "";
let known = {}, device = "", remotePending = false, lastInput = Date.now(), conflictAt = "", unloading = false;

function makeDevice() {
  let d = "";
  try {
    d = localStorage.getItem(DEVICE_KEY) || "";
    if (!d) {
      const kind = (navigator.userAgent.match(/iPhone|iPad|Android|Windows|Macintosh|Linux/) || ["Dispositiu"])[0];
      d = `${kind}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(DEVICE_KEY, d);
    }
  } catch { d = `Dispositiu-${Math.random().toString(36).slice(2, 8)}`; }
  // Cada pestanya compta com un dispositiu, perquè cadascuna té les seves dades a la memòria.
  let tab = "";
  try { tab = sessionStorage.getItem("pestanya-aco") || ""; if (!tab) { tab = Math.random().toString(36).slice(2, 6); sessionStorage.setItem("pestanya-aco", tab); } } catch { tab = Math.random().toString(36).slice(2, 6); }
  return `${d}/${tab}`;
}
function snapshot() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && APP_KEY.test(k) && !/(^|__)emp_/.test(k.replace(/^aco_v8782__/,""))) out[k] = localStorage.getItem(k);
  }
  return out;
}
function hasObres(storage) {
  return Object.keys(storage || {}).some(k => /(^|__)aco_obres$/.test(k) && String(storage[k] || "").length > 10);
}
function applyStorage(storage) {
  // (active és fals mentre s'aplica: aquests canvis no es tornen a desar)
  const set = (k, v) => localStorage.setItem(k, v), remove = k => localStorage.removeItem(k);
  const current = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && APP_KEY.test(k)) current.push(k); }
  current.forEach(k => { if (!(k in storage) && !/(^|__)emp_/.test(k.replace(/^aco_v8782__/,""))) remove(k); });
  // Primer les claus petites, i les grans al final, per aprofitar l'espai.
  Object.entries(storage).filter(([k, v]) => APP_KEY.test(k) && v != null)
    .sort((a, b) => String(a[1]).length - String(b[1]).length)
    .forEach(([k, v]) => { try { set(k, String(v)); } catch (e) { console.warn("No cap al navegador:", k, e); } });
}
function fmtTime(iso) {
  try { return new Date(iso).toLocaleString("ca-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}
function where() { return location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "a l’ordinador" : "a l’ordinador (wifi)"; }
function paint(state) {
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "local-save-badge-v878252";
    badge.setAttribute("role", "status");
    badge.addEventListener("click", () => { if (badge.dataset.state === "remote") applyRemote(true); });
    document.body.appendChild(badge);
  }
  badge.dataset.state = state;
  badge.textContent = state === "saving" ? "Desant…"
    : state === "error" ? `No s’ha pogut desar ${where()}`
    : state === "remote" ? "Hi ha canvis d’un altre dispositiu · Actualitzar"
    : state === "conflict" ? `Desat · un altre dispositiu també havia canviat el mateix (còpia a COPIES_AUTOMATIQUES)`
    : `Desat ${where()} · ${fmtTime(lastSaved)}`;
  badge.title = state === "error" ? lastError : state === "remote" ? "Clica per carregar els canvis fets des d’un altre dispositiu" : "Les dades es guarden a DADES\\app-control-obres-DADES-LOCALS.json de l’ordinador";
}
async function save() {
  if (saving) { dirty = true; return; }
  saving = true; dirty = false; paint("saving");
  try {
    const storage = snapshot();
    if (!hasObres(storage)) throw new Error("No hi ha expedients al navegador: no es desa per seguretat.");
    const changes = {}, removed = [];
    Object.keys(storage).forEach(k => { if (known[k] !== storage[k]) changes[k] = storage[k]; });
    Object.keys(known).forEach(k => { if (!(k in storage)) removed.push(k); });
    if (!Object.keys(changes).length && !removed.length) { paint(remotePending ? "remote" : "ok"); return; }
    const base = lastSaved;
    const r = await fetch(`${ENDPOINT}/desar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: VERSION, device, base, changes, removed }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || `Error ${r.status}`);
    Object.assign(known, changes); removed.forEach(k => { delete known[k]; });
    lastSaved = j.savedAt; lastError = "";
    // Un altre dispositiu havia desat abans que nosaltres: cal portar els seus canvis.
    if (j.prevSavedAt && j.prevSavedAt !== base && j.prevDevice && j.prevDevice !== device) remotePending = true;
    if (j.conflicts?.length) { conflictAt = j.savedAt; console.warn("Claus desades alhora des de dos dispositius:", j.conflicts); }
    paint(remotePending ? "remote" : conflictAt === j.savedAt ? "conflict" : "ok");
  } catch (e) {
    lastError = String(e?.message || e); paint("error");
  } finally {
    saving = false;
    if (dirty) schedule();
  }
}
function schedule() {
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(save, 1500);
}
function typing() {
  const el = document.activeElement;
  return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
}
async function applyRemote(force = false) {
  if (dirty || saving) { if (force) { clearTimeout(timer); await save(); } else return; }
  let info;
  try { const r = await fetch(`${ENDPOINT}/estat`, { cache: "no-store" }); if (!r.ok) return; info = await r.json(); } catch { return; }
  if (!info?.storage || !hasObres(info.storage)) return;
  if (dirty || saving) return;
  active = false;
  applyStorage(info.storage);
  try { sessionStorage.setItem("aco-reentrar-auto", sessionStorage.getItem("aco_current_user8779") || ""); } catch {}
  try { await window.__acoStore?.flush?.(); } catch {}
  location.reload();
}
async function checkRemote(returning = false) {
  if (!active || saving) return;
  if (!remotePending) {
    let v;
    try { const r = await fetch(`${ENDPOINT}/versio`, { cache: "no-store" }); if (!r.ok) return; v = await r.json(); } catch { return; }
    if (!v?.savedAt || v.savedAt === lastSaved || v.device === device) return;
    remotePending = true;
  }
  const idle = Date.now() - lastInput > 60000;
  if (!dirty && !typing() && (returning || idle)) applyRemote();
  else paint("remote");
}
function hook() {
  if (window.__acoStore) {
    // V87.258 · dades a IndexedDB (bigStore.js): s'escolten els canvis.
    window.__acoStore.onChange(k => { if (active && (k === null || APP_KEY.test(String(k)))) schedule(); });
  } else {
    const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    Storage.prototype.setItem = function (k, v) { set.call(this, k, v); if (active && this === window.localStorage && APP_KEY.test(String(k))) schedule(); };
    Storage.prototype.removeItem = function (k) { remove.call(this, k); if (active && this === window.localStorage && APP_KEY.test(String(k))) schedule(); };
    Storage.prototype.clear = function () { clear.call(this); if (active && this === window.localStorage) schedule(); };
  }
  // Les dades pesen massa per enviar-les en tancar la pestanya (els navegadors
  // limiten aquest enviament a 64 KB). Si queda alguna cosa per desar, es desa
  // de seguida i el navegador demana confirmació abans de tancar.
  window.addEventListener("beforeunload", e => {
    if (!active || unloading || (!dirty && !saving)) return;
    clearTimeout(timer); save();
    e.preventDefault(); e.returnValue = "";
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && dirty) { clearTimeout(timer); save(); }
    if (document.visibilityState === "visible") checkRemote(true);
  });
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(t => window.addEventListener(t, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
  setInterval(() => { if (document.visibilityState === "visible") checkRemote(false); }, 10000);
}

export async function startLocalDiskSync() {
  let info;
  try {
    const r = await fetch(`${ENDPOINT}/estat`, { cache: "no-store" });
    if (!r.ok) return;
    info = await r.json();
  } catch { return; }
  if (!info || !info.mode) return;
  device = makeDevice();
  if ((info.mode === "fitxer" || info.mode === "copia") && info.storage && hasObres(info.storage)) {
    applyStorage(info.storage);
    lastSaved = info.savedAt || "";
    if (info.mode === "fitxer") known = { ...info.storage };
  }
  active = true;
  hook();
  if (info.mode === "fitxer") paint("ok");
  else save(); // primera vegada: crea el fitxer a partir de la còpia o del navegador
  // El núvol (cloudSync.js) el fa servir abans de recarregar la pàgina.
  const flush = async () => { clearTimeout(timer); for (let i = 0; i < 100 && saving; i++) await new Promise(r => setTimeout(r, 100)); if (dirty) await save(); unloading = true; };
  window.__acoLocalDisk = { file: info.file, mode: info.mode, device, flush, forcarNuvol: !!info.forcarNuvol };
}
