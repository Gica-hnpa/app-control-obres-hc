// V87.271 · App sense cobertura. Aquest «service worker» guarda l'app (pàgina, codi, estils i icones) dins de
// l'aparell. Així l'app s'obre encara que no hi hagi cobertura, encara que no estigués oberta. Les dades ja eren a
// l'aparell (IndexedDB) i el núvol es posa al dia sol quan torna la connexió.
// - Pàgina (index.html): primer la xarxa (3 s com a molt) per tenir sempre la versió nova; si no hi ha connexió,
//   la que hi ha guardada.
// - Codi i estils (noms amb empremta, no canvien mai): primer el que hi ha guardat.
// - El núvol (Supabase) i el desat a l'ordinador no passen per aquí.
// El fitxer final el genera vite.config.js en compilar (llista d'arxius i versió).
const VERSION = "__VERSION__";
const CACHE = "aco-app-" + VERSION;
const FILES = __FILES__;
const KEEP = 2; // es guarda també la versió anterior: una pàgina oberta d'abans encara pot demanar-ne algun arxiu

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Un per un: si n'hi ha un que falla, la resta es guarden igualment.
    await Promise.all(FILES.map(f => cache.add(new Request(f, { cache: "reload" })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = (await caches.keys()).filter(n => n.startsWith("aco-app-") && n !== CACHE);
    // Les més velles fora; la immediatament anterior es queda.
    const old = names.sort().reverse().slice(KEEP - 1);
    await Promise.all(old.map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// «ignoreVary»: el servidor respon amb «Vary» i el navegador demana el codi amb una capçalera de més (Origin);
// sense això, la còpia guardada no es trobava i, sense cobertura, l'app no arrencava.
const MATCH = { ignoreVary: true };

function timeout(ms) { return new Promise((_, reject) => setTimeout(() => reject(new Error("temps")), ms)); }

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // núvol i altres: directes
  if (url.pathname.includes("/__dades-locals")) return;       // desat a l'ordinador: directe
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await Promise.race([fetch(req), timeout(3000)]);
        if (res && res.ok) { const c = await caches.open(CACHE); c.put("./index.html", res.clone()).catch(() => {}); }
        return res;
      } catch {
        return (await caches.match("./index.html", MATCH)) || (await caches.match(req, MATCH)) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const hit = await caches.match(req, MATCH);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === "basic") { const c = await caches.open(CACHE); c.put(req, res.clone()).catch(() => {}); }
      return res;
    } catch {
      return Response.error();
    }
  })());
});
