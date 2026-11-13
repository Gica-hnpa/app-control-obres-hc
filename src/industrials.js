// V87.608 · Industrials: les ofertes dels industrials (o de les constructores) d'una obra, el comparatiu i passar l'adjudicada al pressupost
// (l'Héctor, 13/11/2026: «dins del pressupost… unes targetes de pressupostos d'industrials, una de comparatiu d'ofertes i, un cop adjudicades,
// automàticament a pressupost… i fer-ne el seguiment del pressupostat amb el certificat… comparatius entre ofertes del mateix capítol o capítols,
// o entre dues constructores que s'encarregaran de tot»). Aquí només la lògica (sense React); la pantalla és a App.jsx (Industrials878608).
//
// Oferta: {id, industrial, capitol ("" = tota l'obra), import, data, estat: "rebuda"|"adjudicada"|"descartada", linies:[{codi,cap,ut,concepte,q,pu}],
//          fitxer, notes, aplicada:{budgetId, at, partides:[ids]}, createdAt, updatedAt}

export const TOTA_OBRA = "";
const r2 = x => Math.round((Number(x) || 0) * 100) / 100;
export const num = v => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v ?? "").trim().replace(/\s|€/g, "");
  if (!s) return 0;
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
  return Number.isFinite(n) ? n : 0;
};
export const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
// el capítol sense el número del davant («02 PALETERIA» i «Paleteria» són el mateix)
export const normCap = s => norm(s).replace(/^\d+(\s\d+)*\s+/, "");
export const importLinies = o => r2((o?.linies || []).reduce((s, l) => s + num(l.q) * num(l.pu), 0));
export const importOferta = o => { const i = num(o?.import); return i > 0 ? r2(i) : importLinies(o); };

// les ofertes per grups: un per capítol i, a part, les de tota l'obra
export function grupsOfertes(ofertes = []) {
  const m = new Map();
  for (const o of ofertes) {
    const k = o.capitol ? normCap(o.capitol) : "__tota";
    if (!m.has(k)) m.set(k, { k, capitol: o.capitol || TOTA_OBRA, ofertes: [] });
    m.get(k).ofertes.push(o);
  }
  const out = [...m.values()];
  out.forEach(g => { g.ofertes.sort((a, b) => importOferta(a) - importOferta(b)); g.minim = g.ofertes.length ? importOferta(g.ofertes[0]) : 0; g.adjudicada = g.ofertes.find(o => o.estat === "adjudicada") || null; });
  return out.sort((a, b) => (a.k === "__tota") - (b.k === "__tota") || String(a.capitol).localeCompare(String(b.capitol), "ca", { numeric: true }));
}
// el que hi ha al pressupost d'aquell capítol (o de tota l'obra)
export function partidesCapitol(partides = [], capitol = TOTA_OBRA) {
  if (!capitol) return partides;
  const c = normCap(capitol);
  return partides.filter(p => normCap(p.cap) === c);
}
export const importPartides = ps => r2(ps.reduce((s, p) => s + num(p.q) * num(p.pu), 0));

// la clau per aparellar una línia d'oferta amb una partida: el codi o, si no n'hi ha, el concepte
const clauCodi = x => norm(x?.codi).replace(/\s/g, "");
const clauText = x => norm(x?.concepte).slice(0, 48);
function aparella(linia, partides, usades) {
  const c = clauCodi(linia), tx = clauText(linia);
  let p = c ? partides.find(x => !usades.has(x) && clauCodi(x) === c) : null;
  if (!p && tx) p = partides.find(x => !usades.has(x) && clauText(x) === tx);
  if (!p && tx.length > 12) p = partides.find(x => !usades.has(x) && (clauText(x).startsWith(tx.slice(0, 24)) || tx.startsWith(clauText(x).slice(0, 24))) && clauText(x).length > 12);
  if (p) usades.add(p);
  return p || null;
}

// El comparatiu d'un grup: una fila per partida (les del pressupost i les de les ofertes, aparellades per codi o concepte) i una columna per oferta.
// Sense línies, l'oferta només té el total (es compara el total del capítol).
export function comparatiu(ofertes = [], partides = [], capitol = TOTA_OBRA) {
  const base = partidesCapitol(partides, capitol);
  const files = base.map(p => ({ codi: p.codi || "", concepte: p.concepte || "", ut: p.ut || "", pres: { q: num(p.q), pu: num(p.pu), imp: r2(num(p.q) * num(p.pu)) }, of: ofertes.map(() => null), _p: p }));
  ofertes.forEach((o, j) => {
    const usades = new Set();
    for (const l of o.linies || []) {
      const p = aparella(l, base, usades);
      let f = p ? files.find(x => x._p === p) : null;
      if (!f) { f = files.find(x => !x._p && ((clauCodi(x) && clauCodi(x) === clauCodi(l)) || (!clauCodi(l) && clauText(x) === clauText(l)))); }
      if (!f) { f = { codi: l.codi || "", concepte: l.concepte || "", ut: l.ut || "", pres: null, of: ofertes.map(() => null), _p: null }; files.push(f); }
      f.of[j] = { q: num(l.q), pu: num(l.pu), imp: r2(num(l.q) * num(l.pu)) };
    }
  });
  files.forEach(f => { const v = f.of.map(x => x ? x.pu : null).filter(x => x != null && x > 0); f.millor = v.length > 1 ? Math.min(...v) : null; delete f._p; });
  const totals = ofertes.map(o => importOferta(o));
  const pres = importPartides(base);
  return { files, totals, pres, millor: totals.length ? Math.min(...totals.filter(x => x > 0)) : 0, ambLinies: ofertes.some(o => (o.linies || []).length) };
}

// Passar l'oferta adjudicada al pressupost (les partides d'un pressupost / fase). Les partides que coincideixen agafen el preu de l'oferta (la
// quantitat és la de l'obra); les línies que no hi són s'afegeixen al capítol; sense línies, una partida «a preu tancat» amb l'import.
// Les partides ja certificades no canvien de preu (canviaria l'import de les certificacions fetes).
export function aplicaOferta(partides = [], oferta, { budgetId = "principal", certificada = () => false, ara = new Date().toISOString(), nouId = () => "p-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) } = {}) {
  const dePres = p => (p.budgetId || "principal") === budgetId;
  const base = partidesCapitol(partides.filter(dePres), oferta.capitol);
  const origen = `Industrial: ${oferta.industrial || "—"}${oferta.data ? " · oferta del " + oferta.data.split("-").reverse().join("/") : ""}`;
  const canvis = new Map(), noves = [], ids = [];
  let fixes = 0, actualitzades = 0;
  const marca = p => ({ ...p, industrial878608: oferta.id, industrialNom878608: oferta.industrial || "", origenPreu878368: origen, updatedAt: ara });
  if ((oferta.linies || []).length) {
    const usades = new Set();
    for (const l of oferta.linies) {
      const p = aparella(l, base, usades);
      if (p) {
        if (certificada(p)) { fixes++; canvis.set(p, { ...p, industrial878608: oferta.id, industrialNom878608: oferta.industrial || "", updatedAt: ara }); ids.push(p.id); continue; }
        canvis.set(p, { ...marca(p), pu: num(l.pu), ...(num(p.q) > 0 ? {} : { q: num(l.q) }) }); actualitzades++; ids.push(p.id);
      } else {
        const id = nouId();
        noves.push(marca({ id, codi: l.codi || "", cap: l.cap || oferta.capitol || "", ut: l.ut || "", concepte: l.concepte || "", desc: "", q: num(l.q), pu: num(l.pu), budgetId, createdAt: ara }));
        ids.push(id);
      }
    }
  } else {
    const id = nouId(), cap = oferta.capitol || (base[0]?.cap || "");
    const nCap = base.filter(p => p.cap === cap).length + 1, pref = String(cap).match(/^\d+/)?.[0];
    noves.push(marca({ id, codi: pref ? `${pref}.${String(nCap).padStart(2, "0")}` : "", cap, ut: "pa", concepte: `${oferta.industrial || "Industrial"}${oferta.capitol ? " · " + String(oferta.capitol).replace(/^\d+\s*/, "") : ""} (preu tancat)`, desc: oferta.notes || "", q: 1, pu: importOferta(oferta), budgetId, createdAt: ara }));
    ids.push(id);
  }
  const out = partides.map(p => canvis.get(p) || p);
  // les noves, darrere de l'última partida del seu capítol
  for (const n of noves) {
    let i = -1; out.forEach((p, k) => { if (dePres(p) && normCap(p.cap) === normCap(n.cap)) i = k; });
    if (i >= 0) out.splice(i + 1, 0, n); else out.push(n);
  }
  return { partides: out, ids, actualitzades, noves: noves.length, fixes };
}

// Seguiment de cada oferta adjudicada: el que es va adjudicar, el que hi ha al pressupost, el certificat a origen i el que ha facturat l'industrial
export function seguiment(oferta, partides = [], { certificat = () => 0, factures = [] } = {}) {
  const ps = partides.filter(p => p.industrial878608 === oferta.id);
  const pres = importPartides(ps);
  const cert = r2(ps.reduce((s, p) => s + certificat(p), 0));
  const nom = norm(oferta.industrial);
  const fs = nom ? factures.filter(f => norm(f.proveidor) === nom || norm(f.proveidor).includes(nom) || nom.includes(norm(f.proveidor))) : [];
  const fact = r2(fs.reduce((s, f) => s + num(f.base), 0));
  return { adjudicat: importOferta(oferta), pres, cert, pct: pres > 0 ? Math.round(cert / pres * 1000) / 10 : 0, fact, factures: fs.length, pendent: r2(cert - fact), partides: ps.length };
}
