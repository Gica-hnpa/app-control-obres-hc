// V87.294 · Cites per veu: entén una frase en català o castellà («dimarts a dos quarts de deu visita a Verbania»,
// «mañana a las 5 de la tarde llamar a Brava») i en treu el dia, l'hora d'inici i de fi, el tipus de cita i l'obra.
// No desa res: l'Agenda obre la cita amb aquestes dades perquè es revisi abans de desar-la.

const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’´`]/g, "'");
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hm = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

const NUM = {
  u: 1, un: 1, una: 1, uno: 1, dos: 2, dues: 2, tres: 3, quatre: 4, cuatro: 4, cinc: 5, cinco: 5, sis: 6, seis: 6, set: 7, siete: 7,
  vuit: 8, ocho: 8, nou: 9, nueve: 9, deu: 10, diez: 10, onze: 11, once: 11, dotze: 12, doce: 12,
};
const NUMW = Object.keys(NUM).sort((a, b) => b.length - a.length).join("|");
const nombre = s => (/^\d+$/.test(s) ? +s : NUM[s] ?? null);
const DIES = { diumenge: 0, domingo: 0, dilluns: 1, lunes: 1, dimarts: 2, martes: 2, dimecres: 3, miercoles: 3, dijous: 4, jueves: 4, divendres: 5, viernes: 5, dissabte: 6, sabado: 6 };
const MESOS = {
  gener: 0, enero: 0, febrer: 1, febrero: 1, marc: 2, marzo: 2, abril: 3, maig: 4, mayo: 4, juny: 5, junio: 5, juliol: 6, julio: 6,
  agost: 7, agosto: 7, setembre: 8, septiembre: 8, setiembre: 8, octubre: 9, novembre: 10, noviembre: 10, desembre: 11, diciembre: 11,
};
// Tipus de cita (els de l'Agenda, AGENDA_TYPES878256)
const TIPUS = [
  [/\b(visit\w*|veure l'obra|mirar l'obra|ver la obra)\b/, "Visita d’obra"],
  [/\b(reunio\w*|reunir\w*|reunion\w*)\b/, "Reunió"],
  [/\b(trucad\w*|truca\w*|llamad\w*|llama\w*|telefon\w*)\b/, "Trucada"],
  [/\b(entreg\w*|lliura\w*)\b/, "Entrega documentació"],
  [/\b(recorda\w*|recordatori|avis|aviso|recordar\w*)\b/, "Recordatori"],
  [/\b(oficina|redacta\w*|prepara\w*)\b/, "Feina d’oficina"],
];
const BUIDES = new Set(["obra", "obres", "de", "del", "dels", "la", "les", "el", "els", "i", "a", "al", "amb", "en", "per", "cp", "edifici", "edificio",
  "casa", "carrer", "calle", "c", "av", "avinguda", "avenida", "projecte", "proyecto", "pressupost", "presupuesto", "prova", "y", "con", "para", "los", "las", "s", "l", "d"]);

// Afegeix minuts tenint en compte «de la tarda» (+12 h); sense dir res, d'1 a 7 s'entén a la tarda (horari de feina)
function horaAMin(h, min, franja) {
  let H = h;
  if (franja === "tarda" && H < 12) H += 12;
  else if (franja === "mati" && H === 12) H = 12;
  else if (!franja && H >= 1 && H <= 7) H += 12;
  return H * 60 + (min || 0);
}

export function parseCita(text, { now = new Date(), obres = [] } = {}) {
  const orig = String(text || "").trim();
  let s = " " + norm(orig).replace(/[,.;!?¿¡]+/g, " ").replace(/\s+/g, " ") + " ";
  const treure = [];
  const usa = (re, fn) => { const m = s.match(re); if (!m) return null; treure.push(m[0]); s = s.replace(m[0], " "); return fn ? fn(m) : m; };
  const avui = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dia = null, inici = null, fi = null, franja = null;

  // Franja del dia (abans que «mañana» = demà)
  usa(/\b(de|per) la (tarda|tarde|nit|noche)\b|\bdel vespre\b|\bpor la (tarde|noche)\b/, () => { franja = "tarda"; });
  if (!franja) usa(/\b(del mati|al mati|de la manana|por la manana)\b/, () => { franja = "mati"; });
  if (usa(/\b(a )?(migdia|mediodia)\b/)) inici = 12 * 60;

  // Dia
  usa(/\b(dema passat|passat dema|pasado manana)\b/, () => { dia = new Date(avui); dia.setDate(dia.getDate() + 2); });
  if (!dia) usa(/\b(dema|manana)\b/, () => { dia = new Date(avui); dia.setDate(dia.getDate() + 1); });
  if (!dia) usa(/\b(avui|hoy)\b/, () => { dia = new Date(avui); });
  if (!dia) usa(new RegExp(`\\b(d'aqui a|dins de|dentro de) (\\d+|${NUMW}) (dies|dias)\\b`), m => { dia = new Date(avui); dia.setDate(dia.getDate() + nombre(m[2])); });
  if (!dia) usa(new RegExp(`\\b(?:el |dia |el dia )?(\\d{1,2}) (?:d'|de )(${Object.keys(MESOS).join("|")})\\b`), m => {
    dia = new Date(avui.getFullYear(), MESOS[m[2]], +m[1]); if (dia < avui) dia.setFullYear(dia.getFullYear() + 1);
  });
  if (!dia) usa(new RegExp(`\\b(?:el |la |este |aquest |aquesta |el proper |el proxim |el proximo |el que ve |)(${Object.keys(DIES).join("|")})(?: que ve| que viene| vinent)?\\b`), m => {
    const w = DIES[m[1]]; dia = new Date(avui); let k = (w - avui.getDay() + 7) % 7; if (k === 0) k = 7; dia.setDate(dia.getDate() + k);
  });
  if (!dia) usa(/\b(?:el dia|dia|el) (\d{1,2})\b(?! (?:i |y )?(?:mitja|media|quart|cuarto|h\b|hores|horas|:))/, m => {
    const d = +m[1]; if (d < 1 || d > 31) return; dia = new Date(avui.getFullYear(), avui.getMonth(), d); if (dia < avui) dia.setMonth(dia.getMonth() + 1);
  });
  if (!dia) usa(/\b(la setmana que ve|la semana que viene|la propera setmana|la proxima semana)\b/, () => { dia = new Date(avui); dia.setDate(dia.getDate() + 7); });

  // Hora: quarts catalans («dos quarts de deu» = 9:30)
  if (inici == null) usa(new RegExp(`\\b(?:a )?(un|1|dos|2|tres|3) quarts? (?:i mig )?(?:de |d')(\\d{1,2}|${NUMW})\\b`), m => {
    const q = { un: 1, "1": 1, dos: 2, "2": 2, tres: 3, "3": 3 }[m[1]], h = nombre(m[2]); if (h == null) return;
    inici = horaAMin(h - 1, q * 15, franja); if (h - 1 === 0) inici = horaAMin(12, q * 15, franja);
  });
  // «a les 10», «a les 10:30», «a les deu i mitja», «a las 5 y cuarto», «a les 9 menys quart»
  const HORA = `(\\d{1,2})(?:[:.h](\\d{2}))?|${NUMW}`;
  const llegeixHora = (h, mm, extra) => {
    let base = nombre(h); if (base == null) return null;
    let min = mm ? +mm : 0;
    if (/mitja|media/.test(extra || "")) min = 30;
    else if (/menys quart|menos cuarto/.test(extra || "")) { base -= 1; min = 45; }
    else if (/quart|cuarto/.test(extra || "")) min = 15;
    return { base, min };
  };
  // «de 10 a 12», «de les 9 a les 11», «de 9 a 11 y media»
  if (inici == null) usa(new RegExp(`\\bde (?:les |las )?(${HORA}) a (?:les |las )?(${HORA})(?:\\s(i mitja|y media|i quart|y cuarto))?\\b`), m => {
    const a = llegeixHora(m[2] ?? m[1], m[3]), b = llegeixHora(m[5] ?? m[4], m[6], m[7]); if (!a || !b) return;
    inici = horaAMin(a.base, a.min, franja); let f = horaAMin(b.base, b.min, franja); if (f <= inici) f += 12 * 60; if (f - inici <= 12 * 60) fi = f;
  });
  if (inici == null) usa(new RegExp(`\\b(?:a les|a la|a las|les|las|cap a les|sobre les|sobre las)\\s(${HORA})(?:\\s(i mitja|y media|i quart|y cuarto|menys quart|menos cuarto))?(?:\\s(?:h|hores|horas))?\\b`), m => {
    const t = llegeixHora(m[2] ?? m[1], m[3], m[4]); if (t) inici = horaAMin(t.base, t.min, franja);
  });
  // «de 10 a 12», «fins a les 12», «hasta las 12»
  usa(new RegExp(`\\b(?:fins a les|fins les|hasta las|a les|a las|a)\\s(${HORA})(?:\\s(i mitja|y media|i quart|y cuarto))?\\b`), m => {
    if (inici == null) return; const t = llegeixHora(m[2] ?? m[1], m[3], m[4]); if (!t) return;
    let f = horaAMin(t.base, t.min, franja); if (f <= inici) f += 12 * 60; if (f > inici && f - inici <= 12 * 60) fi = f;
  });
  // Durada: «una hora», «dues hores», «hora i mitja», «mitja hora»
  if (inici != null && fi == null) usa(new RegExp(`\\b(?:durant |durante )?(mitja hora|media hora|(\\d|${NUMW}) (?:hora|hores|horas)(?: i mitja| y media)?|hora i mitja|hora y media|una hora)\\b`), m => {
    const t = m[1]; let d = 60;
    if (/mitja hora|media hora/.test(t) && !/\d|una|dues|dos|tres/.test(t.split(" ")[0])) d = 30;
    else if (/^hora (i|y) (mitja|media)$/.test(t)) d = 90;
    else { const n = nombre(t.split(" ")[0]) || 1; d = n * 60 + (/mitja|media/.test(t) ? 30 : 0); }
    fi = inici + d;
  });

  // Tipus
  let tipus = "";
  for (const [re, k] of TIPUS) if (re.test(s)) { tipus = k; break; }

  // Obra: la que té més paraules seves a la frase (si dues empaten, no se’n tria cap)
  const paraules = new Set(s.split(" ").filter(Boolean));
  let millor = null, puntsMillor = 0, empat = false;
  for (const o of obres || []) {
    const toks = [...new Set(norm(`${o.nom || ""} ${o.clientNom || ""}`).replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(w => (w.length >= 3 || /^\d+$/.test(w)) && !BUIDES.has(w)))];
    if (!toks.length) continue;
    const enc = toks.filter(w => paraules.has(w)).length;
    if (!enc) continue;
    const p = enc; // si dues obres tenen les mateixes paraules a la frase, és dubtós: no se’n tria cap
    if (p > puntsMillor) { millor = o; puntsMillor = p; empat = false; } else if (p === puntsMillor) empat = true;
  }
  const obra = empat ? null : millor;

  // Títol: la frase sense el dia ni l'hora ni les paraules de comanda
  let titol = treuAccentsSegur(orig, treure)
    .replace(/^\s*(posa['’]?m|apunta['’]?m|apunta|anota|crea|fes|pon(?:me)?|recorda['’]?m)\s+(?:una?\s+)?(?:cita\s+)?/i, "")
    .replace(/\s+/g, " ").replace(/^[\s,.\-–]+|[\s,.\-–]+$/g, "");
  if (titol) titol = titol[0].toUpperCase() + titol.slice(1);

  const out = { text: orig, tipus: tipus || "Visita d’obra", tipusDetectat: !!tipus, obraId: obra?.id || "", obraNom: obra?.nom || "", titol: titol || "" };
  if (dia) out.data = iso(dia);
  if (inici != null) { out.hora = hm(inici); out.horaFi = hm(fi ?? inici + 60); }
  return out;
}

// Treu de la frase original (amb accents i majúscules) els trossos reconeguts (que s'han buscat sense accents)
function treuAccentsSegur(orig, trossos) {
  let o = orig, n = norm(orig);
  for (const t of trossos) {
    const tt = t.trim(); if (!tt) continue;
    const i = n.indexOf(tt); if (i < 0) continue;
    o = o.slice(0, i) + " ".repeat(tt.length) + o.slice(i + tt.length);
    n = n.slice(0, i) + " ".repeat(tt.length) + n.slice(i + tt.length);
  }
  return o;
}
