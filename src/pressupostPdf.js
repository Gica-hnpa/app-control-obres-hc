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
function numsFinals(tokens) {
  const out = [];
  for (let i = tokens.length - 1; i >= 0; i--) { const tk = tokens[i].replace(/€$/, ""); if (tk === "€") continue; if (esNum(tk)) out.unshift(numero(tk)); else break; }
  return out;
}
function senseNumsFinals(tokens) {
  let i = tokens.length;
  while (i > 0 && (esNum(tokens[i - 1].replace(/€$/, "")) || tokens[i - 1] === "€")) i--;
  return tokens.slice(0, i);
}
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

// files: [{ text }] o [{ items:[{x,s}] }] (una per línia, en ordre de lectura)
export function llegirPressupostPdf(files) {
  const linies = (files || []).map(f => net(f.text ?? (f.items || []).map(i => i.s).join("  "))).filter(Boolean);
  const caps = [], partides = [], avisos = [];
  let cap = "", act = null, totalPdf = null;
  const tanca = () => {
    if (!act) return;
    act.concepte = net(act.concepte).slice(0, 240) || "Partida importada del PDF";
    act.desc = net(act.desc).slice(0, 1500);
    if (!act.num) { act.revisar = "Sense quantitat ni preu: revisa-la"; act.q = 0; act.pu = 0; act.imp = 0; }
    else { Object.assign(act, { q: act.num.q, pu: act.num.pu, imp: act.num.imp }); if (!act.num.ok) act.revisar = act.num.dos ? "Només s’hi han trobat dos números (quantitat i preu?)" : "Quantitat × preu no dona l’import"; }
    delete act.num; delete act.font;
    partides.push(act); act = null;
  };
  for (const linia of linies) {
    if (IGNORA.test(linia)) continue;
    const tokens = linia.split(" ");
    const nums = numsFinals(tokens);
    if (TOTAL.test(linia)) {
      // un total sense partida oberta (o amb la partida ja amb números) és un total de capítol o del pressupost
      // «TOTAL PARTIDA 12,50 31,20 390,00» (Presto): és de la partida oberta i mana sobre les línies de mides
      if (act && (!act.num || act.font === "text") && nums.length >= 2 && /^total\b/i.test(linia) && !/cap[ií]t|presupuesto|pressupost|p\.?e\.?m/i.test(linia) && (nums.length >= 3 || /partida/i.test(linia))) { act.num = quadra(nums); act.font = "total"; continue; }
      tanca();
      if (/(pressupost d.execuci|presupuesto de ejecuci|p\.?e\.?m\b|total pressupost|total presupuesto)/i.test(linia) && nums.length) totalPdf = nums[nums.length - 1];
      continue;
    }
    let m = linia.match(CAP_PARAULA);
    if (m && !PARTIDA.test(linia.replace(CAP_PARAULA, "$2 $3"))) {
      tanca(); const codi = m[2].replace(/\D+$/, "").padStart(2, "0"); const nom = net(senseNumsFinals(m[3].split(" ")).join(" ")) || `Capítol ${codi}`;
      cap = `${codi} ${nom}`.trim(); caps.push(cap); continue;
    }
    m = linia.match(PARTIDA);
    const tcq = !m && linia.match(PARTIDA_TCQ);
    if (tcq && /\d/.test(tcq[2])) m = [linia, tcq[2], tcq[3]];
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
      if (pre && !cap.startsWith(pre + " ") && !cap.startsWith(pre + ".")) {
        const trobat = caps.find(c => c.startsWith(pre + " ")); cap = trobat || `${pre} Capítol ${pre}`; if (!trobat) caps.push(cap);
      } else if (!cap) { cap = "01 Partides"; caps.push(cap); }
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
