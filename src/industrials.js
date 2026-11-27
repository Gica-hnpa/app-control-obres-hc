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
// V87.671 · sense els zeros del davant de cada número: la «P1» d'una oferta és la «P01» de l'altra (i «A9» = «A09», «05.01» = «5.1»)
// (el codi que l'app ha posat sola en llegir el PDF, «codiAuto», no compta: dues ofertes sense codis tindrien totes dues 01.01, 01.02…)
const clauCodi = x => x?.codiAuto ? "" : norm(x?.codi).split(" ").filter(Boolean).map(p => p.replace(/(^|[a-z])0+(?=\d)/g, "$1")).join(".");
const clauText = x => norm(x?.concepte).slice(0, 48);
const comu = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
// V87.612 · sense codi ni text igual, només la partida que s'hi assembla de debò (el principi comú ha de ser gairebé tot el text més curt):
// abans n'hi havia prou amb els 24 primers caràcters i «Paviment … interior» i «Paviment … exterior» es podien creuar
function aparella(linia, partides, usades) {
  const c = clauCodi(linia), tx = clauText(linia);
  let p = c ? partides.find(x => !usades.has(x) && clauCodi(x) === c) : null;
  if (!p && tx) p = partides.find(x => !usades.has(x) && clauText(x) === tx);
  if (!p && tx.length > 12) {
    let millor = null, punts = 0;
    for (const x of partides) {
      const tx2 = clauText(x); if (usades.has(x) || tx2.length <= 12) continue;
      const n = comu(tx, tx2), r = n / Math.min(tx.length, tx2.length);
      if (n >= 24 && r >= 0.9 && r > punts) { millor = x; punts = r; }
    }
    p = millor;
  }
  if (p) usades.add(p);
  return p || null;
}
// V87.612 · una línia sense preu (llegida del PDF o «Omplir amb les partides del pressupost» a mig fer) no és cap preu: al comparatiu surt
// «Sense preu» (no 0 €) i en adjudicar no toca la partida del pressupost
const tePreu = l => num(l?.pu) > 0;

// El comparatiu d'un grup: una fila per partida (les del pressupost i les de les ofertes, aparellades per codi o concepte) i una columna per oferta.
// Sense línies, l'oferta només té el total (es compara el total del capítol).
export function comparatiu(ofertes = [], partides = [], capitol = TOTA_OBRA) {
  const base = partidesCapitol(partides, capitol);
  const files = base.map(p => ({ codi: p.codi || "", concepte: p.concepte || "", ut: p.ut || "", pres: { q: num(p.q), pu: num(p.pu), imp: r2(num(p.q) * num(p.pu)) }, of: ofertes.map(() => null), sp: ofertes.map(() => false), _p: p }));
  ofertes.forEach((o, j) => {
    const usades = new Set();
    for (const l of o.linies || []) {
      const p = aparella(l, base, usades);
      let f = p ? files.find(x => x._p === p) : null;
      if (!f) { f = files.find(x => !x._p && ((clauCodi(x) && clauCodi(x) === clauCodi(l)) || (!clauCodi(l) && clauText(x) === clauText(l)))); }
      if (!f) { if (!tePreu(l)) continue; f = { codi: l.codi || "", concepte: l.concepte || "", ut: l.ut || "", pres: null, of: ofertes.map(() => null), sp: ofertes.map(() => false), _p: null }; files.push(f); }
      if (tePreu(l)) f.of[j] = { q: num(l.q), pu: num(l.pu), imp: r2(num(l.q) * num(l.pu)) };
      else if (!f.of[j]) f.sp[j] = true;
    }
  });
  // V87.611 · la més cara de cada partida (en vermell) i, per a cada oferta amb partides, quantes del pressupost no inclou (o no tenen preu)
  files.forEach(f => { const v = f.of.map(x => x ? x.pu : null).filter(x => x != null && x > 0); f.millor = v.length > 1 ? Math.min(...v) : null; f.pitjor = v.length > 1 && Math.max(...v) - Math.min(...v) > 0.005 ? Math.max(...v) : null; delete f._p; });
  const totals = ofertes.map(o => importOferta(o));
  const pres = importPartides(base);
  const ambL = ofertes.map(o => (o.linies || []).length > 0);
  const noIncl = ofertes.map((o, j) => ambL[j] ? files.filter(f => f.pres && !f.of[j]).length : 0);
  const sensePreu = ofertes.map((o, j) => files.filter(f => f.sp[j] && !f.of[j]).length);
  return { files, totals, pres, millor: totals.length ? Math.min(...totals.filter(x => x > 0)) : 0, ambLinies: ambL.some(Boolean), ambL, noIncl, sensePreu };
}
export const liniesSensePreu = o => (o?.linies || []).filter(l => !tePreu(l)).length;

// V87.611 · «Omplir amb les partides del pressupost»: les partides del capítol (o de tota l'obra) amb la quantitat de l'obra i el preu buit,
// per escriure-hi els preus de l'oferta quan el PDF no es pot llegir
export const liniesPressupost = (partides = [], capitol = TOTA_OBRA) =>
  partidesCapitol(partides, capitol).map(p => ({ codi: p.codi || "", cap: p.cap || "", ut: p.ut || "", concepte: p.concepte || "", q: num(p.q), pu: "" }));

// Passar l'oferta adjudicada al pressupost (les partides d'un pressupost / fase). Les partides que coincideixen agafen el preu de l'oferta (la
// quantitat és la de l'obra); les línies que no hi són s'afegeixen al capítol. Les partides ja certificades no canvien de preu (canviaria
// l'import de les certificacions fetes); les línies sense preu no toquen res.
// V87.612 · Oferta a preu tancat (sense línies): les partides del capítol (o de tota l'obra) s'ajusten en proporció perquè sumin l'import de
// l'oferta (abans s'hi afegia una partida «pa» i el capítol sortia dues vegades); només si el capítol no té cap partida amb import, una «pa».
// Adjudicar una altra oferta del mateix grup (`altres`: les seves ofertes) treu les partides que hi havien afegit les altres (si no estan
// certificades): així no s'acumulen.
// V87.666 · `marge` (%): el que es carrega sobre els preus de l'industrial en passar-los al pressupost (l'Héctor, 26/11/2026: «l'únic que ha de
// deixar posar el % de marge que se li vol carregar sobre el pressupost origen; 0 % si el que ens envien ja l'hi ha afegit»).
export function aplicaOferta(partides = [], oferta, { budgetId = "principal", certificada = () => false, ara = new Date().toISOString(), nouId = () => "p-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), altres = [], marge = 0 } = {}) {
  const mg = 1 + (Number(marge) || 0) / 100, ambMarge = x => Math.round(num(x) * mg * 10000) / 10000;
  const dePres = p => (p.budgetId || "principal") === budgetId;
  const alt = new Set(altres.filter(id => id && id !== oferta.id));
  const treure = new Set(partides.filter(p => dePres(p) && p.afegidaInd878612 && (alt.has(p.afegidaInd878612) || p.afegidaInd878612 === oferta.id) && !certificada(p)));
  const vives = partides.filter(p => !treure.has(p));
  const base = partidesCapitol(vives.filter(dePres), oferta.capitol);
  const origen = `Industrial: ${oferta.industrial || "—"}${oferta.data ? " · oferta del " + oferta.data.split("-").reverse().join("/") : ""}${Number(marge) ? " · marge " + String(marge).replace(".", ",") + " %" : ""}`;
  const canvis = new Map(), noves = [], ids = [];
  let fixes = 0, actualitzades = 0, sensePreu = 0, factor = null;
  const marca = p => ({ ...p, industrial878608: oferta.id, industrialNom878608: oferta.industrial || "", origenPreu878368: origen, updatedAt: ara });
  const nova = p => ({ ...marca(p), afegidaInd878612: oferta.id });
  if ((oferta.linies || []).length) {
    const usades = new Set();
    for (const l of oferta.linies) {
      const p = aparella(l, base, usades);
      if (!tePreu(l)) { sensePreu++; continue; }
      if (p) {
        if (certificada(p)) { fixes++; canvis.set(p, { ...p, industrial878608: oferta.id, industrialNom878608: oferta.industrial || "", updatedAt: ara }); ids.push(p.id); continue; }
        canvis.set(p, { ...marca(p), pu: ambMarge(l.pu), ...(num(p.q) > 0 ? {} : { q: num(l.q) }) }); actualitzades++; ids.push(p.id);
      } else {
        const id = nouId();
        noves.push(nova({ id, codi: l.codi || "", cap: oferta.capitol || l.cap || "", ut: l.ut || "", concepte: l.concepte || "", desc: "", q: num(l.q), pu: ambMarge(l.pu), budgetId, createdAt: ara }));
        ids.push(id);
      }
    }
  } else {
    const total = r2(importOferta(oferta) * mg);
    const fixesP = base.filter(p => certificada(p)), varP = base.filter(p => !certificada(p) && num(p.q) * num(p.pu) > 0);
    const fix = importPartides(fixesP), vari = importPartides(varP), objectiu = r2(total - fix);
    if (vari > 0 && objectiu > 0) {
      factor = objectiu / vari;
      let acc = 0;
      varP.forEach((p, k) => {
        let pu = r2(num(p.pu) * factor);
        // l'última s'ajusta perquè el total quadri al cèntim (si la quantitat ho permet)
        // (amb quatre decimals si cal: amb dos, 30 m² podien deixar el total 15 cèntims curt)
        if (k === varP.length - 1) { const q = num(p.q); const resta = r2(objectiu - acc); if (q > 0) { let pu2 = r2(resta / q); if (Math.abs(q * pu2 - resta) > 0.005) pu2 = Math.round(resta / q * 10000) / 10000; if (Math.abs(pu2 - pu) < Math.max(1, pu * 0.05)) pu = pu2; } }
        acc = r2(acc + num(p.q) * pu);
        canvis.set(p, { ...marca(p), pu, origenPreu878368: `${origen} · preu tancat (×${String(Math.round(factor * 10000) / 10000).replace(".", ",")})` });
        actualitzades++; ids.push(p.id);
      });
      fixesP.forEach(p => { canvis.set(p, { ...p, industrial878608: oferta.id, industrialNom878608: oferta.industrial || "", updatedAt: ara }); fixes++; ids.push(p.id); });
    } else if (!base.length || vari <= 0 && !fixesP.length) {
      const id = nouId(), cap = oferta.capitol || (base[0]?.cap || "");
      const nCap = base.filter(p => p.cap === cap).length + 1, pref = String(cap).match(/^\d+/)?.[0];
      noves.push(nova({ id, codi: pref ? `${pref}.${String(nCap).padStart(2, "0")}` : "", cap, ut: "pa", concepte: `${oferta.industrial || "Industrial"}${oferta.capitol ? " · " + String(oferta.capitol).replace(/^\d+\s*/, "") : ""} (preu tancat)`, desc: oferta.notes || "", q: 1, pu: total, budgetId, createdAt: ara }));
      ids.push(id);
    } else { fixesP.forEach(p => { fixes++; ids.push(p.id); }); }
  }
  const out = vives.map(p => canvis.get(p) || p);
  // les noves, darrere de l'última partida del seu capítol
  for (const n of noves) {
    let i = -1; out.forEach((p, k) => { if (dePres(p) && normCap(p.cap) === normCap(n.cap)) i = k; });
    if (i >= 0) out.splice(i + 1, 0, n); else out.push(n);
  }
  return { partides: out, ids, actualitzades, noves: noves.length, fixes, sensePreu, factor, trets: treure.size };
}

// Seguiment de cada oferta adjudicada: el que es va adjudicar, el que hi ha al pressupost, el certificat a origen i el que ha facturat l'industrial
// V87.612 · el facturat, només amb les despeses del mateix proveïdor (sense proveïdor no compta; «SL», «S.L.»… no compten per comparar) i sense
// els albarans que ja cobreix una factura (els treu qui crida)
const FORMES = new Set(["sl", "slu", "sa", "sau", "scp", "cb", "sll", "s", "l", "u", "a", "slp", "coop", "sccl"]);
const paraules = s => norm(s).split(" ").filter(x => x && !FORMES.has(x));
export function mateixProveidor(a, b) {
  const x = paraules(a), y = paraules(b);
  if (!x.length || !y.length) return false;
  const [curt, llarg] = x.length <= y.length ? [x, y] : [y, x];
  // totes les paraules del nom curt al llarg, i amb dues paraules com a mínim o el mateix nombre (sol, «Prova» no casa amb «Electricitat Prova»)
  return curt.every(w => llarg.includes(w)) && (curt.length >= 2 || curt.length === llarg.length);
}
export function seguiment(oferta, partides = [], { certificat = () => 0, factures = [] } = {}) {
  const ps = partides.filter(p => p.industrial878608 === oferta.id);
  const pres = importPartides(ps);
  const cert = r2(ps.reduce((s, p) => s + certificat(p), 0));
  const fs = factures.filter(f => mateixProveidor(oferta.industrial, f.proveidor));
  const fact = r2(fs.reduce((s, f) => s + num(f.base), 0));
  return { adjudicat: importOferta(oferta), pres, cert, pct: pres > 0 ? Math.round(cert / pres * 1000) / 10 : 0, fact, factures: fs.length, pendent: r2(cert - fact), partides: ps.length };
}

// V87.666 · La capçalera d'una oferta en PDF (l'Héctor, 26/11/2026: «no em detecta ni l'industrial ni la data del pressupost ni les altres dades»):
// l'empresa (la que porta S.A., S.L.… a les primeres línies, o la d'un contacte amb el mateix NIF), el NIF, la data, el número i l'obra o
// referència. `propis`: els noms i el NIF de la nostra empresa, que no són l'industrial (surten com a destinatari). `contactes`: [{nom, nif}].
const MESOS = { gener: 1, enero: 1, febrer: 2, febrero: 2, març: 3, marc: 3, marzo: 3, abril: 4, maig: 5, mayo: 5, juny: 6, junio: 6, juliol: 7, julio: 7, agost: 8, agosto: 8, setembre: 9, septiembre: 9, setiembre: 9, octubre: 10, novembre: 11, noviembre: 11, desembre: 12, diciembre: 12 };
const nifNet = s => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export function capcaleraOferta(text = "", { propis = [], nifPropi = "", contactes = [] } = {}) {
  const linies = String(text).split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const dalt = linies.slice(0, 40);
  const nostres = propis.map(norm).filter(x => x.length > 2);
  const esNostre = l => { const n = norm(l); return nostres.some(x => n.includes(x)); };
  const out = { industrial: "", nif: "", data: "", numero: "", referencia: "" };
  // NIF / CIF (el primer que no és el nostre)
  const propi = nifNet(nifPropi);
  for (const l of dalt) {
    const m = l.match(/\b(?:C\.?\s?I\.?\s?F\.?|N\.?\s?I\.?\s?F\.?)\s*[:.]?\s*([A-Z]-?\s?\d{7,8}-?[A-Z0-9]?|\d{8}-?[A-Z])\b/i);
    if (m && nifNet(m[1]) !== propi) { out.nif = nifNet(m[1]); break; }
  }
  // l'empresa: un contacte amb el mateix NIF o amb el nom a les primeres línies; si no, la línia amb la forma jurídica
  const ct = out.nif && contactes.find(c => nifNet(c.nif) === out.nif);
  if (ct) out.industrial = ct.nom;
  if (!out.industrial) { const top = norm(dalt.slice(0, 25).join(" ")); const c = contactes.find(c => { const n = norm(c.nom); return n.length > 3 && top.includes(n) && !nostres.some(x => n.includes(x) || x.includes(n)); }); if (c) out.industrial = c.nom; }
  if (!out.industrial) {
    const forma = /\b(S\.?\s?A\.?\s?U?\.?|S\.?\s?L\.?\s?(?:U\.?|P\.?)?|S\.?\s?C\.?\s?C\.?\s?L\.?|S\.?\s?C\.?\s?P\.?|C\.?\s?B\.?|S\.?\s?COOP\.?)\s*$/i;
    const l = dalt.slice(0, 25).find(l => forma.test(l) && !esNostre(l) && l.length <= 70 && !/(obra|pressupost|presupuesto|client|cliente)\s*:/i.test(l));
    if (l) out.industrial = l.replace(/^(?:empresa|raó social|razón social)\s*:\s*/i, "").trim();
  }
  // la data: dd/mm/aaaa o «18 de juliol de 2025»
  for (const l of dalt) {
    let m = l.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);
    if (m) { let a = +m[3]; if (a < 100) a += 2000; const d = +m[1], me = +m[2]; if (d >= 1 && d <= 31 && me >= 1 && me <= 12 && a > 1990) { out.data = `${a}-${String(me).padStart(2, "0")}-${String(d).padStart(2, "0")}`; break; } }
    m = l.toLowerCase().match(/\b(\d{1,2})\s*(?:de\s+|d')?\s*([a-zàèéíòóúç]+)\s*(?:de\s+|del\s+)?(\d{4})\b/);
    if (m && MESOS[m[2]]) { out.data = `${m[3]}-${String(MESOS[m[2]]).padStart(2, "0")}-${String(+m[1]).padStart(2, "0")}`; break; }
  }
  // el número del pressupost
  for (const l of dalt) { const m = l.match(/\b(?:pressupost|presupuesto|oferta|cotitzaci[óo]|cotizaci[óo]n)\s*(?:n[ºo°]\.?|n[úu]m\.?|n[úu]mero)?\s*[:.]?\s*([A-Z]{0,4}[-\/]?\d[\w\-\/.]{1,20})/i); if (m) { out.numero = m[1].replace(/[.]+$/, ""); break; } }
  // l'obra o la referència
  for (const l of dalt) { const m = l.match(/\b(?:obra|ref\.?|refer[eè]ncia|referencia|assumpte|asunto)\s*:\s*(.{3,})$/i); if (m) { out.referencia = m[1].trim().slice(0, 90); break; } }
  return out;
}
