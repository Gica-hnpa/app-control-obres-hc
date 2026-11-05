// V87.514 · Caixa i bancs (proposta 7, l'Héctor, 5/11/2026: «sí a tot»; tanda 8, punt 22: «control de la caixa de l'empresa amb els bancs, sovint
// més d'un, i els apunts com un programa de comptabilitat de gestoria»). Funcions pures: llegir l'extracte del banc (Norma 43 de l'AEB / CSB o un
// CSV / Excel) i proposar amb quina factura o despesa va cada apunt.

const r2 = x => Math.round((Number(x) || 0) * 100) / 100;

// ───────────── Norma 43 (Quadern 43 de l'AEB) ─────────────
// 11 capçalera del compte · 22 apunt · 23 conceptes de l'apunt · 33 final del compte · 88 final del fitxer. Posicions fixes de 80 caràcters.
const CONCEPTES43 = { "01": "Talons", "02": "Abonaments", "03": "Rebuts", "04": "Transferència", "05": "Amortització", "06": "Remesa d'efectes",
  "07": "Subscripcions", "08": "Dividends", "09": "Valors", "10": "Carburant", "11": "Caixer", "12": "Targeta", "13": "Moneda estrangera",
  "14": "Devolució", "15": "Nòmina", "16": "Timbre", "17": "Interessos", "98": "Anul·lació", "99": "Altres" };
const data43 = s => /^\d{6}$/.test(s) ? `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}` : "";
const imp43 = (clau, s) => { const n = parseInt(String(s).trim() || "0", 10); return Number.isFinite(n) ? (clau === "1" ? -1 : 1) * n / 100 : 0; };
export function esNorma43(text = "") {
  const ls = String(text).split(/\r?\n/).filter(l => l.trim());
  return ls.length > 1 && /^11\d{18}/.test(ls[0]) && ls.some(l => /^22/.test(l));
}
export function llegirNorma43(text = "") {
  const comptes = []; let c = null, ap = null;
  for (const l0 of String(text).split(/\r?\n/)) {
    const l = l0.replace(/\s+$/, "").padEnd(80, " "), tipus = l.slice(0, 2);
    if (tipus === "11") {
      c = { entitat: l.slice(2, 6), oficina: l.slice(6, 10), compte: l.slice(10, 20), dataIni: data43(l.slice(20, 26)), dataFi: data43(l.slice(26, 32)),
        saldoIni: imp43(l[32], l.slice(33, 47)), divisa: l.slice(47, 50), nom: l.slice(51, 77).trim(), saldoFi: null, apunts: [] };
      comptes.push(c); ap = null;
    } else if (tipus === "22" && c) {
      const comu = l.slice(22, 24);
      ap = { data: data43(l.slice(10, 16)), valor: data43(l.slice(16, 22)), concepteComu: comu, import: imp43(l[27], l.slice(28, 42)),
        document: l.slice(42, 52).trim(), ref1: l.slice(52, 64).trim(), ref2: l.slice(64, 80).trim(), concepte: "", tipus: CONCEPTES43[comu] || "" };
      c.apunts.push(ap);
    } else if (tipus === "23" && ap) {
      const txt = [l.slice(4, 42), l.slice(42, 80)].map(x => x.trim()).filter(Boolean).join(" ");
      if (txt) ap.concepte = [ap.concepte, txt].filter(Boolean).join(" ");
    } else if (tipus === "33" && c) {
      c.saldoFi = imp43(l[58], l.slice(59, 73)); ap = null;
    }
  }
  for (const k of comptes) for (const a of k.apunts) if (!a.concepte) a.concepte = [a.tipus, a.ref2 || a.ref1].filter(Boolean).join(" · ") || "Apunt";
  return { comptes, avisos: comptes.length ? [] : ["No és un fitxer de la Norma 43"] };
}

// ───────────── CSV o Excel ─────────────
// files: [[cel·la…]…] (la primera fila amb títols reconeguts mana). Columnes: data, concepte, import (o càrrec i abonament), saldo.
const net = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
const COLS = {
  data: /^(f\.?\s*)?(data|fecha)( (d.)?operaci[oó]n?| contable| moviment| movimiento)?$|^date$|^fecha oper/,
  valor: /^(f\.?\s*)?(data|fecha) (de )?valor$|^valor$/,
  concepte: /^(concepte|concepto|descripci[oó]n?|moviment|movimiento|detall|detalle|observacions|observaciones)$/,
  import: /^(import|importe|quantitat|cantidad|amount|import \(eur\)|importe \(eur\)|importe eur|import eur)$/,
  carrec: /^(carrec|cargo|cargos|debe|deure|reintegro|disposicion)$/,
  abonament: /^(abonament|abono|abonos|haber|ingres|ingreso)$/,
  saldo: /^(saldo|saldo \(eur\)|saldo eur|disponible)$/,
};
export function numBanc(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v ?? "").replace(/[€\s]/g, "").replace(/EUR/i, "");
  if (!s) return null;
  const neg = /^\(.*\)$/.test(s) || /-$/.test(s); s = s.replace(/[()]/g, "").replace(/-$/, "");
  if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s); return Number.isFinite(n) ? (neg ? -Math.abs(n) : n) : null;
}
export function dataBanc(v) {
  if (typeof v === "number" && v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return d.toISOString().slice(0, 10); }
  const s = String(v ?? "").trim(); let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/))) { const a = m[3].length === 2 ? "20" + m[3] : m[3]; return `${a}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
  return "";
}
export function llegirFilesBanc(files = []) {
  let cap = -1, idx = null;
  for (let i = 0; i < Math.min(files.length, 30); i++) {
    const f = (files[i] || []).map(net), x = {};
    for (const [k, re] of Object.entries(COLS)) { const j = f.findIndex(c => re.test(c)); if (j >= 0) x[k] = j; }
    if (x.data != null && x.concepte != null && (x.import != null || x.carrec != null || x.abonament != null)) { cap = i; idx = x; break; }
  }
  if (cap < 0) return { apunts: [], avisos: ["No s’hi han trobat les columnes de data, concepte i import"] };
  const apunts = [];
  for (const f of files.slice(cap + 1)) {
    if (!f || !f.length) continue;
    const data = dataBanc(f[idx.data]); if (!data) continue;
    let imp = idx.import != null ? numBanc(f[idx.import]) : null;
    if (imp == null) { const c = idx.carrec != null ? numBanc(f[idx.carrec]) : null, a = idx.abonament != null ? numBanc(f[idx.abonament]) : null; if (c == null && a == null) continue; imp = (a || 0) - Math.abs(c || 0); }
    if (imp == null || Math.abs(imp) < 0.005) continue;
    apunts.push({ data, valor: idx.valor != null ? dataBanc(f[idx.valor]) || data : data, concepte: String(f[idx.concepte] ?? "").trim() || "Apunt", import: r2(imp),
      saldo: idx.saldo != null ? numBanc(f[idx.saldo]) : null });
  }
  return { apunts, avisos: apunts.length ? [] : ["No s’hi ha trobat cap apunt"] };
}

// ───────────── Aparellar ─────────────
// Un apunt amb el mateix import que una factura emesa pendent de cobrar (abonament) o que una despesa sense pagar (càrrec), i amb una data
// que s'hi pot correspondre (no abans de la factura, com a molt «dies» després). La clau de cada document, perquè no s'aparelli dues vegades.
export const clauApunt = a => [a.data, r2(a.import).toFixed(2), String(a.concepte || "").trim().toLowerCase().slice(0, 60), a.document || "", a.ref1 || ""].join("|");
const dies = (a, b) => (new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 864e5;
export function candidats(apunt, { factures = [], despeses = [], usats = new Set(), marge = 0.01, maxDies = 180 } = {}) {
  const imp = r2(apunt.import), out = [];
  const llista = imp > 0 ? factures.map(x => ({ ...x, tipus: "factura" })) : despeses.map(x => ({ ...x, tipus: "despesa" }));
  for (const x of llista) {
    if (usats.has(x.clau)) continue;
    if (Math.abs(r2(x.total) - Math.abs(imp)) > marge) continue;
    const d = x.data ? dies(apunt.data, x.data) : 0;
    if (x.data && (d < -5 || d > maxDies)) continue;
    out.push({ ...x, dies: Math.round(d) });
  }
  return out.sort((a, b) => Math.abs(a.dies) - Math.abs(b.dies));
}
// automàtic: només quan un apunt té un sol candidat i aquest candidat no el vol cap altre apunt
export function aparellaSols(apunts = [], docs = {}) {
  const usats = new Set(docs.usats || []), proposta = new Map(), perDoc = new Map();
  for (const a of apunts) {
    if (a.aparellat) continue;
    const c = candidats(a, { ...docs, usats });
    if (c.length === 1) { proposta.set(a.id, c[0]); perDoc.set(c[0].clau, (perDoc.get(c[0].clau) || 0) + 1); }
  }
  const out = [];
  for (const [id, c] of proposta) if (perDoc.get(c.clau) === 1) out.push({ apunt: id, doc: c });
  return out;
}
// el saldo de cada compte: el saldo inicial i els apunts des d'aquell dia
export function saldoCompte(c = {}, apunts = []) {
  const des = c.dataIni || "";
  return r2((Number(c.saldoIni) || 0) + apunts.filter(a => a.compte === c.id && (!des || a.data >= des)).reduce((s, a) => s + (Number(a.import) || 0), 0));
}
