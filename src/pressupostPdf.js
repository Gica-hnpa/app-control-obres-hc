// V87.305 · Llegir un pressupost en PDF (encàrrec de l'Héctor del 19/10/2026: «per als clients que tenen el pressupost en PDF,
// que sigui capaç de llegir-lo i passar-me les dades a un pressupost de l'app»). Sense IA: es llegeix el text del PDF per
// línies (com els albarans) i es reconeixen capítols, partides (codi, unitat, text, quantitat, preu, import) i totals.
// Cada partida es comprova (quantitat × preu = import); el que no quadra o no s'ha pogut llegir es marca per revisar-ho
// abans de desar. Funcions pures (es proven sense navegador: tools/proves/pdfpressupostunit.mjs).

const UNITATS = /^(m2|m²|m3|m³|ml|m\.l\.|m|mt|u|ut|uts|ud|uds|un|und|pa|p\.a\.|kg|t|tn|h|hr|l|lt|dia|dies|mes|mesos|sem|pp|%)\.?$/i;
const IGNORA = /^(p[aà]g(ina)?\.?\s*\d|full\s*\d|hoja\s*\d|c[oó]di(go)?\s+(n[ao]t\s+)?(u[dt]|res|desc|concepte)|resumen\b|amidaments\b|mediciones\b|presupuesto\s+parcial|pressupost\s+parcial|^\s*cantidad\s+precio|quantitat\s+preu)/i;
const TOTAL = /^(total|suma|subtotal|import total|importe total|total cap[ií]t|total pressupost|total presupuesto|pressupost d.execuci|presupuesto de ejecuci|p\.?e\.?m\b|base imposable|base imponible|i\.?v\.?a|iva\b|gastos generales|despeses generals|benefici|beneficio)/i;
const CAP_PARAULA = /^(cap[ií]tol|cap[ií]tulo|cap\.)\s*(\d{1,3}(?:[.\-]\d{1,3})?)\s*[-.:·]?\s*(.*)$/i;
const CAP_CODI = /^(c\s?\d{1,3}|\d{1,2})\s*[-.:·]?\s+([A-ZÀ-ÚÑÇ][^a-zà-úñç]{2,}.*)$/;      // «01 ENDERROCS», «C02 FAÇANES»
const PARTIDA = /^((?:[A-Z]{1,4}\s?)?\d{1,3}(?:[.\-]\d{1,4}){1,4}[A-Z]?)\s+(.+)$/;      // 01.01, 1.1, E01.002, 02.01.03
const PARTIDA_UT = /^([A-Z]{0,4}\d[A-Z0-9.\-/]{1,12})\s+(\S+)\s+(.+)$/i;                      // «13001 u Finestra…» (codi sense punts + unitat)
const PARTIDA_TCQ = /^(\d{1,4})\s+([A-Z][A-Z0-9]{5,9})\s+(.+)$/;                              // «1 E222142A m3 Excavació…» (TCQ / BEDEC)
const normUt = u => { const x = String(u || "").replace(/\.$/, ""); if (/^m2$/i.test(x)) return "m²"; if (/^m3$/i.test(x)) return "m³"; if (/^(u|ud|uds|un|und|uts)$/i.test(x)) return "ut"; if (/^p\.?a$/i.test(x)) return "pa"; return x; };

// «1.234,56» → 1234.56 · «12,5» → 12.5 · «1.234» → 1234 · «12.50» → 12.5 · «1,234.56» → 1234.56
export function numero(s) {
  let t = String(s ?? "").replace(/[€\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!t || !/^-?[\d.,]+$/.test(t) || !/\d/.test(t)) return null;
  if (t.includes(",") && t.includes(".")) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (t.includes(",")) t = (t.match(/,/g).length > 1) ? t.replace(/,/g, "") : t.replace(",", ".");
  else if (t.includes(".")) { const parts = t.split("."); if (parts.length > 2 || parts[parts.length - 1].length === 3) t = t.replace(/\./g, ""); }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}
const esNum = s => numero(s) !== null && /\d/.test(String(s));
const net = s => String(s ?? "").replace(/\s+/g, " ").trim();

// Números del final de la línia (els que hi ha després de l'últim text)
// V87.305.1 · el percentatge de l'IVA («10%», «21,00 %») i «€» / «EUR» se salten (pressupostos fets com una factura)
const SALTA = tk => tk === "€" || tk === "" || /^eur$/i.test(tk) || tk === "%" || /^-?\d+(?:[.,]\d+)?%$/.test(tk);
function numsFinals(tokens) {
  const out = [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    const tk = tokens[i].replace(/€$/, "");
    if (SALTA(tk)) continue;
    if (tokens[i + 1] === "%") continue; // «21,00 %»: el número del percentatge
    if (esNum(tk)) out.unshift(numero(tk)); else break;
  }
  return out;
}
function senseNumsFinals(tokens) {
  let i = tokens.length;
  while (i > 0 && (esNum(tokens[i - 1].replace(/€$/, "")) || SALTA(tokens[i - 1].replace(/€$/, "")))) i--;
  return tokens.slice(0, i);
}
// Capçalera d'una taula («Nº Descripción Cant PU sin IVA IVA PVP sin IVA»): no és cap partida ni cap títol
const CAPCALERA = l => (String(l).toLowerCase().match(/\b(descripci[oó]n?|concepte|concepto|cant|cantidad|quantitat|precio|preu|pu|importe|import|iva|pvp|ud|unidad|unitat|total)\b/g) || []).length >= 3 && !/\d[.,]\d/.test(l);
// Després de les partides: observacions, condicions… (no són la descripció de l'última partida)
const FI_DESC = /^(observacions|observaciones|condicions|condiciones|notes|notas|forma de pagament|forma de pago|validesa|validez|conforme|acceptat|aceptado)\b/i;
const TOTAL_PDF = /(total sin iva|total sense iva|base imponible|base imposable|pressupost d.execuci|presupuesto de ejecuci|p\.?e\.?m\b|total pressupost|total presupuesto|^subtotal)/i;
// Quantitat, preu i import a partir dels números del final: es busca la combinació que quadra (q × pu = import)
export function quadra(nums) {
  const n = nums.filter(x => x !== null);
  for (const k of [3, 4, 5]) {
    if (n.length < 3) break;
    const s = n.slice(-k);
    for (let i = 0; i + 2 < s.length; i++) {
      const [q, pu, imp] = [s[i], s[i + 1], s[s.length - 1]];
      if (Math.abs(q * pu - imp) <= Math.max(0.02, Math.abs(imp) * 0.005)) return { q, pu, imp, ok: true };
    }
  }
  if (n.length >= 3) { const [q, pu, imp] = n.slice(-3); return { q, pu, imp, ok: false }; }
  if (n.length === 2) return { q: n[0], pu: n[1], imp: Math.round(n[0] * n[1] * 100) / 100, ok: false, dos: true };
  return null;
}

// V87.305.1 · Apartats que no són el pressupost (el PDF de Llafranc: Pressupost, després Amidaments i Descomposats amb les
// mateixes partides, que es comptaven dues i tres vegades). Només si la paraula és en majúscules (un títol) o va amb «Pàgina N»
// al peu; «Mediciones y presupuesto» (Presto, tot junt) no compta.
const SECCIO_FORA = /^(amidaments|medicions|mediciones|estat d.amidaments|estado de mediciones|descompos[a-z]*|descompuestos?|preus descompostos|precios descompuestos|justificaci[oó]n? de pre(?:us|cios)|quadre de preus|cuadro de precios)\b/i;
const SECCIO_DINS = /^(pressupost|presupuesto|pressupostos|presupuestos)\b/i;
const titolSeccio = (re, l) => { const m = l.match(re); return !!m && !/(pressupost|presupuesto)/i.test(l.slice(m[0].length, m[0].length + 40)) && (m[1] === m[1].toUpperCase() || /p[àa]gina\s+\d/i.test(l)); };
const clauNom = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\([^)]*\)|←.*$/g, "").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 30);

// files: [{ text }] o [{ items:[{x,s}] }] (una per línia, en ordre de lectura)
export function llegirPressupostPdf(files) {
  const linies = (files || []).map(f => net(f.text ?? (f.items || []).map(i => i.s).join("  "))).filter(Boolean);
  let r = llegirAmbCodis(linies, true);
  if (!r.partides.length) r = llegirAmbCodis(linies, false); // un PDF que només fos d'amidaments: millor això que res
  return r.partides.length ? r : llegirSenseCodis(linies);
}
function llegirAmbCodis(linies, apartats) {
  const caps = [], partides = [], avisos = [];
  let cap = "", act = null, totalPdf = null, fora = false;
  const autos = new Set(); // capítols posats pel codi (no per un títol del PDF)
  const tanca = () => {
    if (!act) return;
    act.concepte = net(act.concepte).slice(0, 240) || "Partida importada del PDF";
    act.desc = net(act.desc).slice(0, 1500);
    if (!act.num) { act.revisar = "Sense quantitat ni preu: revisa-la"; act.q = 0; act.pu = 0; act.imp = 0; }
    else { Object.assign(act, { q: act.num.q, pu: act.num.pu, imp: act.num.imp }); if (!act.num.ok) act.revisar = act.num.dos ? "Només s’hi han trobat dos números (quantitat i preu?)" : "Quantitat × preu no dona l’import"; }
    delete act.num; delete act.font;
    // la mateixa partida repetida més avall (amidaments, descompostos…) no es torna a comptar; dues partides diferents amb el
    // mateix codi (passa) sí que es queden
    const ja = partides.find(p => p.codi === act.codi && !p.revisar && clauNom(p.concepte) === clauNom(act.concepte));
    if (!ja) partides.push(act);
    act = null;
  };
  for (const linia of linies) {
    if (apartats && titolSeccio(SECCIO_FORA, linia)) { tanca(); fora = true; continue; }
    if (fora) { if (titolSeccio(SECCIO_DINS, linia)) fora = false; continue; }
    if (IGNORA.test(linia)) continue;
    const tokens = linia.split(" ");
    const nums = numsFinals(tokens);
    if (TOTAL.test(linia)) {
      // un total sense partida oberta (o amb la partida ja amb números) és un total de capítol o del pressupost
      // «TOTAL PARTIDA 12,50 31,20 390,00» (Presto): és de la partida oberta i mana sobre les línies de mides
      if (act && (!act.num || act.font === "text") && nums.length >= 2 && /^total\b/i.test(linia) && !/cap[ií]t|presupuesto|pressupost|p\.?e\.?m/i.test(linia) && (nums.length >= 3 || /partida/i.test(linia))) { act.num = quadra(nums); act.font = "total"; continue; }
      tanca();
      if (TOTAL_PDF.test(linia) && nums.length && totalPdf == null) totalPdf = nums[nums.length - 1];
      continue;
    }
    // un total amb text al davant («Pago por Transferencia · Total sin IVA 989,00 €») també tanca la partida
    if (nums.length === 1 && /\b(total|subtotal|base imponible|base imposable)\b/i.test(linia)) { tanca(); if (TOTAL_PDF.test(linia) && totalPdf == null) totalPdf = nums[0]; continue; }
    let m = linia.match(CAP_PARAULA);
    if (m && !PARTIDA.test(linia.replace(CAP_PARAULA, "$2 $3"))) {
      tanca(); const codi = m[2].replace(/\D+$/, "").padStart(2, "0"); const nom = net(senseNumsFinals(m[3].split(" ")).join(" ")) || `Capítol ${codi}`;
      cap = `${codi} ${nom}`.trim(); caps.push(cap); continue;
    }
    m = linia.match(PARTIDA);
    if (m && !/[a-zà-úñç]/i.test(m[2])) m = null; // «8.00 8.00» (una línia d'amidament) no és cap partida
    // «13.020 mm de longitud i alçada…»: una mida dins de la descripció de la partida oberta, no un codi
    if (m && act && !nums.length) { const nx = m[2].split(" ")[0].replace(/[,.;:]$/, ""); if (/^[a-zà-úñç]/.test(nx) && !UNITATS.test(nx)) m = null; }
    const tcq = !m && linia.match(PARTIDA_TCQ);
    if (tcq && /\d/.test(tcq[2])) m = [linia, tcq[2], tcq[3]];
    // V87.305.1 · codi sense punts («13001 u Finestra… 1.00 666.92 € 666.92 €», PDF de Llafranc): codi amb números + unitat +
    // text, i els números del final quadren (una línia de descripció com «10 m de tub» no en porta)
    if (!m) { const mu = linia.match(PARTIDA_UT); if (mu && UNITATS.test(mu[2]) && /[a-zà-úñç]/i.test(mu[3]) && nums.length >= 2 && quadra(nums)?.ok) m = [linia, mu[1], mu[2] + " " + mu[3]]; }
    if (m) {
      tanca();
      const codi = m[1].replace(/\s+/g, "");
      let resta = senseNumsFinals(m[2].split(" "));
      let ut = "";
      if (resta.length && UNITATS.test(resta[0])) ut = resta.shift();
      else if (resta.length > 1 && UNITATS.test(resta[resta.length - 1])) ut = resta.pop();
      // capítol a partir del codi si és de punts (01.02 → «01») i no coincideix amb el llegit; els codis del BEDEC (E2225223)
      // no en diuen el capítol: es queden al llegit
      const pre = /^(?:[A-Z]{1,4})?\d{1,3}[.\-]/.test(codi) ? (codi.match(/^(?:[A-Z]{1,4})?(\d{1,3})/)?.[1]?.padStart(2, "0") || "") : "";
      // Si el capítol és d'un títol del PDF, un codi que no hi coincideix (080.15 dins de «09 PAVIMENTS») es queda on surt; només
      // es passa a un capítol nou pel codi si és el següent amb el mateix nombre de xifres (el títol no s'ha sabut llegir)
      const capNum = cap.split(" ")[0];
      const pelCodi = pre && !cap.startsWith(pre + " ") && !cap.startsWith(pre + ".") && (autos.has(cap) || !cap || (pre.length === capNum.length && Number(pre) > Number(capNum)));
      if (pelCodi) {
        const trobat = caps.find(c => c.startsWith(pre + " ")); cap = trobat || `${pre} Capítol ${pre}`; if (!trobat) { caps.push(cap); autos.add(cap); }
      } else if (!cap) { cap = "01 Partides"; caps.push(cap); autos.add(cap); }
      act = { codi, cap, ut: normUt(ut), concepte: resta.join(" "), desc: "", num: nums.length >= 2 ? quadra(nums) : null, font: "partida" };
      continue;
    }
    m = linia.match(CAP_CODI);
    if (m && !nums.length) {
      tanca(); const codi = m[1].replace(/\D/g, "").padStart(2, "0"); cap = `${codi} ${net(m[2])}`; caps.push(cap); continue;
    }
    if (!act) continue;
    // continuació de la partida oberta: números o text. Als pressupostos amb amidaments, sota la partida hi ha línies de mides
    // («Saló 1 4,50 3,20 14,40»): valen mentre no n'arribi una de millor (una línia només de números o «Total…»).
    const txtLinia = senseNumsFinals(tokens).join(" ");
    if (nums.length >= 2) {
      const font = !txtLinia ? "pur" : /^total\b/i.test(txtLinia) ? "total" : "text";
      if (!act.num || (act.font === "text" && font !== "text")) {
        act.num = quadra(nums); act.font = font;
        // si és la cua d'una descripció llarga (no una línia de mides curta com «Saló 1»), el text també hi va
        if (font === "text" && (txtLinia.length > 25 || /[.;:]$/.test(txtLinia))) { if (!act.desc && act.concepte.length < 200) act.concepte += " " + txtLinia; else act.desc += " " + txtLinia; }
        continue;
      }
      if (font === "text") continue; // una altra línia d'amidament
    }
    if (nums.length && senseNumsFinals(tokens).length <= 1) continue; // línia d'amidament (només números)
    if (!act.ut && tokens.length && UNITATS.test(tokens[0]) && act.desc === "") { act.ut = tokens[0]; }
    const txt = nums.length ? senseNumsFinals(tokens).join(" ") : linia;
    if (!act.desc && act.concepte.length < 200) act.concepte += " " + txt; else act.desc += " " + txt;
  }
  tanca();
  // capítols sense cap partida fora; avisos
  const usats = new Set(partides.map(p => p.cap));
  const capsFinals = caps.filter(c => usats.has(c));
  const total = Math.round(partides.reduce((s, p) => s + (p.imp || 0), 0) * 100) / 100;
  const revisar = partides.filter(p => p.revisar).length;
  if (revisar) avisos.push(`${revisar} partides per revisar`);
  if (totalPdf != null && Math.abs(totalPdf - total) > Math.max(1, totalPdf * 0.002)) avisos.push(`El total llegit (${total}) no coincideix amb el del PDF (${totalPdf})`);
  return { caps: capsFinals, partides, total, totalPdf, avisos };
}

// V87.305.1 · Pressupostos sense codis, fets com una factura (p. ex. el de Socoterm: «Nº · Descripción · Cant · PU sin IVA · IVA ·
// PVP sin IVA»): cada línia amb text i quantitat × preu = import és una partida; les línies de text de sota en continuen la
// descripció; el títol en majúscules d'abans («REPARACIÓN DE GRIETA EN FACHADA») és el capítol. Els codis es posen sols (01.01…).
function llegirSenseCodis(linies) {
  const caps = [], partides = [], avisos = [];
  let cap = "", act = null, totalPdf = null, titol = [], nCap = 0, nPart = 0, nomesImport = false;
  const tanca = () => { if (!act) return; act.concepte = net(act.concepte).slice(0, 240) || "Partida importada del PDF"; act.desc = net(act.desc).slice(0, 1500); partides.push(act); act = null; };
  const capDe = () => { if (titol.length || !cap) { nCap++; nPart = 0; cap = `${String(nCap).padStart(2, "0")} ${titol.length ? net(titol.join(" ")) : "Partides"}`; caps.push(cap); titol = []; } return cap; };
  for (const linia of linies) {
    if (IGNORA.test(linia)) continue;
    if (CAPCALERA(linia)) {
      // «Concepte · Import sense IVA» (pressupost d'honoraris): cada concepte amb un sol import és una partida d'import tancat
      const l = linia.toLowerCase();
      nomesImport = /\b(concepte|concepto|descripci[oó]n?)\b/.test(l) && /\b(import|importe)\b/.test(l) && !/\b(cant|cantidad|quantitat|precio|preu|pu|ud|unidad|unitat|amidament|medici[oó]n)\b/.test(l);
      continue;
    }
    if (FI_DESC.test(linia)) { tanca(); titol = []; continue; }
    const tokens = linia.split(" ");
    const nums = numsFinals(tokens);
    if (TOTAL.test(linia) || (nums.length === 1 && /\b(total|subtotal|base imponible|base imposable)\b/i.test(linia))) {
      tanca(); if (TOTAL_PDF.test(linia) && nums.length && totalPdf == null) totalPdf = nums[nums.length - 1]; titol = []; continue;
    }
    let txt = net(senseNumsFinals(tokens).join(" "));
    let ordre = "";
    const mo = txt.match(/^(\d{1,3})[.)]?\s+(.{6,})$/); if (mo) { ordre = mo[1]; txt = mo[2]; }
    const q = nums.length >= 2 ? quadra(nums) : null;
    if (q && q.ok && txt.length >= 6 && /[a-zà-úñç]/i.test(txt)) {
      tanca(); capDe(); nPart++;
      let ut = ""; const tt = txt.split(" "); if (tt.length > 1 && UNITATS.test(tt[tt.length - 1]) && tt[tt.length - 1] !== "%") ut = tt.pop();
      act = { codi: `${cap.slice(0, 2)}.${String(ordre || nPart).padStart(2, "0")}`, cap, ut: normUt(ut) || "ut", concepte: tt.join(" "), desc: "", q: q.q, pu: q.pu, imp: q.imp };
      continue;
    }
    if (nomesImport && nums.length === 1 && nums[0] > 0 && txt.length >= 4 && /[a-zà-úñç]/i.test(txt)) {
      tanca(); capDe(); nPart++;
      act = { codi: `${cap.slice(0, 2)}.${String(ordre || nPart).padStart(2, "0")}`, cap, ut: "pa", concepte: txt, desc: "", q: 1, pu: nums[0], imp: nums[0] };
      continue;
    }
    // títol en majúscules (sense números): el capítol de les partides que vindran
    if (!nums.length && /[A-ZÀ-ÚÑÇ]{3}/.test(linia) && !/[a-zà-úñç]/.test(linia) && !/\d/.test(linia)) { if (act) { tanca(); } titol.push(linia); continue; }
    if (act && txt && !nums.length) { if (!act.desc && act.concepte.length < 200) act.concepte += " " + txt; else act.desc += " " + txt; continue; }
    if (!act) titol = [];
  }
  tanca();
  const total = Math.round(partides.reduce((s, p) => s + (p.imp || 0), 0) * 100) / 100;
  if (totalPdf != null && Math.abs(totalPdf - total) > Math.max(1, totalPdf * 0.002)) avisos.push(`El total llegit (${total}) no coincideix amb el del PDF (${totalPdf})`);
  return { caps: caps.filter(c => partides.some(p => p.cap === c)), partides, total, totalPdf, avisos, senseCodis: true };
}

// Text del PDF per línies (pdf.js): els trossos d'una mateixa altura fan una línia, d'esquerra a dreta
export async function liniesPdf(pdfjsLib, data, maxPagines = 60) {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const out = [];
  for (let i = 1; i <= Math.min(pdf.numPages, maxPagines); i++) {
    const p = await pdf.getPage(i); const tc = await p.getTextContent();
    const rows = [];
    tc.items.filter(x => String(x.str || "").trim()).forEach(x => { const y = x.transform[5], xx = x.transform[4]; let r = rows.find(r => Math.abs(r.y - y) < 2.5); if (!r) { r = { y, items: [] }; rows.push(r); } r.items.push({ x: xx, s: String(x.str).trim() }); });
    rows.sort((a, b) => b.y - a.y).forEach(r => out.push({ pagina: i, text: r.items.sort((a, b) => a.x - b.x).map(t => t.s).join("  ") }));
  }
  return { linies: out, pagines: pdf.numPages };
}
