// V87.408 · Signar un PDF amb el certificat digital amb l'AutoFirma, com els col·legis professionals (l'Héctor, 27/10/2026: «ha de ser
// signatures amb certificat digital sempre… que es faci amb AutoFirma com fan els col·legis d'arquitectes»).
// Com ho fa: la web obre l'AutoFirma de l'ordinador amb un enllaç «afirma://websocket?…» (el navegador pregunta «Obrir Autofirma?») i
// hi parla per un WebSocket segur local (wss://127.0.0.1:<port>; el certificat el posa l'instal·lador de l'AutoFirma). Protocol v4 del
// Cliente @firma: eco «echo=-idsession=…@EOF» → «OK»; la petició «afirma://sign?op=sign&…&dat=<PDF en base64>»; «#wait» mentre
// l'usuari tria el certificat i posa el PIN («getresult?idsession=…» cada 2 s); i la resposta «<certificat>|<PDF signat>» en base64.
// L'AutoFirma demana el certificat i el PIN: l'app no els veu mai. No passa res pel servidor.
// Només a l'ordinador (Windows, Mac, Linux): al mòbil i la tauleta no hi ha AutoFirma per a la web.

const MIN_PORT = 49152, MAX_PORT = 65535;
const ESPERA_ENTRE = 2000;          // entre intents de connexió i entre preguntes «getresult»
const ESPERA_MAX = 120000;          // l'AutoFirma (Java) pot trigar a obrir-se (a l'ordinador de l'Héctor, 30 s abans de respondre)
export const DESCARREGA = "https://firmaelectronica.gob.es/Home/Descargas.html";

const espera = ms => new Promise(r => setTimeout(r, ms));

export function potSignar() {
  try {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod|Android|Mobile/i.test(ua)) return false;
    if (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1) return false;   // iPad que es fa passar per Mac
    return typeof WebSocket !== "undefined";
  } catch { return false; }
}

// base64 de bytes (a trossos: els PDF poden fer uns quants MB)
export function aB64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function deB64(b64) {
  let s = String(b64 || "").replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  while (s.length % 4) s += "=";
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const urlSegur = b64 => b64.replace(/\+/g, "-").replace(/\//g, "_");

// Les propietats de la signatura (format de Java «clau=valor», una per línia). Els caràcters de fora de l'ASCII van com a \uXXXX:
// així arriben bé encara que l'AutoFirma no llegeixi el text en UTF-8.
export function propietats(obj) {
  const esc = v => String(v ?? "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/[^\x20-\x7e]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  return Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}=${esc(v)}`).join("\n");
}

function idSessio() {
  const c = "1234567890abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", r = new Uint32Array(20);
  crypto.getRandomValues(r);
  return [...r].map(x => c[x % c.length]).join("");
}
function portsAtzar() {
  const s = new Set();
  while (s.size < 3) s.add(MIN_PORT + Math.floor(Math.random() * (MAX_PORT - MIN_PORT)));
  return [...s];
}

// Obre l'AutoFirma. S'ha de cridar dins del toc del botó (el navegador no deixa obrir una app sense un gest de l'usuari).
// Les proves la substitueixen (window.__acoAfirmaObre878408) i fixen els ports (window.__acoAfirmaPorts878408).
export function obre() {
  const id = idSessio();
  const ports = Array.isArray(window.__acoAfirmaPorts878408) ? window.__acoAfirmaPorts878408 : portsAtzar();
  const url = `afirma://websocket?ports=${ports.join(",")}&v=4&jvc=4&idsession=${id}`;
  if (typeof window.__acoAfirmaObre878408 === "function") window.__acoAfirmaObre878408(url);
  else { const a = document.createElement("a"); a.href = url; a.style.display = "none"; document.body.appendChild(a); a.click(); a.remove(); }
  return { id, ports, t0: Date.now() };
}

// V87.411 · si el port no escolta, el navegador ho diu al moment; si escolta, la connexió segura de l'AutoFirma pot trigar molt la
// primera vegada (al registre de l'ordinador de l'Héctor, 30 s). Abans es tallava als 1,8 s i, en tallar-la, l'AutoFirma es tancava sola
// («Se ha cerrado la comunicacion… 1006 · Cerramos la aplicacion»): «No s'ha pogut obrir l'AutoFirma». Ara s'espera fins al final.
function intenta(port, ms = 1800) {
  return new Promise(res => {
    let ws;
    try { ws = new WebSocket(`wss://127.0.0.1:${port}`); } catch { res(null); return; }
    const fi = v => { clearTimeout(tm); ws.onopen = ws.onerror = ws.onclose = null; res(v); };
    const tm = setTimeout(() => { try { ws.close(); } catch {} fi(null); }, ms);
    ws.onopen = () => fi(ws);
    ws.onerror = ws.onclose = () => fi(null);
  });
}
async function connecta(ses, atura) {
  const max = +window.__acoAfirmaEspera878408 || ESPERA_MAX;   // les proves l'escurcen
  while (Date.now() - ses.t0 < max) {
    if (atura?.()) throw Object.assign(new Error("aturat"), { codi: "aturat" });
    for (const p of ses.ports) { const ws = await intenta(p, Math.max(3000, max - (Date.now() - ses.t0))); if (ws) return ws; }
    await espera(ESPERA_ENTRE);
  }
  throw Object.assign(new Error("No s’ha pogut obrir l’AutoFirma."), { codi: "noObre" });
}
const missatge = (ws, msg) => new Promise((res, rej) => {
  ws.onmessage = e => res(String(e.data));
  ws.onclose = () => rej(Object.assign(new Error("L’AutoFirma s’ha tancat."), { codi: "tancat" }));
  ws.send(msg);
});

// Signa un PDF (Uint8Array) en PAdES amb el certificat que l'usuari triï a l'AutoFirma.
// opcions: {ses (de obre()), props (objecte de propietats), onEstat(text), atura()}. Torna {pdf: Uint8Array, cert: Uint8Array}.
export async function signaPdf(pdf, { ses, props = {}, onEstat = () => {}, atura } = {}) {
  ses = ses || obre();
  onEstat("obrint");
  const ws = await connecta(ses, atura);
  try {
    const eco = await missatge(ws, `echo=-idsession=${ses.id}@EOF`);
    if (eco !== "OK") throw Object.assign(new Error(eco || "L’AutoFirma no respon."), { codi: "error" });
    onEstat("certificat");
    const parts = [["op", "sign"], ["idsession", ses.id], ["algorithm", "SHA256"], ["format", "PAdES"], ["properties", urlSegur(btoa(propietats(props)))], ["sticky", "false"], ["dat", urlSegur(aB64(pdf))]];
    let r = await missatge(ws, "afirma://sign?" + parts.map(([k, v]) => `${k}=${v}`).join("&"));
    while (r === "#wait") {
      if (atura?.()) throw Object.assign(new Error("aturat"), { codi: "aturat" });
      await espera(ESPERA_ENTRE);
      r = await missatge(ws, `getresult?idsession=${ses.id}`);
    }
    if (!r || r === "CANCEL" || /^err-11:/i.test(r)) throw Object.assign(new Error("S’ha cancel·lat a l’AutoFirma."), { codi: "cancel" });
    if (/^err-/i.test(r) && r.includes(":=")) {
      const m = r.slice(r.indexOf(":=") + 2).trim();
      throw Object.assign(new Error(m.indexOf(" - ") === 8 ? m.slice(11) : m), { codi: "error" });
    }
    if (r === "MEMORY_ERROR") throw Object.assign(new Error("El document és massa gran per a l’AutoFirma."), { codi: "error" });
    if (/^SAF_/.test(r) || r === "NULL") throw Object.assign(new Error("L’AutoFirma no ha pogut signar (" + r + ")."), { codi: "error" });
    const p = r.split("|");
    if (p.length < 2) throw Object.assign(new Error("Resposta de l’AutoFirma que no s’entén."), { codi: "error" });
    onEstat("rebut");
    return { cert: deB64(p[0]), pdf: deB64(p[1]) };
  } finally { try { ws.close(); } catch {} }
}
