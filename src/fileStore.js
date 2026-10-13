// V87.261 · Fotos, croquis i documents de les actes: cada fitxer es desa a part en aquest aparell
// (IndexedDB «aco_fitxers»). El desat de les obres en treu les imatges per pes (stripHeavy878185),
// i fins ara no quedaven guardades enlloc: en recarregar l'app es perdien.
// La clau és «<espai>::<id del fitxer>» (espai = hector, emp_brava…), així els comptes no es barregen.
const DB = "aco_fitxers", STORE = "fitxers";
// Llistes de l'obra que porten fitxers, i el camp on hi ha el contingut.
const LISTS = { fotos: "src", croquis: "src", docs: "url" };
let dbPromise = null, persistAsked = false;
const stored = new Map(); // clau → mida ja desada en aquesta sessió (per no tornar-la a escriure)

function open() {
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode), req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = t.onabort = () => reject(t.error);
  });
}
const keyOf = (space, id) => `${space}::${id}`;
const isData = v => typeof v === "string" && /^data:/i.test(v);

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

// Abans de desar les obres: cada fitxer amb contingut va al seu lloc (només els que no hi són encara).
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
      .catch(e => { stored.delete(key); console.warn("No s'ha pogut desar el fitxer", item.nom || item.id, e); throw e; }));
  });
  if (jobs.length && !persistAsked) {
    persistAsked = true;
    // Demana al navegador que no esborri aquestes dades si li falta espai.
    try { navigator.storage?.persist?.(); } catch {}
  }
  return Promise.allSettled(jobs).then(r => r.filter(x => x.status === "rejected").length ? Promise.reject(new Error("Algun fitxer no s'ha pogut desar en aquest aparell.")) : jobs.length);
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
