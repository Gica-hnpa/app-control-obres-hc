// V87.328 · Amidaments abans del pressupost (encàrrec de l'Héctor del 22/10/2026: «una pestanya prèvia que digui amidaments i que
// l'app pugui llegir en tots els formats (PDF, Excel i BC3), amb una opció que digui passar-ho a pressupost»).
// Funcions pures (es proven sense navegador: tools/proves/amidamentsunit.mjs). Totes tornen el mateix:
//   { font, nom, caps:[…], partides:[{ codi, cap, capPrincipal, ut, concepte, desc, q, pu, mides:[…], revisar }], avisos:[…] }
// mides: [{ concepte, unitats, llargada, amplada, alcada, parcial }] (els camps buits, "").
// El PDF es llegeix a pressupostPdf.js (llegirAmidamentsPdf), que hi té les eines de números i de línies.

const net = s => String(s ?? "").replace(/\s+/g, " ").trim();
const r3 = n => Math.round((Number(n) || 0) * 1000) / 1000;
const normUt = u => { const x = net(u).replace(/\.$/, ""); if (/^m2$/i.test(x)) return "m²"; if (/^m3$/i.test(x)) return "m³"; if (/^(u|ud|uds|un|und|uts|unitat|unidad)$/i.test(x)) return "ut"; if (/^p\.?a$/i.test(x)) return "pa"; return x; };

// ───────────── BC3 (FIEBDC-3) ─────────────
// Els programes espanyols el desen en «ANSI» (Windows-1252) o en «850» / «437» (MS-DOS). Ho diu el registre ~V.
const CP437 = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";
const CP850 = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ ";
const dos = (u8, taula) => { let s = ""; for (const b of u8) s += b < 128 ? String.fromCharCode(b) : taula[b - 128]; return s; };

export function textBc3(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) return new TextDecoder("utf-8").decode(u8.subarray(3));
  let cap = ""; for (let i = 0; i < Math.min(u8.length, 1200); i++) cap += String.fromCharCode(u8[i]);
  const v = cap.match(/~V\|([^\n]*)/);
  const joc = v ? net(v[1].split("|")[4]).toUpperCase() : "";
  if (/UTF/.test(joc)) return new TextDecoder("utf-8").decode(u8);
  if (joc === "850") return dos(u8, CP850);
  if (joc === "437") return dos(u8, CP437);
  if (!joc) {
    // sense dir-ho: a l'MS-DOS les lletres amb accent són a 0x80–0xA5; al Windows, a 0xC0–0xFF
    let baix = 0, alt = 0; for (const b of u8) { if (b >= 0x80 && b <= 0xa5) baix++; else if (b >= 0xc0) alt++; }
    if (baix > alt) return dos(u8, CP850);
  }
  return new TextDecoder("windows-1252").decode(u8);
}

const numBc3 = s => { const t = String(s ?? "").trim(); if (!t) return null; const n = Number(t.replace(",", ".")); return Number.isFinite(n) ? n : null; };
const sense = c => String(c || "").replace(/#+$/, "").trim();

export function llegirBc3(text) {
  const regs = String(text || "").replace(/\r/g, "").split(/(?:^|\n)~(?=[A-Z]\|)/).filter(Boolean);
  const conceptes = new Map(), fills = new Map(), mesures = new Map(), textos = new Map();
  let arrel = "", nom = "";
  for (const reg of regs) {
    const tipus = reg[0], f = reg.slice(2).replace(/\n$/, "").split("|");
    if (tipus === "C") {
      const codis = f[0].split("\\").filter(Boolean); if (!codis.length) continue;
      const raw = codis[0].trim(), k = sense(raw);
      const preus = String(f[3] || "").split("\\").map(numBc3).filter(x => x !== null);
      conceptes.set(k, { raw, ut: normUt(f[1]), resum: net(f[2]), pu: preus.length ? preus[0] : null, tipus: net(f[5]), cap: /#$/.test(raw) });
      if (/##$/.test(raw) && !arrel) { arrel = k; nom = net(f[2]); }
    } else if (tipus === "D") {
      const pare = f[0].trim(), p = String(f[1] || "").split("\\"), out = [];
      for (let i = 0; i + 2 < p.length + 1; i += 3) { if (!p[i] || !p[i].trim()) continue; out.push({ raw: p[i].trim(), k: sense(p[i]), factor: numBc3(p[i + 1]) ?? 1, rend: numBc3(p[i + 2]) ?? 1 }); }
      fills.set(sense(pare), out);
      if (/##$/.test(pare) && !arrel) arrel = sense(pare);
    } else if (tipus === "T") {
      textos.set(sense(f[0]), String(f[1] || "").trim());
    } else if (tipus === "M") {
      const [pare, fill] = f[0].includes("\\") ? f[0].split("\\") : ["", f[0]];
      const l = String(f[3] || "").split("\\"), mides = [];
      for (let i = 0; i + 5 < l.length; i += 6) {
        const tip = net(l[i]);
        if (tip && tip !== "0") continue; // 1 i 2: subtotals; 3: fórmula (no es calcula)
        const [u, ll, a, h] = [l[i + 2], l[i + 3], l[i + 4], l[i + 5]].map(numBc3);
        const vals = [u, ll, a, h].filter(x => x !== null);
        const concepte = net(String(l[i + 1] || "").replace(/#.*$/, ""));
        if (!vals.length && !concepte) continue;
        mides.push({ concepte, unitats: u ?? "", llargada: ll ?? "", amplada: a ?? "", alcada: h ?? "", parcial: r3(vals.length ? vals.reduce((x, y) => x * y, 1) : 0) });
      }
      mesures.set(`${sense(pare)}\\${sense(fill)}`, { total: numBc3(f[2]), mides });
      if (!mesures.has(`\\${sense(fill)}`)) mesures.set(`\\${sense(fill)}`, { total: numBc3(f[2]), mides });
    }
  }
  if (!arrel) { // sense «##»: el concepte que no és fill de ningú i en té
    const tots = new Set([...fills.values()].flat().map(x => x.k));
    arrel = [...fills.keys()].find(k => !tots.has(k)) || "";
    nom = conceptes.get(arrel)?.resum || "";
  }
  const pares = new Set([...mesures.keys()].map(k => k.split("\\")[0]).filter(Boolean));
  const esCap = (k, raw) => /#$/.test(raw || "") || conceptes.get(k)?.cap || pares.has(k);
  const caps = [], partides = [], avisos = [];
  const etiqueta = k => { const c = conceptes.get(k); return net(`${k} ${c?.resum || ""}`) || k; };
  const vist = new Set();
  const recorre = (pare, cami) => {
    if (vist.has(pare)) return; vist.add(pare);
    for (const fl of fills.get(pare) || []) {
      if (esCap(fl.k, fl.raw)) {
        const et = etiqueta(fl.k); caps.push(et);
        recorre(fl.k, [...cami, et]);
        continue;
      }
      const c = conceptes.get(fl.k) || {};
      const m = mesures.get(`${pare}\\${fl.k}`) || mesures.get(`\\${fl.k}`);
      const q = m?.total != null ? m.total : r3(fl.factor * fl.rend);
      const cap = cami[cami.length - 1] || "01 Partides";
      if (!cami.length && !caps.includes(cap)) caps.push(cap);
      const p = { codi: fl.k, cap, capPrincipal: cami.length > 1 ? cami[0] : "", capPath: cami.length > 1 ? cami.slice() : [], ut: c.ut || "", concepte: c.resum || fl.k, desc: textos.get(fl.k) || "", q: r3(q), pu: c.pu, mides: m?.mides || [] };
      if (!c.resum) p.revisar = "La partida no té nom a l’arxiu";
      partides.push(p);
    }
  };
  if (arrel) recorre(arrel, []);
  if (!partides.length) avisos.push("No s’hi ha trobat cap partida");
  return { font: "BC3", nom, caps, partides, avisos };
}

// ───────────── Excel / CSV ─────────────
// fulls: [{ nom, files: [[cel·les]] }] (XLSX.utils.sheet_to_json amb header:1). Es busca la fila de capçalera (codi, unitat,
// descripció, quantitat…) i el full que dona més partides. Accepta: llistes simples (Codi · Ut · Descripció · Quantitat [· Preu ·
// Import]), amidaments amb línies de mides a sota (Comentari · Uds · Llargada · Amplada · Alçada · Parcial) i capítols en files
// pròpies («01 ENDERROCS», «CAPÍTOL 2 …») o en una columna «Capítol».
const cel = v => net(v);
const nrm = s => cel(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.:º°]/g, "").trim();
const COLS = {
  codi: /^(codi|codigo|code|cod|partida|n|num|numero|nº|ref|referencia|clau|clave)$/,
  ut: /^(ut|ud|u|uts|unitat|unidad|unit|unitats de mesura|unitat de mesura|ud de medida|unidad de medida|um|u m)$/,
  concepte: /^(descripcio|descripcion|concepte|concepto|resum|resumen|text|texto|designacio|designacion|partida d.obra|nom|nombre|description)/,
  q: /^(quantitat|quantitats|cantidad|cantidades|amidament|amidaments|medicio|medicions|medicion|mediciones|canpres|cant|q|total amidament|total medicion|quantitat total|cantidad total|medicio total|medicion total)(\s.*)?$/,
  pu: /^(preu|precio|pu|preu unitari|precio unitario|p unitari|pu sense iva|precio unit|pres|€\/u)$/,
  imp: /^(import|importe|total|imp|import total|importe total|imppres|parcial pressupost)$/,
  nat: /^(nat|naturalesa|naturaleza|tipus|tipo)$/,
  cap: /^(capitol|capitulo|chapter|cap)$/,
  com: /^(comentari|comentario|linia de medicio|linea de medicion|observacions|observaciones|ubicacio|ubicacion)$/,
  uds: /^(uds|unitats|unidades|n uds|n|nombre|numero d.unitats|num uds)$/,
  ll: /^(llargada|llarg|longitud|long|largo|llargària)$/,
  am: /^(amplada|ample|anchura|ancho|latitud|amp)$/,
  al: /^(alcada|alt|altura|alto|alçada|h)$/,
  parc: /^(parcial|parcials|parciales|total linia|total linea|subtotal)$/
};
const esNumCel = v => typeof v === "number" || /^-?\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?$|^-?\d+(?:[.,]\d+)?$/.test(cel(v));
const numCel = v => { if (typeof v === "number") return v; const t = cel(v).replace(/\s/g, ""); if (!t) return null; const s = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t; const n = Number(s); return Number.isFinite(n) ? n : null; };
const CAP_FILA = /^(?:cap[ií]tol|cap[ií]tulo|cap\.)\s*(\d{1,3}(?:[.\-]\d{1,3})?)\s*[-.:·]?\s*(.*)$/i;
const CAP_CODI = /^(c?\d{1,3}(?:\.\d{1,2})?)\s*[-.:·]?\s+(.+)$/i;

function capcalera(files) {
  let millor = null;
  for (let i = 0; i < Math.min(files.length, 40); i++) {
    const fila = files[i] || [], col = {};
    fila.forEach((v, j) => { const t = nrm(v); if (!t) return; for (const [k, re] of Object.entries(COLS)) if (col[k] === undefined && re.test(t)) { col[k] = j; break; } });
    // «Ud» i «Uds» a la mateixa fila: la primera és la unitat de mesura, la segona les unitats de la línia de mides
    if (col.concepte === undefined || (col.q === undefined && col.parc === undefined)) continue;
    const punts = Object.keys(col).length;
    if (!millor || punts > millor.punts) millor = { fila: i, col, punts };
  }
  return millor;
}

// V87.375.1 · sense fila de títols (l'Héctor, 24/10/2026, amb els amidaments de Cami Fondo: codi · unitat · descripció · uds · llargada ·
// amplada · alçada · parcial · quantitat, i els capítols «1.- ENDERROCS» a la columna del codi): les columnes es reconeixen pel que hi ha.
const RE_CODI_P = /^[a-z]?\d{1,3}(?:\.\d{1,3}){1,3}\.?$/i;
const RE_UT_P = /^(m|m2|m3|ml|m²|m³|u|ut|ud|uds|pa|kg|t|h|l|pza|pa\.|u\.|ut\.|ud\.)$/i;
function capcaleraSenseTitols(files) {
  const fs0 = files.slice(0, 600), nc = Math.min(40, Math.max(0, ...fs0.map(f => (f || []).length)));
  let codi = -1, nCodi = 0;
  for (let j = 0; j < Math.min(nc, 4); j++) { const c = fs0.filter(f => RE_CODI_P.test(cel(f?.[j]))).length; if (c > nCodi) { nCodi = c; codi = j; } }
  if (nCodi < 3) return null;
  const pf = fs0.filter(f => RE_CODI_P.test(cel(f?.[codi])));
  const quants = (j, fn) => pf.filter(f => fn(f?.[j])).length;
  let ut = -1;
  for (let j = codi + 1; j < Math.min(nc, codi + 4); j++) if (quants(j, v => RE_UT_P.test(cel(v))) >= pf.length * 0.5) { ut = j; break; }
  let concepte = -1, llarg = 8;
  for (let j = codi + 1; j < nc; j++) { if (j === ut) continue; const l = pf.reduce((a, f) => a + cel(f?.[j]).length, 0) / pf.length; if (l > llarg) { llarg = l; concepte = j; } }
  if (concepte < 0) return null;
  let q = -1, nq = 0;
  for (let j = concepte + 1; j < nc; j++) { const c = quants(j, v => cel(v) !== "" && esNumCel(v)); if (c > nq) { nq = c; q = j; } }
  if (q < 0 || nq < pf.length * 0.5) return null;
  const col = { codi, concepte, q };
  if (ut >= 0) col.ut = ut;
  // les línies de mides: files sense codi amb números entre la descripció i la quantitat; l'última d'aquestes columnes és el parcial
  const mids = fs0.filter(f => !cel(f?.[codi]));
  const nums = [];
  for (let j = concepte + 1; j < q; j++) if (mids.filter(f => cel(f?.[j]) !== "" && esNumCel(f?.[j])).length >= 2) nums.push(j);
  if (nums.length) { col.parc = nums[nums.length - 1]; ["uds", "ll", "am", "al"].forEach((k, i) => { if (nums[i] !== undefined && i < nums.length - 1) col[k] = nums[i]; }); }
  return { fila: -1, col, punts: Object.keys(col).length, senseTitols: true };
}

function llegirFull(files) {
  const h = capcalera(files) || capcaleraSenseTitols(files);
  if (!h) return null;
  const { col } = h, caps = [], partides = [];
  let cap = "", act = null, capP = "";
  const v = (fila, k) => col[k] === undefined ? "" : fila[col[k]];
  const tanca = () => {
    if (!act) return;
    if (!act.q && act.mides.length) act.q = r3(act.mides.reduce((s, m) => s + (Number(m.parcial) || 0), 0));
    if (!act.q) act.revisar = "Sense quantitat";
    partides.push(act); act = null;
  };
  for (let i = h.fila + 1; i < files.length; i++) {
    const fila = files[i] || [];
    if (!fila.some(x => cel(x))) continue;
    const codi = cel(v(fila, "codi")), concepte = cel(v(fila, "concepte")), ut = cel(v(fila, "ut"));
    const q = numCel(v(fila, "q")), pu = numCel(v(fila, "pu")), imp = numCel(v(fila, "imp"));
    const capCol = cel(v(fila, "cap"));
    if (capCol && capCol !== cap) { tanca(); cap = capCol; if (!caps.includes(cap)) caps.push(cap); }
    if (/^(total|suma|subtotal|pressupost d.execuci|presupuesto de ejecuci|p\.?e\.?m)\b/i.test(concepte || codi)) { tanca(); continue; }
    if (!concepte && codi && /[a-zà-úç]{3}/i.test(codi) && !ut && q === null && imp === null && !RE_CODI_P.test(codi)) {
      tanca();
      // «15.-INSTAL·LACIONS» és un capítol; «15.1.-SANEJAMENT», un subcapítol dins seu
      const m3 = codi.match(/^c?(\d{1,3}(?:\.\d{1,3})*)\s*[.\-:·)]*\s*(.+)$/i);
      if (m3 && m3[1].includes(".")) { cap = net(`${m3[1]} ${m3[2]}`); if (!capP.startsWith(m3[1].split(".")[0].padStart(2, "0") + " ")) capP = ""; }
      else { cap = m3 ? net(`${m3[1].padStart(2, "0")} ${m3[2]}`) : codi; capP = cap; }
      if (!caps.includes(cap)) caps.push(cap);
      continue;
    }
    // títol de capítol: «CAPÍTOL 2 FAÇANES», o un codi curt sense unitat ni quantitat amb el nom en majúscules
    const capText = `${codi} ${concepte}`.trim();
    const mc = capText.match(CAP_FILA);
    const nat = cel(v(fila, "nat"));
    const majus = !!concepte && concepte === concepte.toUpperCase() && /[A-ZÀ-ÚÑÇ]{3}/.test(concepte);
    // Presto i altres: la columna «Nat» diu si és un capítol; si no, un codi curt (01, C02) sense unitat amb el nom en majúscules
    // (encara que porti el total del capítol), «CAPÍTOL 2 …», o un títol en majúscules sense codi ni números
    const esTitol = !!concepte && !/part/i.test(nat) && (/cap/i.test(nat) || (!ut && (!!mc || (codi && /^c?\d{1,3}$/i.test(codi) && majus && (q === null || q === 1)) || (!codi && q === null && !imp && concepte.length < 80 && majus))));
    if (esTitol && !col.cap) {
      tanca();
      if (mc) cap = net(`${mc[1].padStart(2, "0")} ${mc[2]}`);
      else { const m2 = capText.match(CAP_CODI); cap = m2 ? net(`${m2[1].toUpperCase().padStart(2, "0")} ${m2[2]}`) : capText; }
      capP = "";
      if (!caps.includes(cap)) caps.push(cap);
      continue;
    }
    // la mateixa partida repetida en files seguides (una fila per línia de mides): s'ajunta
    if (codi && act && codi === act.codi && (!concepte || concepte === act.concepte)) {
      const mida = midaDeFila(fila, col); if (mida) act.mides.push(mida);
      continue;
    }
    // V87.375.1 · sense codi (molts amidaments fets a mà): una fila amb la descripció i la unitat (i la quantitat), o, si el full no té
    // columna de codi, amb la quantitat, és una partida; el codi el posa l'app (el número del capítol i el de la partida: «02.03»)
    const senseCodi = !codi && !!concepte && ((!!ut && (q !== null || imp !== null || col.q === undefined)) || (col.codi === undefined && q !== null && !midaDeFila(fila, col)));
    if (senseCodi) {
      tanca();
      if (!cap) { cap = "01 Partides"; caps.push(cap); }
      const pre = ((cap.match(/^c?(\d{1,3})/i) || [])[1] || String(Math.max(1, caps.indexOf(cap) + 1))).padStart(2, "0");
      const n = partides.filter(x => x.cap === cap).length + 1;
      act = { codi: `${pre}.${String(n).padStart(2, "0")}`, codiApp: true, cap, capPrincipal: capP && capP !== cap ? capP : "", ut: normUt(ut), concepte, desc: "", q: q ?? 0, pu: pu ?? (q && imp ? r3(imp / q) : null), mides: [] };
      continue;
    }
    if (codi && concepte) {
      tanca();
      if (!cap) { cap = "01 Partides"; caps.push(cap); }
      const curt = concepte.length > 140 ? concepte.slice(0, 120).replace(/[\s,;:.]+\S*$/, "") + "…" : concepte;
      act = { codi, cap, capPrincipal: capP && capP !== cap ? capP : "", ut: normUt(ut), concepte: curt, desc: curt !== concepte ? concepte : "", q: q ?? 0, pu: pu ?? (q && imp ? r3(imp / q) : null), mides: [] };
      const mida = midaDeFila(fila, col); if (mida && (mida.concepte || col.parc !== undefined)) act.mides.push(mida);
      continue;
    }
    if (!act) continue;
    // fila sense codi: línia de mides, la quantitat de la partida (Presto la posa a sota) o més descripció
    const mida = midaDeFila(fila, col);
    if (mida) { act.mides.push(mida); continue; }
    if (q !== null && !concepte) { act.q = q; if (pu !== null) act.pu = pu; continue; }
    if (concepte && q === null) { if (act.concepte.length < 60 && !act.desc) act.desc = concepte; else act.desc = net(`${act.desc} ${concepte}`); }
  }
  tanca();
  return { caps: caps.filter(c => partides.some(p => p.cap === c)), partides };
}
function midaDeFila(fila, col) {
  const get = k => col[k] === undefined ? null : numCel(fila[col[k]]);
  const u = get("uds"), ll = get("ll"), a = get("am"), h = get("al"), parc = get("parc");
  const vals = [u, ll, a, h].filter(x => x !== null);
  if (!vals.length && parc === null) return null;
  const concepte = cel(col.com !== undefined ? fila[col.com] : "") || (col.codi !== undefined && !cel(fila[col.codi]) ? cel(fila[col.concepte]) : "");
  return { concepte, unitats: u ?? "", llargada: ll ?? "", amplada: a ?? "", alcada: h ?? "", parcial: r3(parc ?? vals.reduce((x, y) => x * y, 1)) };
}

export function llegirExcelAmidaments(fulls) {
  let millor = null;
  for (const full of fulls || []) {
    const r = llegirFull(full.files || []);
    if (r && (!millor || r.partides.length > millor.partides.length)) millor = { ...r, full: full.nom };
  }
  const avisos = [];
  if (!millor || !millor.partides.length) return { font: "Excel", nom: "", caps: [], partides: [], avisos: ["No s’hi ha trobat cap partida: cal una fila de capçalera amb la descripció i la quantitat"] };
  const nq = millor.partides.filter(p => !p.q).length;
  if (nq) avisos.push(`${nq} partides sense quantitat`);
  return { font: "Excel", nom: millor.full || "", caps: millor.caps, partides: millor.partides, avisos };
}

// Quantes partides tenen preu (per dir-ho en passar-les a pressupost)
export const ambPreu = partides => (partides || []).filter(p => Number(p.pu) > 0).length;
