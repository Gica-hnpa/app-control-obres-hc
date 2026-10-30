// V87.442 · Obrir un programa de l'ordinador des de l'app (l'Héctor, 30/10/2026: «al CE3X em porta a la pàgina del Ministeri, però si jo ja
// el tinc pots entrar directament al programa?… això pot estar en una targeta on un altre tècnic pugui fer el mateix?»).
// Una pàgina web no pot engegar programes pel seu compte: l'usuari ho ha d'autoritzar una vegada en aquell ordinador. Per això l'app fa un
// arxiu .reg que registra, només per a l'usuari de Windows (HKCU, sense ser administrador), un protocol propi (`controlobres-<clau>:`) que
// obre aquell programa sense passar-li res. Després, un enllaç de l'app l'obre (el navegador pregunta «Obrir…?»). Cada ordinador té la seva
// ruta: es desa a l'aparell (no al núvol) i cada tècnic prepara el seu.
const KEY = "programes-pc-v878442";
export const DEFECTE = [{ k: "ce3x", nom: "CE3X", ruta: "C:\\Program Files (x86)\\CE3Xv3.2\\ce3xv3.2.exe", preparat: false }];

export const protocol = k => `controlobres-${k}`;
export const enllac = k => `${protocol(k)}:`;
export function clau(nom = "") {
  return String(nom).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "programa";
}
export function pcWindows() {
  try { return /Win/i.test(navigator.platform || navigator.userAgent || "") && window.matchMedia("(hover:hover) and (pointer:fine)").matches; } catch { return false; }
}
export function llegeix(ls) {
  try { const v = JSON.parse(ls?.getItem(KEY) || "null"); if (Array.isArray(v)) return v; } catch {}
  return DEFECTE.map(x => ({ ...x }));
}
export function desa(ls, llista) { try { ls?.setItem(KEY, JSON.stringify(llista)); } catch {} }
export function preparat(ls, k) { const p = llegeix(ls).find(x => x.k === k); return p?.preparat ? p : null; }
// Cada programa, amb una clau pròpia i sense repetir-ne cap
export function ambClau(llista = []) {
  const vist = new Set();
  return llista.map(p => { const base = p.k || clau(p.nom); let k = base, n = 2; while (vist.has(k)) k = base.slice(0, 22) + n++; vist.add(k); return { ...p, k }; });
}
export const rutaOk = r => /^[a-z]:\\[^"\r\n<>|?*]+\.exe$/i.test(String(r || "").trim());

const escReg = s => String(s).replace(/[\r\n]+/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
// El text de l'arxiu .reg: per a cada programa, el protocol i l'ordre que l'obre (sense arguments: l'enllaç no li passa res)
export function textReg(llista = [], { treure = false } = {}) {
  const parts = ["Windows Registry Editor Version 5.00", ""];
  for (const p of llista) {
    if (!rutaOk(p.ruta)) continue;
    const arrel = `HKEY_CURRENT_USER\\Software\\Classes\\${protocol(p.k)}`;
    if (treure) { parts.push(`[-${arrel}]`, ""); continue; }
    parts.push(`[${arrel}]`, `@="URL:Control d'Obres ${escReg(p.nom)}"`, `"URL Protocol"=""`, "", `[${arrel}\\shell\\open\\command]`, `@="${escReg(`"${p.ruta.trim()}"`)}"`, "");
  }
  return parts.join("\r\n");
}
// Windows vol els .reg amb accents en UTF-16 amb la marca al davant
export function blobReg(llista, op) {
  const t = textReg(llista, op), b = new Uint8Array(2 + t.length * 2);
  b[0] = 0xff; b[1] = 0xfe;
  for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); b[2 + i * 2] = c & 255; b[3 + i * 2] = c >> 8; }
  return new Blob([b], { type: "text/plain" });
}
