import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

// V87.252 · Desat al teu ordinador.
// Quan l'app s'obre amb OBRIR_APP.bat (npm run dev), totes les dades es guarden en
// un fitxer de la carpeta DADES (la que comparteixen totes les versions). Així,
// qualsevol versió nova que obris torna a mostrar exactament el que hi havies fet.
// A Render (versió publicada) aquest servidor no existeix i l'app funciona com sempre.
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DADES_DIR = path.resolve(process.env.ACO_DADES_DIR || path.join(ROOT, "..", "DADES"));
const DATA_FILE = path.join(DADES_DIR, "app-control-obres-DADES-LOCALS.json");
const AUTO_DIR = path.join(DADES_DIR, "COPIES_AUTOMATIQUES");
const KEEP_AUTO = 30;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); } catch { return null; }
}
function newestBackup() {
  try {
    return fs.readdirSync(DADES_DIR)
      .filter(f => /backup-complet.*\.json$/i.test(f))
      .map(f => ({ f, t: fs.statSync(path.join(DADES_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0]?.f || null;
  } catch { return null; }
}
function hasObres(storage = {}) {
  return Object.keys(storage).some(k => /(^|__)aco_obres$/.test(k) && String(storage[k] || "").length > 10);
}
function dailyCopy() {
  if (!fs.existsSync(DATA_FILE)) return;
  fs.mkdirSync(AUTO_DIR, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const target = path.join(AUTO_DIR, `dades-locals-${day}.json`);
  if (!fs.existsSync(target)) fs.copyFileSync(DATA_FILE, target);
  const all = fs.readdirSync(AUTO_DIR).filter(f => /^dades-locals-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  all.slice(0, Math.max(0, all.length - KEEP_AUTO)).forEach(f => { try { fs.unlinkSync(path.join(AUTO_DIR, f)); } catch {} });
}
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
// V87.256 · Diversos dispositius (PC, mòbil, tauleta) a la mateixa wifi.
// Cada dispositiu envia només les claus que ha canviat i el servidor les fusiona.
// Si dos dispositius han tocat la mateixa clau, guanya l'últim, però abans es
// guarda una còpia «conflicte-…json» a COPIES_AUTOMATIQUES.
function conflictCopy(prev) {
  try {
    fs.mkdirSync(AUTO_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    fs.writeFileSync(path.join(AUTO_DIR, `conflicte-${stamp}.json`), JSON.stringify(prev));
    const all = fs.readdirSync(AUTO_DIR).filter(f => /^conflicte-.*\.json$/.test(f)).sort();
    all.slice(0, Math.max(0, all.length - 10)).forEach(f => { try { fs.unlinkSync(path.join(AUTO_DIR, f)); } catch {} });
  } catch {}
}
function handler(req, res, next) {
  const url = (req.url || "").split("?")[0];
  if (req.method === "GET" && url === "/versio") {
    const saved = readJson(DATA_FILE);
    return send(res, 200, { savedAt: saved?.savedAt || "", device: saved?.device || "" });
  }
  if (req.method === "GET" && url === "/estat") {
    const saved = readJson(DATA_FILE);
    if (saved?.storage) return send(res, 200, { mode: "fitxer", file: DATA_FILE, savedAt: saved.savedAt || "", device: saved.device || "", forcarNuvol: !!saved.forcarNuvol, storage: saved.storage });
    const b = newestBackup();
    const backup = b ? readJson(path.join(DADES_DIR, b)) : null;
    if (backup?.storage) return send(res, 200, { mode: "copia", file: path.join(DADES_DIR, b), savedAt: backup.exportedAt || "", storage: backup.storage });
    return send(res, 200, { mode: "buit", file: DATA_FILE });
  }
  // V87.257.4 · treu la marca «forcarNuvol» un cop el núvol s'ha restaurat.
  if (req.method === "POST" && url === "/netejar-marca") {
    const saved = readJson(DATA_FILE);
    if (saved?.forcarNuvol) { delete saved.forcarNuvol; const tmp = DATA_FILE + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(saved)); fs.renameSync(tmp, DATA_FILE); }
    return send(res, 200, { ok: true });
  }
  if (req.method === "POST" && url === "/desar") {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        const prev = readJson(DATA_FILE);
        const device = String(body?.device || "");
        const keyMeta = { ...(prev?.keyMeta || {}) };
        let storage, touched = [];
        if (body?.changes && typeof body.changes === "object") {
          // Desat parcial: només les claus canviades.
          storage = { ...(prev?.storage || {}), ...body.changes };
          (Array.isArray(body.removed) ? body.removed : []).forEach(k => { delete storage[k]; });
          touched = [...Object.keys(body.changes), ...(Array.isArray(body.removed) ? body.removed : [])];
        } else {
          storage = body?.storage;
          if (!storage || typeof storage !== "object") return send(res, 400, { ok: false, error: "Dades buides" });
          touched = Object.keys(storage);
        }
        // Seguretat: mai substituir un fitxer amb obres per un sense obres.
        if (prev?.storage && hasObres(prev.storage) && !hasObres(storage)) {
          return send(res, 409, { ok: false, error: "S'ha bloquejat un desat sense expedients per no esborrar les dades." });
        }
        const base = String(body?.base || "");
        const conflicts = device && base ? touched.filter(k => keyMeta[k] && keyMeta[k].dev && keyMeta[k].dev !== device && keyMeta[k].t > base) : [];
        fs.mkdirSync(DADES_DIR, { recursive: true });
        dailyCopy();
        if (conflicts.length && prev) conflictCopy(prev);
        const savedAt = new Date().toISOString();
        touched.forEach(k => { keyMeta[k] = { t: savedAt, dev: device }; });
        Object.keys(keyMeta).forEach(k => { if (!(k in storage)) delete keyMeta[k]; });
        const tmp = DATA_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify({ app: "APP Control d'Obres", version: body.version || "", savedAt, device, storage, keyMeta }));
        fs.renameSync(tmp, DATA_FILE);
        send(res, 200, { ok: true, savedAt, file: DATA_FILE, conflicts, prevSavedAt: prev?.savedAt || "", prevDevice: prev?.device || "" });
      } catch (e) {
        send(res, 500, { ok: false, error: String(e?.message || e) });
      }
    });
    return;
  }
  next();
}
// V87.644 · Seguretat del servidor de l'ordinador (revisió de seguretat del 18/11/2026). Abans, qualsevol aparell de la mateixa wifi
// (amb OBRIR_APP_MOBIL.bat) podia llegir i canviar totes les dades, i una web oberta al navegador també ho podia provar. Ara:
//  · l'adreça (Host) ha de ser la de l'ordinador: localhost, 127.0.0.1 o una IP de la xarxa de casa (mai un nom de fora: evita que una
//    web «es disfressi» d'ordinador);
//  · si la petició diu d'on ve (Origin), ha de ser la mateixa pàgina de l'app;
//  · des d'un altre aparell de la xarxa, cal aparellar-lo un cop amb el codi de 6 xifres que surt a la finestra de l'ordinador; les claus
//    dels aparells es desen a DADES/.aco-aparells-wifi.json. Després de 10 codis equivocats, cal tornar a obrir el servidor.
const APARELLS_FILE = path.join(DADES_DIR, ".aco-aparells-wifi.json");
const aparells = new Set((readJson(APARELLS_FILE)?.tokens || []).filter(x => typeof x === "string" && x.length >= 32));
const CODI_APARELL = String(crypto.randomInt(100000, 1000000));
let errades = 0;
const esLocal = a => /^(::1|127\.|::ffff:127\.)/.test(String(a || ""));
const nomHost = h => String(h || "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
const hostOk = h => { const n = nomHost(h); return n === "localhost" || n === "127.0.0.1" || n === "::1" || /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(n); };
function guarda(req, res, next) {
  if (!hostOk(req.headers.host)) return send(res, 403, { ok: false, error: "host" });
  const o = req.headers.origin;
  if (o && o !== "null") { let oh = ""; try { oh = new URL(o).host; } catch {} if (oh !== req.headers.host) return send(res, 403, { ok: false, error: "origen" }); }
  if (esLocal(req.socket?.remoteAddress)) return handler(req, res, next);
  const url = (req.url || "").split("?")[0];
  if (req.method === "POST" && url === "/aparell") {
    const chunks = [];
    req.on("data", c => { if (chunks.length < 20) chunks.push(c); });
    req.on("end", () => {
      if (errades >= 10) return send(res, 429, { ok: false, error: "massa" });
      let codi = ""; try { codi = String(JSON.parse(Buffer.concat(chunks).toString("utf8"))?.codi || ""); } catch {}
      if (codi !== CODI_APARELL) { errades++; return send(res, 401, { ok: false, error: "codi" }); }
      const token = crypto.randomBytes(24).toString("hex");
      aparells.add(token);
      try { fs.mkdirSync(DADES_DIR, { recursive: true }); fs.writeFileSync(APARELLS_FILE, JSON.stringify({ tokens: [...aparells] })); } catch {}
      return send(res, 200, { ok: true, token });
    });
    return;
  }
  const t = String(req.headers["x-aco-aparell"] || "");
  if (!t || !aparells.has(t)) return send(res, 401, { ok: false, error: "aparell" });
  return handler(req, res, next);
}
function avisaCodi(server) {
  server.httpServer?.once("listening", () => setTimeout(() => {
    if (server.config.server?.host || server.config.preview?.host) server.config.logger.info(`\n  Codi per aparellar el mòbil (només el primer cop): ${CODI_APARELL}\n`);
  }, 400));
}
function dadesLocalsPlugin() {
  return {
    name: "aco-dades-locals",
    configureServer(server) { server.middlewares.use("/__dades-locals", guarda); avisaCodi(server); },
    configurePreviewServer(server) { server.middlewares.use("/__dades-locals", guarda); avisaCodi(server); }
  };
}

// V87.271 · App sense cobertura: en compilar, es genera sw.js (src/sw-template.js) amb la llista de tots els arxius de
// la versió (pàgina, codi, estils, lletres, icones). Només a la versió compilada (Render); OBRIR_APP.bat no en fa servir.
const PUBLIC_FILES = ["manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "icon-180.png"];
function offlinePlugin() {
  return {
    name: "aco-sense-cobertura",
    apply: "build",
    generateBundle(_options, bundle) {
      const files = ["./", "./index.html", ...Object.keys(bundle).filter(f => f !== "index.html" && !f.endsWith(".map")).map(f => "./" + f), ...PUBLIC_FILES.map(f => "./" + f)];
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
      let h = 0; for (const c of files.join("|")) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
      const version = `${pkg.version}-${(h >>> 0).toString(36)}`;
      const source = fs.readFileSync(path.join(ROOT, "src", "sw-template.js"), "utf8").replace("__VERSION__", version).replace("__FILES__", JSON.stringify(files));
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    }
  };
}

// V87.644 · Política de contingut (CSP) a l'app compilada (Render): el codi només pot venir de l'app mateixa i de Google (el permís del
// Gmail i del Calendar); res d'«eval», ni objectes, ni formularis cap a fora. Si algú aconseguís colar codi en un text, el navegador no
// l'executaria. Les connexions i les imatges poden anar a qualsevol adreça segura (Supabase, Google, Open-Meteo, els enllaços dels arxius)
// i a l'AutoFirma de l'ordinador. Al servidor de l'ordinador (OBRIR_APP.bat) no hi és: el Vite hi posa codi en línia.
// «frame-ancestors» (que l'app no es pugui posar dins d'una altra web) no es pot posar aquí: va a les capçaleres de Render
// (docs/capcaleres-render.md).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss: http://localhost:* http://127.0.0.1:* ws://127.0.0.1:* wss://127.0.0.1:* blob: data:",
  "frame-src 'self' blob: data: https:",
  "worker-src 'self' blob:",
  "media-src 'self' blob: data:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com"
].join("; ");
function cspPlugin() {
  return {
    name: "aco-csp",
    apply: "build",
    transformIndexHtml(html) { return html.replace(/<head>/i, `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`); }
  };
}

// ACO_SENSE_DISC=1 només per a proves: simula l'app publicada (sense desat a l'ordinador).
// ACO_VITE_CACHE: memòria cau pròpia (proves des d'una còpia de treball amb node_modules enllaçat, perquè no es trepitgin)
export default defineConfig({ base: "./", ...(process.env.ACO_VITE_CACHE ? { cacheDir: process.env.ACO_VITE_CACHE } : {}), plugins: [react(), offlinePlugin(), cspPlugin(), ...(process.env.ACO_SENSE_DISC === "1" ? [] : [dadesLocalsPlugin()])] });
