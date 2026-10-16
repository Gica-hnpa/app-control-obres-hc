// V87.261 · Fotos, croquis i documents de les actes: cada fitxer es desa a part en aquest aparell
// (IndexedDB «aco_fitxers»). El desat de les obres en treu les imatges per pes (stripHeavy878185),
// i fins ara no quedaven guardades enlloc: en recarregar l'app es perdien.
// La clau és «<espai>::<id del fitxer>» (espai = hector, emp_brava…), així els comptes no es barregen.
// V87.262 · i a més es pugen al núvol (Supabase Storage privat «aco-fitxers»), a
// «<compte propietari>/<obra>/<id>». Una cua desada a l'aparell els puja com més aviat millor
// (al moment si hi ha cobertura; si no, en tornar-n'hi), perquè Safari (iPhone/iPad) pot esborrar
// les dades d'una web que fa dies que no s'obre. Els altres aparells els baixen en obrir l'obra.
import { t } from "./i18n.js";
const DB = "aco_fitxers", STORE = "fitxers", QUEUE = "cua", DONE = "pujats";
// Llistes de l'obra que porten fitxers, i el camp on hi ha el contingut.
const LISTS = { fotos: "src", croquis: "src", docs: "url" };
let dbPromise = null, persistAsked = false;
const stored = new Map(); // clau → mida ja desada en aquesta sessió (per no tornar-la a escriure)

function open() {
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => { for (const s of [STORE, QUEUE, DONE]) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}
async function tx(mode, fn, store = STORE) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode), req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}
const keyOf = (space, id) => `${space}::${id}`;
const isData = v => typeof v === "string" && /^data:/i.test(v);
function askPersist() {
  if (persistAsked) return;
  persistAsked = true;
  // Demana al navegador que no esborri aquestes dades si li falta espai.
  try { navigator.storage?.persist?.(); } catch {}
}

// Recorre les llistes de fitxers d'una obra (fotos de l'obra, i croquis i documents de cada acta).
function eachFile(obra, fn) {
  if (!obra || typeof obra !== "object") return;
  (function walk(node, depth) {
    if (!node || typeof node !== "object" || depth > 4) return;
    for (const [k, v] of Object.entries(node)) {
      if (Array.isArray(v) && LISTS[k]) v.forEach((item, i) => { if (item && typeof item === "object" && item.id) fn(item, LISTS[k], v, i); });
      else if (Array.isArray(v)) v.forEach(x => walk(x, depth + 1));
      else if (v && typeof v === "object") walk(v, depth + 1);
    }
  })(obra, 0);
}

// Abans de desar les obres: cada fitxer amb contingut va al seu lloc (només els que no hi són encara)
// i a la cua per pujar al núvol.
export function persistObraFiles(odata, space) {
  if (!odata || typeof odata !== "object" || !space || typeof indexedDB === "undefined") return Promise.resolve(0);
  const jobs = [];
  for (const [obraId, obra] of Object.entries(odata)) eachFile(obra, (item, field) => {
    const v = item[field];
    if (!isData(v)) return;
    const key = keyOf(space, item.id);
    if (stored.get(key) === v.length) return;
    stored.set(key, v.length);
    jobs.push(tx("readwrite", s => s.put({ data: v, field, obraId, nom: item.nom || "", type: item.type || "", savedAt: new Date().toISOString() }, key))
      .then(() => enqueue(space, "fitxer", item.id, obraId))
      .catch(e => { stored.delete(key); console.warn("No s'ha pogut desar el fitxer", item.nom || item.id, e); throw e; }));
  });
  if (jobs.length) askPersist();
  return Promise.allSettled(jobs).then(r => { kick(); return r.filter(x => x.status === "rejected").length ? Promise.reject(new Error("Algun fitxer no s'ha pogut desar en aquest aparell.")) : jobs.length; });
}

// En obrir les obres: torna a posar el contingut dels fitxers que en aquest aparell hi són.
// Retorna un mapa id → {field, data} (buit si no cal canviar res).
export async function loadObraFiles(odata, space) {
  const found = new Map();
  if (!odata || typeof odata !== "object" || !space || typeof indexedDB === "undefined") return found;
  const wanted = [];
  for (const obra of Object.values(odata)) eachFile(obra, (item, field) => { if (!isData(item[field])) wanted.push([item.id, field]); });
  for (const [id, field] of wanted) {
    try {
      const rec = await tx("readonly", s => s.get(keyOf(space, id)));
      if (rec && isData(rec.data)) { found.set(id, { field: rec.field || field, data: rec.data }); stored.set(keyOf(space, id), rec.data.length); }
    } catch (e) { console.warn("No s'ha pogut llegir el fitxer", id, e); }
  }
  return found;
}

// Posa els fitxers trobats dins les obres (sense tocar res més). Retorna les mateixes obres si no hi ha canvis.
export function fillObraFiles(odata, found) {
  if (!found || !found.size || !odata) return odata;
  let changed = false;
  const out = {};
  for (const [obraId, obra] of Object.entries(odata)) {
    const copy = JSON.parse(JSON.stringify(obra ?? null));
    let touched = false;
    eachFile(copy, (item, field, list, i) => {
      const f = found.get(item.id);
      if (f && !isData(item[field])) { const { _light, ...rest } = item; list[i] = { ...rest, [f.field || field]: f.data }; touched = true; }
    });
    out[obraId] = touched ? copy : obra;
    if (touched) changed = true;
  }
  return changed ? out : odata;
}

// ---------- V87.262 · núvol ----------
// Espai actiu (hector, emp_brava…) i propietari de cada obra: els posa App.jsx.
const cloud = () => (typeof window !== "undefined" ? window.__acoCloud : null);
const activeSpace = () => (typeof window !== "undefined" ? window.__acoFilesSpace || "" : "");
function ownerOf(obraId) {
  const o = typeof window !== "undefined" && window.__acoOwnerOf ? window.__acoOwnerOf(obraId) : "";
  return o || cloud()?.userId?.() || "";
}
const seg = s => encodeURIComponent(String(s || "").replace(/[\\/]/g, "_"));
const pathOf = (obraId, id) => { const owner = ownerOf(obraId); return owner && obraId && id ? `${owner}/${seg(obraId)}/${seg(id)}` : ""; };
const qKey = (space, kind, id) => `${space}::${kind}::${id}`;
function dataUrlToBlob(u) {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(u || "");
  if (!m) return null;
  const type = m[1] || "application/octet-stream";
  if (!m[2]) return new Blob([decodeURIComponent(m[3])], { type });
  const bin = atob(m[3]), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}
const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });

export function enqueue(space, kind, id, obraId) {
  if (!space || !id || typeof indexedDB === "undefined") return Promise.resolve();
  return tx("readwrite", s => s.put({ space, kind, id, obraId: obraId || "", added: new Date().toISOString() }, qKey(space, kind, id)), QUEUE).then(paintSoon).catch(e => console.warn("Cua d'arxius", e));
}
// Documents de la pestanya Documents (es desen a «aco_documents_db»; aquí només es posen a la cua).
export const enqueueDoc = (space, id, obraId) => enqueue(space, "doc", id, obraId).then(kick);

// En obrir l'app: a la cua tot el que hi ha en aquest aparell i encara no s'ha pujat
// (p. ex. les fotos desades amb la V87.261, o el que no es va poder pujar sense cobertura).
export async function scanPending(space, odata, docExists) {
  if (!space || typeof indexedDB === "undefined") return;
  try {
    const done = new Set(await tx("readonly", s => s.getAllKeys(), DONE));
    const keys = await tx("readonly", s => s.getAllKeys(), STORE);
    for (const k of keys) {
      if (!String(k).startsWith(space + "::") || done.has(qKey(space, "fitxer", k.slice(space.length + 2)))) continue;
      const rec = await tx("readonly", s => s.get(k));
      if (rec?.obraId) await enqueue(space, "fitxer", k.slice(space.length + 2), rec.obraId);
    }
    for (const [obraId, obra] of Object.entries(odata || {})) for (const d of (obra?.documents || [])) {
      if (!d?.id || !d.hasFile || done.has(qKey(space, "doc", d.id))) continue;
      if (docExists && await docExists(d.id)) await enqueue(space, "doc", d.id, d.obraId || obraId);
    }
  } catch (e) { console.warn("Cua d'arxius", e); }
  kick();
}

let running = false, again = false, kickTimer = null, permanent = new Set();
export function kick(ms = 800) { clearTimeout(kickTimer); kickTimer = setTimeout(processQueue, ms); }
export async function processQueue() {
  if (running) { again = true; return; }
  const c = cloud(), space = activeSpace();
  if (!c?.storageUpload || !c.status?.().email || !space || typeof indexedDB === "undefined") { paintSoon(); return; }
  running = true;
  try {
    const items = (await tx("readonly", s => s.getAll(), QUEUE)).filter(x => x.space === space && !permanent.has(qKey(x.space, x.kind, x.id)));
    for (const it of items) {
      const path = pathOf(it.obraId, it.id);
      if (!path) continue;
      let blob = null;
      if (it.kind === "fitxer") { const rec = await tx("readonly", s => s.get(keyOf(space, it.id))); blob = rec ? dataUrlToBlob(rec.data) : null; }
      else if (it.kind === "doc" && window.__acoGetLocalDoc) blob = await window.__acoGetLocalDoc(it.id);
      const k = qKey(space, it.kind, it.id);
      if (!blob) { await tx("readwrite", s => s.delete(k), QUEUE); continue; } // ja no hi és: res a pujar
      try {
        await c.storageUpload(path, blob, blob.type || "application/octet-stream");
        await tx("readwrite", s => s.put(new Date().toISOString(), k), DONE);
        await tx("readwrite", s => s.delete(k), QUEUE);
      } catch (e) {
        if (e.offline) break; // sense cobertura: es torna a provar més tard
        if (e.status === 401 || e.status === 403 || e.status === 413) { permanent.add(k); console.warn("No es pot pujar", it.id, e.message); continue; }
        console.warn("Pujada d'arxiu", it.id, e.message);
      }
    }
  } catch (e) { console.warn("Cua d'arxius", e); }
  finally { running = false; paintSoon(); if (again) { again = false; kick(1500); } }
}

// Baixa del núvol els fitxers d'una obra que no són en aquest aparell (en obrir-la).
export async function fetchObraFiles(obraId, obra, space) {
  const found = new Map(), c = cloud();
  if (!obra || !space || !c?.storageDownload || !c.status?.().email || typeof indexedDB === "undefined") return found;
  const wanted = [];
  eachFile(obra, (item, field) => { if (!isData(item[field])) wanted.push([item.id, field]); });
  for (const [id, field] of wanted) {
    try {
      if (await tx("readonly", s => s.get(keyOf(space, id)))) continue; // ja hi és (el posa loadObraFiles)
      const path = pathOf(obraId, id);
      const blob = path ? await c.storageDownload(path) : null;
      if (!blob) continue;
      const data = await blobToDataUrl(blob);
      await tx("readwrite", s => s.put({ data, field, obraId, savedAt: new Date().toISOString(), baixat: true }, keyOf(space, id)));
      await tx("readwrite", s => s.put(new Date().toISOString(), qKey(space, "fitxer", id)), DONE);
      stored.set(keyOf(space, id), data.length);
      found.set(id, { field, data });
    } catch (e) { if (e.offline) break; console.warn("Baixada d'arxiu", id, e.message); }
  }
  return found;
}
// V87.265 · és al núvol? true / false; null si ara no es pot saber (sense connexió o sense sessió).
export async function cloudHasFile(obraId, id) {
  const c = cloud(), path = pathOf(obraId, id);
  if (!c?.storageDownload || !c.status?.().email || !path) return null;
  try { return !!(await c.storageDownload(path)); } catch { return null; }
}
// Document de la pestanya Documents que no és en aquest aparell.
export async function fetchDoc(id, obraId, space) {
  const c = cloud(), path = pathOf(obraId, id);
  if (!c?.storageDownload || !path) return null;
  const blob = await c.storageDownload(path);
  if (blob && space) await tx("readwrite", s => s.put(new Date().toISOString(), qKey(space, "doc", id)), DONE).catch(() => {});
  return blob;
}

// Rètol «X arxius pendents de pujar» (no surt si no n'hi ha cap).
let badge = null, paintTimer = null;
function paintSoon() { clearTimeout(paintTimer); paintTimer = setTimeout(paint, 300); }
async function paint() {
  if (typeof document === "undefined") return;
  let n = 0;
  try { const space = activeSpace(); n = space ? (await tx("readonly", s => s.getAll(), QUEUE)).filter(x => x.space === space).length : 0; } catch {}
  if (!badge) {
    badge = document.createElement("button");
    badge.type = "button"; badge.className = "files-badge-v878262";
    badge.addEventListener("click", () => kick(0));
    document.body.appendChild(badge);
  }
  badge.hidden = !n;
  badge.textContent = navigator.onLine === false
    ? (n === 1 ? t("1 arxiu pendent de pujar · sense connexió") : t("{n} arxius pendents de pujar · sense connexió", { n }))
    : (n === 1 ? t("Pujant 1 arxiu al núvol…") : t("Pujant {n} arxius al núvol…", { n }));
}
if (typeof window !== "undefined") {
  window.addEventListener("online", () => kick(500));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") kick(500); });
  setInterval(() => kick(0), 60000);
}
