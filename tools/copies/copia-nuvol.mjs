// APP Control d'Obres · V87.260 · Còpia de seguretat del núvol a l'ordinador.
// Entra al núvol amb el compte de còpies (copies@usuaris.controlobres.app, que només pot LLEGIR),
// baixa les dades de tots els comptes i desa un fitxer comprimit per compte a cada carpeta de destí:
//   <destí>\AAAA-MM-DD\hector.json.gz, brava.json.gz, … , _obres-compartides.json.gz, _resum.json
// Es guarden les còpies diàries dels últims 30 dies i la del dia 1 de cada mes durant 12 mesos.
//
//   node tools/copies/copia-nuvol.mjs --configurar   (una sola vegada: demana la contrasenya i la desa xifrada)
//   node tools/copies/copia-nuvol.mjs                (fa la còpia; és el que engega el Programador de tasques)
//
// La configuració és fora del projecte (%USERPROFILE%\.aco-copies\config.json) i la contrasenya s'hi desa
// xifrada amb el compte de Windows (només es pot desxifrar amb aquest usuari en aquest ordinador).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";
import readline from "node:readline";
import { execFileSync } from "node:child_process";

const CONFIG = process.env.ACO_COPIA_CONFIG || path.join(os.homedir(), ".aco-copies", "config.json");
const DEFAULTS = {
  url: "https://bdjendguvbevyowghzfh.supabase.co",
  clau: "sb_publishable_-cl67_lhiPrWZBkbwTFA-Q__8iLboS9", // la mateixa clau pública de src/cloudConfig.js
  usuari: "copies@usuaris.controlobres.app",
  desti: [
    "D:\\00_CUBERO\\00_FEINA\\PROGRAMES\\APP GESTIO OBRES\\DADES\\COPIES_NUVOL",
    path.join(os.homedir(), "Documents", "COPIES_NUVOL"),
  ],
  diesDiaris: 30,
  mesosMensuals: 12,
};
const NS = /^aco_v8782__(.+?)__/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;

// ---------- configuració ----------
function readConfig() {
  let c = {};
  try { c = JSON.parse(fs.readFileSync(CONFIG, "utf8")); } catch (e) { if (e.code !== "ENOENT") throw new Error(`No es pot llegir ${CONFIG}: ${e.message}`); }
  return { ...DEFAULTS, ...c };
}
function powershell(script, input) {
  return execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], { input, encoding: "utf8", windowsHide: true });
}
const xifra = text => powershell("$s=[Console]::In.ReadToEnd(); ConvertTo-SecureString $s -AsPlainText -Force | ConvertFrom-SecureString", text).trim();
const desxifra = text => powershell("$p=ConvertTo-SecureString ([Console]::In.ReadToEnd().Trim()); [Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p)))", text);
function password(cfg) {
  if (cfg.contrasenya) return cfg.contrasenya; // només per a les proves amb el Supabase de proves
  if (!cfg.contrasenya_xifrada) throw new Error("Falta la contrasenya. Executa primer: node tools/copies/copia-nuvol.mjs --configurar");
  return desxifra(cfg.contrasenya_xifrada);
}
function askHidden(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = s => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, a => { rl.close(); process.stdout.write("\n"); resolve(a); });
  });
}

// ---------- núvol ----------
async function api(cfg, pathname, { method = "GET", body, token } = {}) {
  const headers = { apikey: cfg.clau, "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let r;
  try { r = await fetch(cfg.url + pathname, { method, headers, body: body == null ? undefined : JSON.stringify(body) }); }
  catch (e) { throw new Error(`No hi ha connexió amb el núvol (${e.message}).`); }
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch {}
  if (!r.ok) throw new Error(j?.msg || j?.message || j?.error_description || j?.error || t || `Error ${r.status}`);
  return j;
}
async function login(cfg, pass) {
  const j = await api(cfg, "/auth/v1/token?grant_type=password", { method: "POST", body: { email: cfg.usuari, password: pass } });
  return j.access_token;
}
async function readAll(cfg, token, table, select, order) {
  const out = [];
  for (let offset = 0; ; offset += 200) {
    const rows = await api(cfg, `/rest/v1/${table}?select=${select}&order=${order}&limit=200&offset=${offset}`, { token });
    out.push(...(rows || []));
    if (!rows || rows.length < 200) break;
  }
  return out;
}

// ---------- V87.262 · arxius (fotos, croquis, documents) ----------
// Es guarden a <destí>arxius<compte><obra><arxiu>, sense esborrar-ne mai cap; només es baixen els nous.
async function listAll(cfg, token, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = await api(cfg, "/storage/v1/object/list/aco-fitxers", { method: "POST", token, body: { prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } } });
    for (const x of rows || []) {
      if (x.id === null) out.push(...await listAll(cfg, token, prefix + x.name + "/"));
      else out.push({ path: prefix + x.name, size: x.metadata?.size ?? null });
    }
    if (!rows || rows.length < 1000) break;
  }
  return out;
}
async function mirrorFiles(cfg, token, roots) {
  const list = await listAll(cfg, token);
  let nous = 0, mida = 0;
  for (const it of list) {
    const targets = roots.map(root => path.join(root, "arxius", ...it.path.split("/"))).filter(p => { try { const st = fs.statSync(p); return it.size != null && st.size !== it.size; } catch { return true; } });
    if (!targets.length) continue;
    const r = await fetch(`${cfg.url}/storage/v1/object/authenticated/aco-fitxers/${it.path.split("/").map(encodeURIComponent).join("/")}`, { headers: { apikey: cfg.clau, Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`No s'ha pogut baixar ${it.path} (${r.status})`);
    const buf = Buffer.from(await r.arrayBuffer());
    for (const t of targets) { fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t + ".part", buf); fs.renameSync(t + ".part", t); }
    nous++; mida += buf.length;
  }
  return { total: list.length, nous, mida, ocupat: list.reduce((s, it) => s + (it.size || 0), 0) };
}

// ---------- fitxers ----------
function accountName(rows) {
  const count = {};
  for (const r of rows) { const m = r.key.match(NS); if (m) count[m[1]] = (count[m[1]] || 0) + 1; }
  const emp = Object.keys(count).find(n => n.startsWith("emp_"));
  if (emp) return emp.slice(4);
  const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}
function countObres(rows) {
  const r = rows.find(x => !x.deleted && /__aco_obres$/.test(x.key));
  try { return JSON.parse(r.value).length; } catch { return 0; }
}
function gz(obj) { return zlib.gzipSync(Buffer.from(JSON.stringify(obj), "utf8"), { level: 9 }); }
function buildFiles(kv, shared, when) {
  const byUser = new Map();
  for (const r of kv) { if (!byUser.has(r.user_id)) byUser.set(r.user_id, []); byUser.get(r.user_id).push(r); }
  const files = {}, resum = { data: when, comptes: [], obresCompartides: shared.length };
  const used = new Set();
  for (const [userId, rows] of byUser) {
    let name = (accountName(rows) || userId.slice(0, 8)).replace(/[^a-z0-9._-]/gi, "_");
    if (used.has(name)) name += "-" + userId.slice(0, 8);
    used.add(name);
    const files_ = rows.map(({ user_id, ...rest }) => rest);
    files[`${name}.json.gz`] = gz({ app: "APP Control d'Obres", tipus: "copia-nuvol", versio: 1, data: when, compte: name, user_id: userId, files: files_ });
    resum.comptes.push({ compte: name, user_id: userId, peces: rows.filter(r => !r.deleted).length, esborrades: rows.filter(r => r.deleted).length, obres: countObres(rows), mida: rows.reduce((s, r) => s + String(r.value || "").length, 0) });
  }
  files["_obres-compartides.json.gz"] = gz({ app: "APP Control d'Obres", tipus: "copia-nuvol-compartides", versio: 1, data: when, files: shared });
  resum.comptes.sort((a, b) => a.compte.localeCompare(b.compte));
  files["_resum.json"] = Buffer.from(JSON.stringify(resum, null, 2), "utf8");
  return { files, resum };
}
function writeCopy(root, day, files) {
  fs.mkdirSync(root, { recursive: true });
  const tmp = path.join(root, `.${day}-en-curs-${process.pid}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp);
  for (const [name, buf] of Object.entries(files)) {
    const f = path.join(tmp, name);
    fs.writeFileSync(f, buf);
    // Comprovació: el fitxer desat es pot tornar a llegir sencer.
    const back = fs.readFileSync(f);
    JSON.parse(name.endsWith(".gz") ? zlib.gunzipSync(back).toString("utf8") : back.toString("utf8"));
  }
  const final = path.join(root, day);
  if (fs.existsSync(final)) { const old = path.join(root, `.${day}-anterior-${process.pid}`); fs.renameSync(final, old); fs.renameSync(tmp, final); fs.rmSync(old, { recursive: true, force: true }); }
  else fs.renameSync(tmp, final);
  return final;
}
// Neteja: es queden els últims `diesDiaris` dies, el dia 1 de cada mes durant `mesosMensuals` mesos
// i, passi el que passi, les 3 còpies més noves. Només es toquen carpetes amb nom de data.
function prune(root, today, cfg) {
  const days = fs.readdirSync(root).filter(n => DIA.test(n) && fs.statSync(path.join(root, n)).isDirectory()).sort().reverse();
  const t0 = Date.parse(today + "T00:00:00Z"), removed = [];
  days.forEach((d, i) => {
    const age = (t0 - Date.parse(d + "T00:00:00Z")) / 86400000;
    const keep = i < 3 || age <= cfg.diesDiaris || (d.endsWith("-01") && age <= cfg.mesosMensuals * 31);
    if (!keep) { fs.rmSync(path.join(root, d), { recursive: true, force: true }); removed.push(d); }
  });
  return removed;
}
function log(root, line) { try { fs.mkdirSync(root, { recursive: true }); fs.appendFileSync(path.join(root, "registre.txt"), line + "\r\n"); } catch {} }
function mb(n) { return (n / 1048576).toFixed(1) + " MB"; }

// ---------- programa ----------
async function configurar() {
  const cfg = readConfig();
  console.log(`Configuració de la còpia del núvol\nCompte: ${cfg.usuari}\nDestins:\n  ${cfg.desti.join("\n  ")}`);
  const pass = await askHidden("Contrasenya del compte de còpies: ");
  if (!pass) throw new Error("No s'ha escrit cap contrasenya.");
  await login(cfg, pass);
  console.log("Contrasenya correcta.");
  const saved = (() => { try { return JSON.parse(fs.readFileSync(CONFIG, "utf8")); } catch { return {}; } })();
  delete saved.contrasenya;
  fs.mkdirSync(path.dirname(CONFIG), { recursive: true });
  fs.writeFileSync(CONFIG, JSON.stringify({ ...saved, usuari: cfg.usuari, contrasenya_xifrada: xifra(pass) }, null, 2));
  console.log(`Desada (xifrada) a ${CONFIG}`);
}
async function copia() {
  const cfg = readConfig();
  const now = new Date(), when = now.toISOString();
  const day = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const stamp = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16).replace("T", " ");
  let files, resum, token;
  try {
    token = await login(cfg, password(cfg));
    const kv = await readAll(cfg, token, "aco_kv", "user_id,key,value,deleted,device,updated_at", "user_id.asc,key.asc");
    const shared = await readAll(cfg, token, "aco_shared", "*", "obra_id.asc");
    // Si no es llegeix res, segurament falta la regla SQL o el compte no és el de còpies:
    // no es desa res i, sobretot, no s'esborren les còpies antigues.
    const users = new Set(kv.map(r => r.user_id));
    if (!kv.length) throw new Error("No s'ha llegit cap dada. Comprova la regla SQL aco_copies_v87260.sql i el compte de còpies.");
    if (users.size < 2) throw new Error(`Només es veu ${users.size} compte. Comprova la regla SQL aco_copies_v87260.sql.`);
    ({ files, resum } = buildFiles(kv, shared, when));
  } catch (e) {
    for (const root of cfg.desti) log(root, `${stamp}  ERROR  ${e.message}`);
    console.error("ERROR:", e.message);
    process.exitCode = 1;
    return;
  }
  const total = resum.comptes.reduce((s, c) => s + c.mida, 0);
  const text = resum.comptes.map(c => `${c.compte} (${c.obres} obres, ${mb(c.mida)})`).join(", ");
  for (const root of cfg.desti) {
    try {
      const dir = writeCopy(root, day, files);
      const removed = prune(root, day, cfg);
      log(root, `${stamp}  OK  ${resum.comptes.length} comptes, ${resum.obresCompartides} obres compartides, ${mb(total)}: ${text}${removed.length ? `  · netejades: ${removed.join(", ")}` : ""}`);
      console.log(`OK  ${dir}`);
    } catch (e) {
      log(root, `${stamp}  ERROR  ${e.message}`);
      console.error(`ERROR a ${root}: ${e.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`${resum.comptes.length} comptes: ${text}`);
  // Arxius: a part, perquè un problema amb els arxius no impedeixi la còpia de les dades.
  try {
    const roots = cfg.desti.filter(root => fs.existsSync(root));
    const m = await mirrorFiles(cfg, token, roots);
    for (const root of roots) log(root, `${stamp}  OK  arxius: ${m.total} al núvol (${mb(m.ocupat)} de 1 GB), ${m.nous} nous (${mb(m.mida)})`);
    console.log(`Arxius: ${m.total} al núvol, ${m.nous} nous`);
  } catch (e) {
    for (const root of cfg.desti) log(root, `${stamp}  ERROR  arxius: ${e.message}`);
    console.error("ERROR arxius:", e.message);
    process.exitCode = 1;
  }
}

(process.argv.includes("--configurar") ? configurar() : copia()).catch(e => { console.error("ERROR:", e.message); process.exitCode = 1; });
