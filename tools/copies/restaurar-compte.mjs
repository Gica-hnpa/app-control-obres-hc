// APP Control d'Obres · V87.260 · Restaurar UN compte del núvol a partir d'una còpia de copia-nuvol.mjs.
// El núvol d'aquest compte queda exactament igual que la còpia; la resta de comptes no es toquen.
//
//   node tools/copies/restaurar-compte.mjs <còpia\brava.json.gz>             (només ensenya què canviaria)
//   node tools/copies/restaurar-compte.mjs <còpia\brava.json.gz> --de-debo   (ho fa)
//
// Per escriure al compte d'un altre cal la clau secreta de Supabase (Project Settings → API Keys → secret,
// o la «service_role» antiga). Es demana en el moment, no es desa enlloc. Abans de canviar res es desa una
// còpia de com estava el compte al núvol (carpeta «restauracions», al costat de les còpies).
// Després, els aparells d'aquell compte reben les dades restaurades sols (guanya el núvol).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";
import readline from "node:readline";

const CONFIG = process.env.ACO_COPIA_CONFIG || path.join(os.homedir(), ".aco-copies", "config.json");
const URL_DEFAULT = "https://bdjendguvbevyowghzfh.supabase.co";

function ask(question, hidden = false) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = s => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, a => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a.trim()); });
  });
}
function hash(s) { s = String(s ?? ""); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ":" + s.length; }
function countObres(map) { for (const [k, v] of map) if (/__aco_obres$/.test(k)) { try { return JSON.parse(v).length; } catch { return 0; } } return 0; }

async function main() {
  const file = process.argv[2];
  const real = process.argv.includes("--de-debo");
  if (!file || file.startsWith("--")) throw new Error("Cal indicar el fitxer de la còpia, p. ex. ...\\COPIES_NUVOL\\2026-10-13\\brava.json.gz");
  const copy = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
  if (copy.tipus !== "copia-nuvol" || !copy.user_id || !Array.isArray(copy.files)) throw new Error("Aquest fitxer no és la còpia d'un compte.");
  let cfg = {}; try { cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8")); } catch {}
  const url = cfg.url || URL_DEFAULT;

  const key = process.env.ACO_CLAU_SECRETA || await ask("Clau secreta de Supabase (no es desa): ", true);
  if (!key) throw new Error("Sense la clau secreta no es pot restaurar.");
  // Clau secreta nova (sb_secret_…): només a «apikey». Clau service_role antiga: també a «Authorization».
  const headers = { apikey: key, "Content-Type": "application/json", ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }) };
  const api = async (p, opts = {}) => {
    const r = await fetch(url + p, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
    const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch {}
    if (!r.ok) throw new Error(j?.message || j?.msg || t || `Error ${r.status}`);
    return j;
  };

  // Com està ara el compte al núvol.
  const now = [];
  for (let off = 0; ; off += 200) {
    const rows = await api(`/rest/v1/aco_kv?select=key,value,deleted,device,updated_at&user_id=eq.${copy.user_id}&order=key.asc&limit=200&offset=${off}`);
    now.push(...rows); if (rows.length < 200) break;
  }
  const want = new Map(copy.files.filter(r => !r.deleted).map(r => [r.key, r.value ?? ""]));
  const have = new Map(now.filter(r => !r.deleted).map(r => [r.key, r.value ?? ""]));
  const write = [...want].filter(([k, v]) => !have.has(k) || hash(have.get(k)) !== hash(v)).map(([k, v]) => ({ key: k, value: v, deleted: false }));
  const remove = [...have.keys()].filter(k => !want.has(k)).map(k => ({ key: k, value: null, deleted: true }));

  console.log(`Compte: ${copy.compte}  (còpia del ${copy.data})`);
  console.log(`Ara al núvol: ${have.size} peces, ${countObres(have)} obres.  A la còpia: ${want.size} peces, ${countObres(want)} obres.`);
  console.log(`Canvis: ${write.length} peces a posar com a la còpia, ${remove.length} peces que no hi eren i es treuen.`);
  if (!write.length && !remove.length) { console.log("El núvol ja és igual que la còpia. No cal fer res."); return; }
  if (!real) { console.log("\nNo s'ha canviat res. Per fer-ho de debò, afegeix --de-debo al final."); return; }

  const confirm = process.env.ACO_CONFIRMAR || await ask(`Per confirmar, escriu el nom del compte (${copy.compte}): `);
  if (confirm !== copy.compte) throw new Error("No coincideix. No s'ha canviat res.");

  // Còpia de com estava, abans de tocar res.
  const dir = path.join(path.dirname(path.dirname(path.resolve(file))), "restauracions");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const before = path.join(dir, `${copy.compte}-ABANS-RESTAURAR-${stamp}.json.gz`);
  fs.writeFileSync(before, zlib.gzipSync(JSON.stringify({ app: "APP Control d'Obres", tipus: "copia-nuvol", versio: 1, data: new Date().toISOString(), compte: copy.compte, user_id: copy.user_id, files: now })));
  console.log(`Estat anterior desat a ${before}`);

  const rows = [...write, ...remove].map(r => ({ user_id: copy.user_id, ...r, device: "restauracio-copia" }));
  let batch = [], size = 0;
  const flush = async () => { if (!batch.length) return; await api("/rest/v1/aco_kv?on_conflict=user_id,key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(batch) }); batch = []; size = 0; };
  for (const r of rows) { const s = String(r.value || "").length; if (batch.length && size + s > 1500000) await flush(); batch.push(r); size += s; }
  await flush();

  // Comprovació final.
  const after = [];
  for (let off = 0; ; off += 200) {
    const rr = await api(`/rest/v1/aco_kv?select=key,value,deleted&user_id=eq.${copy.user_id}&order=key.asc&limit=200&offset=${off}`);
    after.push(...rr); if (rr.length < 200) break;
  }
  const live = new Map(after.filter(r => !r.deleted).map(r => [r.key, r.value ?? ""]));
  const ok = live.size === want.size && [...want].every(([k, v]) => live.has(k) && hash(live.get(k)) === hash(v));
  if (!ok) throw new Error("La comprovació final no quadra. Revisa-ho abans de tocar res més.");
  console.log(`Fet: el compte ${copy.compte} torna a estar com el ${copy.data} (${countObres(live)} obres). Els seus aparells s'actualitzaran sols.`);
}

main().catch(e => { console.error("ERROR:", e.message); process.exitCode = 1; });
