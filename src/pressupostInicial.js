// V87.412 · El pressupost inicial (l'Héctor, 28/10/2026: «recuperar a Brava els pressupostos inicials i separar les partides noves… sense que
// s'esborri res de les certificacions»). Es compara el pressupost d'ara amb el de l'Excel original (o amb el d'ara, per fixar-lo des d'avui):
// quines partides són iguals, quines han canviat de quantitat o de preu, quines són noves (no eren a l'inicial) i quines ja no hi són.
// Funcions pures: no toquen res; la pantalla del pressupost desa el resultat.

const num = v => { if (typeof v === "number") return Number.isFinite(v) ? v : 0; let s = String(v ?? "").trim().replace(/€/g, "").replace(/\s/g, ""); if (!s) return 0; if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = parseFloat(s.replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };
const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
// el codi sense espais ni zeros de davant de cada tros: «01.01» = «1.1» = «01-01»
export function canonCodi(c) {
  const s = String(c ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!s) return "";
  return s.split(/[.\-/_]+/).filter(Boolean).map(p => /^\d+$/.test(p) ? String(parseInt(p, 10)) : p).join(".");
}
export function canonText(t) {
  return String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 70);
}
// semblança de dos textos (paraules de 3 lletres o més que tenen en comú)
const paraules = t => new Set(String(t || "").split(" ").filter(w => w.length >= 3));
export function semblanca(a, b) {
  if (!a || !b) return 0; if (a === b) return 1;
  const A = paraules(a), B = paraules(b); if (!A.size || !B.size) return 0;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / (A.size + B.size - n);
}
const canonUt = u => String(u ?? "").toLowerCase().replace(/[²³.\s]/g, m => (m === "²" ? "2" : m === "³" ? "3" : "")).replace(/^ud$|^u$/, "ut");
export const importLinia = r => r2(num(r.q) * num(r.pu));

// Aparella les partides d'ara amb les de l'inicial: primer pel codi (i, si n'hi ha de repetits, pel text), després pel text i la unitat.
// `actuals`: partides del pressupost d'ara (sense les que ja se sap que són noves). `inicials`: partides de l'inicial
// ({codi, concepte, ut, q, pu, cap}). `altres`: partides dels altres pressupostos de l'obra (una partida de l'inicial que ara és en un
// altre pressupost —una altra fase— no compta com a treta).
export function compara(actuals = [], inicials = [], altres = []) {
  const lliures = inicials.map((i, k) => ({ i, k, c: canonCodi(i.codi), t: canonText(i.concepte), u: canonUt(i.ut) }));
  const usat = new Set();
  const parells = new Map();
  const perCodi = new Map();
  for (const x of lliures) if (x.c) { if (!perCodi.has(x.c)) perCodi.set(x.c, []); perCodi.get(x.c).push(x); }
  // 1) pel codi, només si el text s'assembla (a Verbania, la fase principal es va renumerar: la 02.03 d'ara no és la 02.03 de l'Excel)
  actuals.forEach((r, j) => {
    const c = canonCodi(r.codi); if (!c || !perCodi.has(c)) return;
    const t = canonText(r.concepte);
    const cands = perCodi.get(c).filter(x => !usat.has(x.k) && (!t || !x.t || semblanca(t, x.t) >= 0.5)); if (!cands.length) return;
    const x = cands.slice().sort((a, b) => semblanca(t, b.t) - semblanca(t, a.t))[0];
    usat.add(x.k); parells.set(j, x);
  });
  // 2) pel text igual (i la unitat), 3) pel text molt semblant amb la mateixa unitat: partides que han canviat de número
  for (const llindar of [1, 0.75]) actuals.forEach((r, j) => {
    if (parells.has(j)) return;
    const t = canonText(r.concepte), u = canonUt(r.ut); if (!t) return;
    let millor = null, ms = 0;
    for (const x of lliures) { if (usat.has(x.k) || (llindar < 1 && x.u && u && x.u !== u) || (llindar === 1 && x.u && u && x.u !== u)) continue; const s = x.t === t ? 1 : semblanca(t, x.t); if (s >= llindar && s > ms) { millor = x; ms = s; } }
    if (millor) { usat.add(millor.k); parells.set(j, millor); }
  });
  const iguals = [], canviades = [], noves = [];
  actuals.forEach((r, j) => {
    const x = parells.get(j);
    if (!x) { noves.push(r); return; }
    const qi = num(x.i.q), pi = num(x.i.pu), qa = num(r.q), pa = num(r.pu);
    const dq = Math.abs(qa - qi) > 0.0005, dp = Math.abs(pa - pi) > 0.005;
    (dq || dp ? canviades : iguals).push({ r, i: x.i, qi, pi, qa, pa, dif: r2(qa * pa - qi * pi) });
  });
  // 3) les de l'inicial que no hi són: si són en un altre pressupost de l'obra, no compten
  const altresC = new Set(altres.map(a => canonCodi(a.codi)).filter(Boolean)), altresT = new Set(altres.map(a => canonText(a.concepte)).filter(Boolean));
  const tretes = [], aAltres = [];
  for (const x of lliures) if (!usat.has(x.k)) ((x.c && altresC.has(x.c)) || (x.t && altresT.has(x.t)) ? aAltres : tretes).push(x.i);
  const totIni = r2([...iguals, ...canviades].reduce((s, p) => s + p.qi * p.pi, 0) + tretes.reduce((s, i) => s + importLinia(i), 0));
  const totAra = r2(actuals.reduce((s, r) => s + importLinia(r), 0));
  return { iguals, canviades, noves, tretes, aAltres, totIni, totAra };
}
