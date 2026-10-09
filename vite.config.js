import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
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
    if (saved?.storage) return send(res, 200, { mode: "fitxer", file: DATA_FILE, savedAt: saved.savedAt || "", device: saved.device || "", storage: saved.storage });
    const b = newestBackup();
    const backup = b ? readJson(path.join(DADES_DIR, b)) : null;
    if (backup?.storage) return send(res, 200, { mode: "copia", file: path.join(DADES_DIR, b), savedAt: backup.exportedAt || "", storage: backup.storage });
    return send(res, 200, { mode: "buit", file: DATA_FILE });
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
function dadesLocalsPlugin() {
  return {
    name: "aco-dades-locals",
    configureServer(server) { server.middlewares.use("/__dades-locals", handler); },
    configurePreviewServer(server) { server.middlewares.use("/__dades-locals", handler); }
  };
}

// ACO_SENSE_DISC=1 només per a proves: simula l'app publicada (sense desat a l'ordinador).
export default defineConfig({ base: "./", plugins: [react(), ...(process.env.ACO_SENSE_DISC === "1" ? [] : [dadesLocalsPlugin()])] });
