// V87.401 · Pressupost dictat (estudi del mercat, proposta 1; sense IA de pagament): «enderroc de rajola de la cuina, 12 metres
// quadrats; alicatat del bany 20 m2; 6 punts de llum…» → [{concepte, q, ut}]. Català i castellà; números en xifres o en lletres
// (fins a cent, «i mig»); la unitat al costat del número (m2, m3, ml, m, u, pa, h, kg, t). Sense número, 1 u. Funcions pures.

const NUMS = {
  dos: 2, dues: 2, tres: 3, quatre: 4, cuatro: 4, cinc: 5, cinco: 5, sis: 6, seis: 6, set: 7, siete: 7,
  vuit: 8, ocho: 8, nou: 9, nueve: 9, deu: 10, diez: 10, onze: 11, once: 11, dotze: 12, doce: 12, tretze: 13, trece: 13,
  catorze: 14, catorce: 14, quinze: 15, quince: 15, setze: 16, dieciseis: 16, disset: 17, diecisiete: 17, divuit: 18, dieciocho: 18,
  dinou: 19, diecinueve: 19, vint: 20, veinte: 20, trenta: 30, treinta: 30, quaranta: 40, cuarenta: 40, cinquanta: 50, cincuenta: 50,
  seixanta: 60, sesenta: 60, setanta: 70, setenta: 70, vuitanta: 80, ochenta: 80, noranta: 90, noventa: 90, cent: 100, cien: 100
};
// unitats: la forma dita → la de l'app (les llargues primer)
const UNITATS = [
  [/^(metres?|metros?)\s+(quadrats?|cuadrados?)(?![a-z])/, "m2"], [/^(metres?|metros?)\s+(c[uú]bics?|c[uú]bicos?)(?![a-z])/, "m3"],
  [/^(metres?|metros?)\s+(lineals?|lineales?)(?![a-z])/, "ml"], [/^(m2|m²)(?![a-z0-9])/, "m2"], [/^(m3|m³)(?![a-z0-9])/, "m3"], [/^ml(?![a-z0-9])/, "ml"],
  [/^(quadrats?|cuadrados?)(?![a-z])/, "m2"], [/^(partid(?:a|es)\s+al[çc]ad(?:a|es)|partidas?\s+alzadas?|pa)(?![a-z0-9])/, "pa"],
  [/^(unitats?|unidades?|uts?|uds?|u)(?![a-z0-9])/, "u"], [/^(hores?|horas?|h)(?![a-z0-9])/, "h"], [/^(quilos?|kilos?|kg)(?![a-z0-9])/, "kg"],
  [/^(tones|tonelades|toneladas|t)(?![a-z0-9])/, "t"], [/^(metres?|metros?|m)(?![a-z0-9²³])/, "m"]
];
const SEPARADORS = /\s*(?:\n|;|\.\s|\s+i\s+despr[eé]s\s+|\s+despr[eé]s\s+|\s+tamb[eé]\s+|\s+a\s+m[eé]s\s+|\s+y\s+luego\s+|\s+adem[aá]s\s+|\s+tambi[eé]n\s+)\s*/i;
const sense = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");

// un número a la posició i (text en minúscules): {v, fi, paraula} o null
function numeroA(low, i) {
  const m = low.slice(i).match(/^(\d+(?:[.,]\d+)?)/);
  if (m) {
    let v = Number(m[1].replace(",", ".")), fi = i + m[1].length;
    const mig = low.slice(fi).match(/^\s+(?:i|y)\s+(?:mig|medio)(?![a-z])/); if (mig) { v += 0.5; fi += mig[0].length; }
    return { v, fi, paraula: false };
  }
  const w = sense(low.slice(i)).match(/^([a-z]+)(?:\s+(?:i|y)\s+([a-z]+))?/);
  if (!w || !(w[1] in NUMS)) return null;
  let v = NUMS[w[1]], fi = i + w[1].length;
  if (w[2] && NUMS[w[2]] && NUMS[w[2]] < 10 && v >= 20) { v += NUMS[w[2]]; fi = i + w[0].length; }   // «vint i dos»
  else if (w[2] === "mig" || w[2] === "medio") { v += 0.5; fi = i + w[0].length; }
  return { v, fi, paraula: true };
}
function unitatA(low, i) {
  const rest = low.slice(i).replace(/^\s+/, ""), salt = low.length - i - rest.length;
  for (const [re, ut] of UNITATS) { const m = rest.match(re); if (m) return { ut, fi: i + salt + m[0].length }; }
  return null;
}
// les quantitats del text: [{ini, fi, v, ut, paraula}]. Un número en lletres només compta amb unitat o a l'inici («sis punts de llum»):
// «radiador nou» no és 9 radiadors.
// `inicia`: sense unitat però al principi o just després d'una altra quantitat («…20 m2 sis punts de llum»): comença una partida nova
function quantitats(text) {
  const low = text.toLowerCase(), out = [];
  let ultim = 0;
  for (let i = 0; i < low.length; i++) {
    if (i > 0 && /[\p{L}\p{N}]/u.test(low[i - 1])) continue;
    const n = numeroA(low, i); if (!n) continue;
    const u = unitatA(low, n.fi);
    const inicia = !u && !low.slice(ultim, i).replace(/[\s,;.]/g, "");
    if (n.paraula && !u && !inicia) continue;
    out.push({ ini: i, fi: u ? u.fi : n.fi, v: n.v, ut: u ? u.ut : "", paraula: n.paraula, inicia });
    ultim = u ? u.fi : n.fi; i = ultim - 1;
  }
  return out;
}
// treu de l'inici les paraules d'enllaç i els articles («i», «de», «d'», «un», «la»…) i la puntuació dels extrems
function neteja(s) {
  let x = String(s || "").replace(/\s+/g, " ").replace(/^[\s,.:;\-–—]+|[\s,.:;\-–—]+$/g, ""), abans;
  do { abans = x; x = x.replace(/^(?:i|y|amb|con|de|del|dels|un|una|uns|unes|el|la|els|les|los|las)\s+/i, "").replace(/^[dl][’']\s*/i, ""); } while (x !== abans);
  return x.trim();
}
const finalNet = s => String(s || "").replace(/\s+/g, " ").replace(/[\s,.:;\-–—]+$/g, "").trim();
const majuscula = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

// un tros amb una sola partida
function partidaDe(tros) {
  const t = String(tros || "").trim(); if (!t) return null;
  const qs = quantitats(t), q = qs.find(x => x.ut) || qs[0];
  if (!q) { const c = majuscula(neteja(t)); return c ? { concepte: c, q: 1, ut: "u", senseQuantitat: true } : null; }
  const abans = neteja(t.slice(0, q.ini)), despres = finalNet(t.slice(q.fi));
  // «12 metres quadrats d'enderroc…» (la descripció després) o «enderroc… 12 metres quadrats (de la cuina)»
  const c = abans ? (despres ? `${abans} ${despres}` : abans) : neteja(despres);
  return c ? { concepte: majuscula(c), q: q.v, ut: q.ut || "u" } : null;
}

export function llegirDictat(text = "") {
  const net = String(text || "").replace(/(\d)\s+(?:coma|con)\s+(\d)/gi, "$1,$2").replace(/\r/g, "");
  let trossos = net.split(SEPARADORS).map(s => s.trim()).filter(Boolean);
  // una coma separa partides si a cada banda hi ha una quantitat («…cuina 12 m2, alicatat 20 m2»)
  trossos = trossos.flatMap(tr => {
    const parts = tr.split(/,\s+/);
    if (parts.length < 2 || parts.filter(p => quantitats(p).length).length < 2) return [tr];
    const out = [];
    for (const p of parts) { if (out.length && !quantitats(p).length) out[out.length - 1] += ", " + p; else out.push(p); }
    return out;
  });
  // dins d'un tros, diverses quantitats amb unitat sense separador («enderroc 12 m2 alicatat 20 m2»): es parteix després de cadascuna;
  // si el tros comença per la quantitat («12 m2 d'enderroc 20 m2 d'alicatat»), es parteix abans
  trossos = trossos.flatMap(tr => {
    const qs = quantitats(tr).filter(q => q.ut || q.inicia);
    if (qs.length < 2) return [tr];
    const davant = !neteja(tr.slice(0, qs[0].ini)), talls = [];
    // amb la quantitat al davant, es talla abans de cadascuna; si no, després de la d'abans (si tenia unitat i la descripció hi anava davant)
    qs.forEach((q, k) => { if (!k) return; if (davant || q.inicia) talls.push(q.ini); else if (qs[k - 1].ut && !qs[k - 1].inicia) talls.push(qs[k - 1].fi); });
    const out = [];
    let ini = 0;
    for (const c of [...new Set(talls)].sort((a, b) => a - b)) if (c > ini) { out.push(tr.slice(ini, c)); ini = c; }
    out.push(tr.slice(ini));
    return out.filter(x => neteja(x));
  });
  return trossos.map(partidaDe).filter(Boolean);
}
