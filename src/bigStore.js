// V87.258 · Més espai per a les dades.
// El navegador només deixa 5 MB al «localStorage» i l'app ja n'ocupava més del 85 %:
// quan s'omplia, els canvis (per exemple un pressupost importat) no es desaven.
// Aquest mòdul guarda les dades a IndexedDB (centenars de MB) i ofereix a l'app
// el mateix «localStorage» de sempre (getItem, setItem…), de manera que la resta
// del codi no canvia. La primera vegada hi copia el que hi havia al localStorage.
// Si IndexedDB no està disponible, l'app continua amb el localStorage normal.
const DB_NAME = "aco_app_storage", STORE = "kv", MIGRATED = "__migrat_des_de_localStorage";
let db = null, map = null, dirty = new Map(), timer = null, listeners = [];

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("IndexedDB bloquejat"));
  });
}
function readAll(d) {
  return new Promise((resolve, reject) => {
    const out = new Map();
    const tx = d.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).openCursor();
    req.onsuccess = () => { const c = req.result; if (c) { out.set(String(c.key), String(c.value)); c.continue(); } else resolve(out); };
    req.onerror = () => reject(req.error);
  });
}
function flush() {
  clearTimeout(timer); timer = null;
  if (!db || !dirty.size) return Promise.resolve();
  const batch = dirty; dirty = new Map();
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE, "readwrite"), st = tx.objectStore(STORE);
      batch.forEach((v, k) => { if (v === null) st.delete(k); else st.put(v, k); });
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => { console.warn("No s'ha pogut desar a IndexedDB", tx.error); batch.forEach((v, k) => { if (!dirty.has(k)) dirty.set(k, v); }); resolve(); };
    } catch (e) { console.warn("IndexedDB", e); resolve(); }
  });
}
function later() { if (!timer) timer = setTimeout(flush, 150); }
function emit(key) { listeners.forEach(fn => { try { fn(key); } catch (e) { console.warn(e); } }); }

const api = {
  getItem(k) { k = String(k); return map.has(k) ? map.get(k) : null; },
  setItem(k, v) { k = String(k); v = String(v); map.set(k, v); dirty.set(k, v); later(); emit(k); },
  removeItem(k) { k = String(k); if (!map.has(k)) return; map.delete(k); dirty.set(k, null); later(); emit(k); },
  clear() { [...map.keys()].forEach(k => dirty.set(k, null)); map.clear(); later(); emit(null); },
  key(i) { return [...map.keys()][i] ?? null; },
  get length() { return map.size; }
};
function makeProxy() {
  return new Proxy({}, {
    get(t, p) { if (p in api) { const v = api[p]; return typeof v === "function" ? v : api[p]; } if (p === Symbol.toStringTag) return "Storage"; return typeof p === "string" && map.has(p) ? map.get(p) : undefined; },
    set(t, p, v) { api.setItem(p, v); return true; },
    deleteProperty(t, p) { api.removeItem(p); return true; },
    has(t, p) { return p in api || map.has(p); },
    ownKeys() { return [...map.keys()]; },
    getOwnPropertyDescriptor(t, p) { return map.has(p) ? { value: map.get(p), enumerable: true, configurable: true, writable: true } : undefined; }
  });
}

export async function startBigStore() {
  if (typeof indexedDB === "undefined") return false;
  const real = window.localStorage;
  try {
    db = await openDb();
    map = await readAll(db);
    if (!map.has(MIGRATED)) {
      // Primera vegada: es copia tot el que hi ha al localStorage.
      for (let i = 0; i < real.length; i++) { const k = real.key(i); if (k != null && !map.has(k)) { const v = real.getItem(k); map.set(k, v); dirty.set(k, v); } }
      map.set(MIGRATED, new Date().toISOString()); dirty.set(MIGRATED, map.get(MIGRATED));
      await flush();
    }
    map.delete(MIGRATED);
    const proxy = makeProxy();
    Object.defineProperty(window, "localStorage", { configurable: true, get: () => proxy });
    if (window.localStorage !== proxy) throw new Error("No es pot substituir el localStorage");
    window.addEventListener("pagehide", () => { flush(); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
    window.__acoStore = { onChange: fn => listeners.push(fn), flush, size: () => { let n = 0; map.forEach((v, k) => { n += k.length + v.length; }); return n; }, real };
    return true;
  } catch (e) {
    console.warn("Es continua amb el localStorage normal:", e);
    db = null; map = null;
    return false;
  }
}
