// V87.368 · Pressupost automàtic a partir dels amidaments (encàrrec de l'Héctor del 24/10/2026: «fer-ho automàticament un cop entrats
// els amidaments en Excel o BC3 —el PDF, si no hi ha més remei, revisant-lo bé—; els preus de la construcció de Girona; si hi ha alguna
// partida que no sap interpretar, que la IA busqui el preu amb el descompost en el mateix format que el BC3; i tenir sempre en compte
// l'adreça, els accessos dels materials, els permisos i la logística, que poden abaratir o encarir el pressupost»).
// Funcions pures (es proven sense navegador: tools/proves/preusautounit.mjs):
//   · llegirBancBc3(text)            → un banc de preus en BC3 (BEDEC, TCQ, Presto, CYPE…) amb el descompost de cada partida
//   · taulaDescomp(descomp, pu, nom) → el descompost en el format de l'app (descompostTable)
//   · fesIndex(items) / buscaPreu(partida, index) → el preu d'un amidament: pel codi o per una partida semblant amb la mateixa unitat
//   · partidesLogistica(cond, partides) → la implantació, la logística i els permisos de l'obra segons l'accés
//   · promptPreusIa({…}) / respostaIa(text, codis) → les instruccions per a la IA i la seva resposta (en BC3)

const net = s => String(s ?? "").replace(/\s+/g, " ").trim();
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const r4 = n => Math.round((Number(n) || 0) * 10000) / 10000;
const numBc3 = s => { const t = String(s ?? "").trim(); if (!t) return null; const n = Number(t.replace(",", ".")); return Number.isFinite(n) ? n : null; };
const sense = c => String(c || "").replace(/#+$/, "").trim();
export const normUt = u => {
  const x = net(u).replace(/\.$/, "").toLowerCase().replace("²", "2").replace("³", "3");
  if (/^m2$/.test(x)) return "m²"; if (/^m3$/.test(x)) return "m³"; if (/^(ml|m)$/.test(x)) return "m";
  if (/^(u|ud|uds|un|und|uts|ut|unitat|unidad|pza|pieza|peca)$/.test(x)) return "ut";
  if (/^(p\.?a|pa|partida)$/.test(x)) return "pa"; if (/^(kg|kgs)$/.test(x)) return "kg"; if (/^(h|hora|hores)$/.test(x)) return "h";
  return x;
};
const fmt = (n, d = 2) => (Math.round((Number(n) || 0) * 10 ** d) / 10 ** d).toFixed(d).replace(".", ",");

// ───────────── Banc de preus en BC3 ─────────────
// Al FIEBDC-3, el tipus del ~C diu què és: 0 partida, 1 mà d'obra, 2 maquinària, 3 material; els codis que comencen per «%» són
// percentatges (mitjans auxiliars, costos indirectes). Els capítols acaben en «#». El preu del ~C de la partida és el bo: el
// descompost serveix per veure com es fa (si no quadra al cèntim, la diferència va a una línia de percentatge).
const TIPUS = { "1": "MO", "2": "MAQ", "3": "MAT" };
export function llegirBancBc3(text) {
  const regs = String(text || "").replace(/\r/g, "").split(/(?:^|\n)~(?=[A-Z]\|)/).filter(Boolean);
  const C = new Map(), D = new Map(), T = new Map();
  let nom = "";
  for (const reg of regs) {
    const tipus = reg[0], f = reg.slice(2).replace(/\n$/, "").split("|");
    if (tipus === "C") {
      const codis = f[0].split("\\").filter(Boolean); if (!codis.length) continue;
      const raw = codis[0].trim(), k = sense(raw);
      const preus = String(f[3] || "").split("\\").map(numBc3).filter(x => x !== null);
      C.set(k, { raw, ut: normUt(f[1]), resum: net(f[2]), pu: preus.length ? preus[0] : null, tipus: net(f[5]), cap: /#$/.test(raw) });
      if (/##$/.test(raw) && !nom) nom = net(f[2]);
    } else if (tipus === "D") {
      const p = String(f[1] || "").split("\\"), out = [];
      for (let i = 0; i < p.length; i += 3) { if (!p[i] || !p[i].trim()) continue; out.push({ k: sense(p[i]), factor: numBc3(p[i + 1]) ?? 1, rend: numBc3(p[i + 2]) ?? 1 }); }
      D.set(sense(f[0]), out);
    } else if (tipus === "T") T.set(sense(f[0]), String(f[1] || "").trim());
  }
  const partides = [];
  for (const [k, c] of C) {
    if (c.cap || k.startsWith("%")) continue;
    const fills = D.get(k) || [];
    const elemental = ["1", "2", "3"].includes(c.tipus) && !fills.length;
    if (elemental) continue;                       // un recurs sol (mà d'obra, material…) no és una partida
    if (!fills.length && c.pu == null) continue;
    const descomp = fills.map(fl => {
      const e = C.get(fl.k) || {};
      if (fl.k.startsWith("%")) return { codi: fl.k, tipus: "%", concepte: e.resum || "Mitjans auxiliars", ut: "%", rend: r4(fl.factor * fl.rend), pu: e.pu };
      return { codi: fl.k, tipus: TIPUS[e.tipus] || (D.has(fl.k) ? "ALT" : "ALT"), concepte: e.resum || fl.k, ut: e.ut || "", rend: r4(fl.factor * fl.rend), pu: e.pu ?? 0 };
    });
    const directe = descomp.filter(x => x.tipus !== "%").reduce((s, x) => s + x.rend * (x.pu || 0), 0);
    const pu = c.pu != null ? c.pu : r2(directe);
    partides.push({ codi: k, ut: c.ut, concepte: c.resum || k, desc: T.get(k) || "", pu: r2(pu), descomp });
  }
  return { font: "BC3", nom, partides, avisos: partides.length ? [] : ["No s’hi ha trobat cap partida amb preu"] };
}

// el descompost en el format de l'app (el mateix que fan servir la fitxa de la partida i el resum del pressupost): seccions,
// recursos amb rendiment (q) i preu (pu), un percentatge (ut «%») per als mitjans auxiliars i la diferència fins al preu del banc,
// i el «PREU UNITARI FINAL». Els números van amb coma, com la resta de descompostos de l'app.
const SECCIONS = [["MO", "MÀ D’OBRA"], ["MAQ", "MAQUINÀRIA"], ["MAT", "MATERIALS"], ["ALT", "ALTRES"]];
export function taulaDescomp(descomp = [], pu = 0, titol = "", origen = "Banc de preus") {
  const st = Date.now().toString(36), rows = []; let i = 0;
  for (const [t, nom] of SECCIONS) {
    const ls = descomp.filter(x => x.tipus === t); if (!ls.length) continue;
    rows.push({ id: `s-${t}-${st}`, isSection: true, concepte: nom });
    for (const x of ls) rows.push({ id: `r${++i}-${st}`, codi: x.codi || "", concepte: x.concepte, ut: x.ut || "", q: fmt(x.rend, 4), pu: fmt(x.pu || 0, 2) });
  }
  const directe = descomp.filter(x => x.tipus !== "%").reduce((s, x) => s + x.rend * (x.pu || 0), 0);
  if (directe > 0 && pu > 0 && Math.abs(pu - directe) >= 0.005) {
    const pct = (pu / directe - 1) * 100;
    rows.push({ id: `s-pct-${st}`, isSection: true, concepte: "PERCENTATGES" });
    const noms = descomp.filter(x => x.tipus === "%").map(x => x.concepte).filter(Boolean);
    rows.push({ id: `pct-${st}`, concepte: noms.length ? noms.join(" · ") : "Mitjans auxiliars i arrodoniment", ut: "%", q: fmt(pct, 4) });
  }
  rows.push({ id: `fi-${st}`, concepte: "PREU UNITARI FINAL", ut: "u", q: "1,00" });
  return { source: origen, title: titol, rows };
}

// ───────────── Buscar el preu d'un amidament ─────────────
const STOP = new Set("de del dels la les el els lo los las amb per i a en d l un una uns unes al als o y con para por sin sobre segun segons fins hasta que tipus tipo mitjancant mediante inclos incluido inclou incluye formada format formado".split(" "));
const tokens = s => net(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’'`]/g, " ").replace(/[^a-z0-9ñç]+/g, " ")
  .split(" ").filter(w => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
  .map(w => w.replace(/s$/, "").replace(/[aeio]$/, "").slice(0, 7)); // «rases» i «rasa», «pous» i «pou»: el mateix mot
const codiNet = c => String(c || "").toUpperCase().replace(/[\s.\-_]/g, "");

// items: [{codi, ut, concepte, desc, pu, descomp?, descompostTable?, font}] (font: «llibreria» o «banc»)
export function fesIndex(items = []) {
  const perCodi = new Map(), perMot = new Map(), llista = [];
  for (const it of items) {
    if (!it || !(Number(it.pu) > 0)) continue;
    const e = { ...it, _ut: normUt(it.ut), _t: new Set(tokens(`${it.concepte} ${String(it.desc || "").slice(0, 160)}`)), _tc: new Set(tokens(it.concepte)) };
    const n = llista.push(e) - 1;
    const c = codiNet(it.codi); if (c && c.length >= 3 && !perCodi.has(c)) perCodi.set(c, n);
    for (const w of e._t) { if (!perMot.has(w)) perMot.set(w, []); perMot.get(w).push(n); }
  }
  return { perCodi, perMot, llista };
}

// torna {item, com:"codi"|"semblant", nota} o null. «semblant» vol dir que s'ha de revisar.
export function buscaPreu(p = {}, index, { minim = 0.5 } = {}) {
  if (!index || !index.llista.length) return null;
  const ut = normUt(p.ut);
  const c = codiNet(p.codi);
  if (c && c.length >= 3 && index.perCodi.has(c)) {
    const it = index.llista[index.perCodi.get(c)];
    if (!ut || !it._ut || it._ut === ut) return { item: it, com: "codi", nota: "Mateix codi" };
  }
  const tp = new Set(tokens(`${p.concepte} ${String(p.desc || "").slice(0, 160)}`)), tc = new Set(tokens(p.concepte));
  if (!tp.size) return null;
  const vots = new Map();
  for (const w of tp) for (const n of index.perMot.get(w) || []) vots.set(n, (vots.get(n) || 0) + 1);
  let millor = null, nota = 0;
  for (const [n, v] of vots) {
    const it = index.llista[n];
    if (ut && it._ut && it._ut !== ut) continue;   // una partida en m² no pot tenir el preu d'una en m³
    let comuC = 0; for (const w of tc) if (it._tc.has(w)) comuC++;
    const dice = 2 * v / (tp.size + it._t.size);
    const diceC = tc.size && it._tc.size ? 2 * comuC / (tc.size + it._tc.size) : 0;
    const s = Math.max(dice, diceC * 0.95);
    if (s > nota) { nota = s; millor = it; }
  }
  if (!millor || nota < minim) return null;
  return { item: millor, com: "semblant", nota: `Semblant (${Math.round(nota * 100)} %)`, puntuacio: nota };
}

// ───────────── Implantació, logística i permisos ─────────────
// cond: {acces:"facil"|"limitat"|"dificil", carrer:"normal"|"estret"|"vianants", contenidor:"obra"|"via"|"sacs", planta:0…,
//        ascensor:bool, elevacio:"no"|"muntacarregues"|"grua", abocadorKm, horari:bool, ocupat:bool, llicencia:"no"|"comunicacio"|"llicencia",
//        tallCarrer:bool, setmanes}
// Les quantitats surten dels amidaments quan es pot (runes en m³ d'enderrocs i excavacions); els preus, del banc o de la llibreria
// (es busquen igual que les altres partides) o de la IA. Tot queda «a revisar».
const RUNA = /enderroc|demolici|derrib|runa|escombro|excavaci|desmunt|desmont|arrencad|arranque|picat|picado|repicat|buidat|vaciado/i;
export const COND_DEFECTE = { acces: "facil", carrer: "normal", contenidor: "via", planta: 0, ascensor: true, elevacio: "no", abocadorKm: "", horari: false, ocupat: false, llicencia: "comunicacio", tallCarrer: false, setmanes: "" };
export function partidesLogistica(cond = {}, partides = []) {
  const k = { ...COND_DEFECTE, ...cond };
  const out = [], add = (codi, ut, concepte, q, nota) => out.push({ codi, cap: "00 Implantació, logística i permisos", ut, concepte, desc: "", q: r2(q), pu: null, logistica: true, nota });
  const m3 = partides.filter(p => normUt(p.ut) === "m³" && RUNA.test(`${p.concepte} ${p.desc || ""}`)).reduce((s, p) => s + (Number(p.q) || 0), 0);
  const runa = r2(m3 * 1.3);                          // esponjament
  const setm = Number(k.setmanes) || 0;
  if (k.contenidor === "sacs") add("L.01", "ut", "Sac de runa (big bag) d’1 m³, col·locació, recollida i transport a abocador autoritzat", Math.max(1, Math.ceil(runa || 1)), runa ? `${fmt(runa)} m³ de runa (amb esponjament)` : "Sense amidaments de runa: 1 de mínim");
  else add("L.01", "ut", `Contenidor de 6 m³ per a runes, ${k.contenidor === "via" ? "a la via pública, " : "dins de l’obra, "}col·locació, recollida i transport a abocador autoritzat`, Math.max(1, Math.ceil((runa || 6) / 6)), runa ? `${fmt(runa)} m³ de runa (amb esponjament)` : "Sense amidaments de runa: 1 de mínim");
  if (k.contenidor === "via" || k.carrer !== "normal") add("L.02", "ut", "Permís d’ocupació de la via pública (taxa municipal) per a contenidor, aplec de materials o bastida", 1, "Segons les ordenances del municipi");
  if (k.tallCarrer) add("L.03", "ut", "Permís i senyalització de tall de carrer per a càrrega i descàrrega, amb personal de senyalització", 1, "");
  if (k.llicencia === "llicencia") add("L.04", "ut", "Tramitació de la llicència d’obres (taxa i impost de construccions a part)", 1, "La taxa i l’ICIO depenen del municipi i del pressupost");
  else if (k.llicencia === "comunicacio") add("L.04", "ut", "Tramitació de la comunicació prèvia d’obres a l’ajuntament", 1, "");
  const planta = Number(k.planta) || 0;
  if (k.elevacio === "muntacarregues") add("L.05", "set", "Lloguer de muntacàrregues per a materials, muntatge i desmuntatge", setm || 1, setm ? "" : "Posar les setmanes d’obra");
  if (k.elevacio === "grua") add("L.05", "dia", "Camió grua per a la pujada de materials", Math.max(1, Math.ceil((setm || 1) / 2)), "");
  if (planta >= 1 && !k.ascensor && k.elevacio === "no") add("L.06", "pa", `Pujada i baixada manual de materials i runes a la planta ${planta} sense ascensor`, 1, "Es pot valorar en hores d’ajudant");
  if (k.acces !== "facil" || k.carrer === "vianants") add("L.07", "pa", `Transport intern de materials per accés ${k.acces === "dificil" || k.carrer === "vianants" ? "difícil (sense arribar-hi el camió)" : "limitat"}: descàrrega i trasllat amb carretó fins a l’obra`, 1, "");
  if (k.ocupat) add("L.08", "pa", "Protecció de l’habitatge ocupat: tancaments provisionals, protecció de terres i mobles, i neteja diària", 1, "");
  if (k.horari) add("L.09", "pa", "Sobrecost per horari restringit de càrrega i descàrrega", 1, "");
  add("L.10", "pa", "Neteja final d’obra i retirada de mitjans auxiliars", 1, "");
  return out;
}
// el % de més a la mà d'obra quan l'accés és difícil (es fa servir a les instruccions de la IA i a l'avís del resum)
export const pctAcces = cond => { const k = { ...COND_DEFECTE, ...cond }; let p = 0; if (k.acces === "limitat") p += 3; if (k.acces === "dificil") p += 8; if (k.carrer === "vianants") p += 3; if ((Number(k.planta) || 0) >= 2 && !k.ascensor) p += 4; return p; };

export function resumCondicions(cond = {}, obra = {}) {
  const k = { ...COND_DEFECTE, ...cond }, L = [];
  const adr = net([obra.adreca, obra.poblacio].filter(Boolean).join(", "));
  if (adr) L.push(`Adreça de l’obra: ${adr}`);
  L.push(`Accés de camions: ${{ facil: "fàcil, el camió arriba a peu d’obra", limitat: "limitat (camió petit o descàrrega a distància)", dificil: "difícil, el camió no hi arriba" }[k.acces] || k.acces}`);
  L.push(`Carrer: ${{ normal: "normal", estret: "estret o casc antic", vianants: "zona de vianants" }[k.carrer] || k.carrer}`);
  L.push(`Runes: ${{ obra: "contenidor dins de l’obra", via: "contenidor a la via pública (cal permís)", sacs: "sacs (no hi cap contenidor)" }[k.contenidor] || k.contenidor}`);
  const planta = Number(k.planta) || 0;
  L.push(planta ? `Planta ${planta}, ${k.ascensor ? "amb ascensor" : "sense ascensor"}` : "Planta baixa");
  if (k.elevacio !== "no") L.push(`Elevació de materials: ${k.elevacio === "grua" ? "camió grua" : "muntacàrregues"}`);
  if (k.abocadorKm) L.push(`Abocador a ${k.abocadorKm} km`);
  if (k.horari) L.push("Horari restringit de càrrega i descàrrega");
  if (k.ocupat) L.push("Habitatge ocupat durant l’obra");
  if (k.tallCarrer) L.push("Cal tallar el carrer per a la càrrega i descàrrega");
  L.push(`Tràmit: ${{ no: "cap", comunicacio: "comunicació prèvia", llicencia: "llicència d’obres" }[k.llicencia] || k.llicencia}`);
  if (k.setmanes) L.push(`Durada prevista: ${k.setmanes} setmanes`);
  return L;
}

// ───────────── IA: instruccions i resposta ─────────────
// La IA respon en BC3 (FIEBDC-3) perquè l'app ja el sap llegir i el descompost queda igual que el d'un banc de preus.
export function promptPreusIa({ obra = {}, cond = {}, partides = [], provincia = "Girona", any = new Date().getFullYear(), ambPlanols = false } = {}) {
  const ctx = resumCondicions(cond, obra), pct = pctAcces(cond);
  const linies = partides.map(p => `${p.codi} | ${p.ut || "?"} | ${net(p.concepte)}${p.desc ? " — " + net(p.desc).slice(0, 400) : ""} | quantitat ${fmt(p.q, 2)}`);
  return [
    `Ets un tècnic de pressupostos d’obra de la província de ${provincia}. Fes el preu unitari de cada partida de la llista amb el seu descompost, amb preus de mercat de ${any} per a ${provincia} (com el BEDEC de l’ITeC o el generador de preus de CYPE de la zona).`,
    ``,
    `OBRA: ${net(obra.nom || "")}${obra.tipus ? " · " + obra.tipus : ""}`,
    ...ctx.map(x => "- " + x),
    pct ? `- Per l’accés i la logística, la mà d’obra rendeix menys: compta-hi un ${pct} % de temps de més.` : "",
    ambPlanols ? `- Et passo els plànols de l’obra: fes-los servir per entendre com és i per revisar les quantitats.` : "",
    ``,
    `PARTIDES (codi | unitat | descripció | quantitat):`,
    ...linies,
    ``,
    `RESPON NOMÉS AMB UN ARXIU BC3 (FIEBDC-3), sense cap text abans ni després, amb aquest format exacte:`,
    `~C|<codi de la partida>|<unitat>|<resum curt>|<preu unitari>||0|`,
    `~D|<codi de la partida>|<codi recurs>\\1\\<rendiment>\\<codi recurs>\\1\\<rendiment>\\|`,
    `~C|<codi recurs>|<unitat>|<nom del recurs>|<preu del recurs>||<tipus: 1 mà d’obra, 2 maquinària, 3 material>|`,
    `~T|<codi de la partida>|<d’on surt el preu i què cal revisar>|`,
    `Normes:`,
    `- Fes servir exactament els codis de partida de la llista. Els recursos poden tenir codis propis (p. ex. MO.OF1, MAT.CIM…).`,
    `- Números amb punt decimal i sense símbol de moneda. El preu de la partida ha de ser la suma de rendiment × preu dels recursos (pots afegir un recurs «%MA» de tipus 0 amb el % de mitjans auxiliars).`,
    `- No t’inventis una partida que no entenguis: posa-hi preu 0 i, al ~T, «A CONFIRMAR» i el motiu.`,
    `- Si la llista és llarga, pots dividir la resposta en parts; acaba cada part amb la línia «CONTINUARÀ» i espera que et digui «continua».`,
  ].filter(x => x !== "").join("\n");
}

// llegeix la resposta (pot venir en diverses parts, amb text de més o dins d'un bloc de codi) i torna, per a cada codi demanat,
// {pu, descomp, nota, confirmar}. Els codis que no hi són, no hi surten.
export function respostaIa(text = "", codis = []) {
  const net0 = String(text || "").replace(/```[a-z0-9]*\n?/gi, "").replace(/^\s*CONTINUARÀ\s*$/gim, "");
  const linies = net0.split(/\r?\n/).map(l => l.trim()).filter(l => /^~[CDTKV]\|/.test(l));
  if (!linies.length) return { preus: {}, avisos: ["La resposta no porta cap línia de BC3 (~C, ~D…)"] };
  const banc = llegirBancBc3(linies.join("\n"));
  const perCodi = new Map(banc.partides.map(p => [codiNet(p.codi), p]));
  const textos = new Map(); for (const l of linies) if (l.startsWith("~T|")) { const f = l.split("|"); textos.set(codiNet(f[1]), net(f[2])); }
  const preus = {}, falten = [];
  for (const c of codis) {
    const p = perCodi.get(codiNet(c)); if (!p) { falten.push(c); continue; }
    const nota = textos.get(codiNet(c)) || "";
    preus[c] = { pu: p.pu, descomp: p.descomp, nota, confirmar: !(p.pu > 0) || /a confirmar/i.test(nota) };
  }
  const avisos = falten.length ? [`La IA no ha tornat el preu de: ${falten.join(", ")}`] : [];
  return { preus, avisos };
}
