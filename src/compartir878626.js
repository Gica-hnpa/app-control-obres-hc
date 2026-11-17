// V87.626 · Compartir una obra triant QUÈ VEU i QUÈ POT FER (fase 1 de la proposta del 16/11/2026, contestada per l'Héctor el 17/11).
// Per a cada apartat de l'obra: «n» (no el veu: no surt del compte), «l» (lectura) o «m» (modificar). La configuració és de l'obra
// (`obra.compartir878626 = { model, ap: { fitxa:"m", docs:"l", … } }`), la posa el propietari i viatja amb l'obra perquè qui la rep
// sàpiga què pot fer. Sense configuració (les compartides d'abans i «Tot, com ara») tot continua igual que fins ara.
//  · En pujar l'obra compartida (cloudSync › localShare), les parts dels apartats «n» no hi van; als apartats «l» el pressupost porta
//    només el preu final (sense el preu d'abans de la comissió).
//  · En arribar canvis d'un altre compte (cloudSync › applyShared), a l'obra pròpia només entren els dels apartats «m»; la resta es
//    queda com era (i al cicle següent es torna a pujar la bona).
//  · Qui la rep no veu les pestanyes dels apartats «n», i les dels «l» són només de lectura.
// Fase 2: «Validar» la certificació; fase 3: l'enllaç per al client. Còpia a part per a cada persona: quan hi hagi la taula nova (SQL).
export const APARTATS878626 = [
  { k: "fitxa", nom: "Fitxa i contactes", claus: ["agents", "hiddenAgentIdentities878192", "fitxa878443", "passos878305", "obra"], tabs: ["Dades", "Agents"] },
  { k: "docs", nom: "Documents i plànols", claus: ["documents", "sectionDocs"], tabs: ["Documents", "Plànols", "Documentació"] },
  { k: "fotos", nom: "Fotos", claus: ["fotos"], tabs: ["Fotografies"] },
  { k: "dia", nom: "Dia a dia (partes, actes, notes, tasques)", claus: ["actes", "notes", "partes878349", "sectionNotes", "signaRemot878409", "tasques", "events"], tabs: ["Actes", "Notes", "Partes obra", "Tasques"] },
  { k: "planning", nom: "Planning", claus: ["ganttConfig87217"], tabs: ["Gantt", "Planning"] },
  { k: "pressupost", nom: "Pressupost", claus: ["partides", "pressupostos", "budgetGroups", "activeBudgetIdObra", "numPres878528", "principalBudgetName", "pressupost",
    "amidaments878328", "amidamentsFases878342", "versioPrincipal878528", "ivaPres878580", "capitolsTancats", "resumCapsPres878603", "condicions878368", "estatsPres878562",
    "descPartides878582", "preusVenda878352", "marges878378", "inicial878412"], re: /^pressupostRapid/, tabs: ["Pressupost", "Pressupost ràpid", "Amidaments", "Pressupost obra"] },
  { k: "cert", nom: "Certificacions", claus: ["certificacions", "certDesc878582", "certAdminMonthlyByNum"], tabs: ["Certificacions", "Certificacions obra"] },
  { k: "factura", nom: "Facturació i honoraris", claus: ["factures", "facturesObra878297", "facturesVF878285", "factParams", "facturesTecnic", "pressupostosTecnic"], tabs: ["Facturació", "Facturació obra", "Honoraris"] },
  { k: "economia", nom: "Hores, despeses i rendiment", claus: ["rendiment878342", "industrials878608", "hores", "temps"], tabs: ["Seguiment econòmic", "Rendiment", "Rendiments"] },
];
// Models (un toc) i, a sota, cada apartat es pot canviar.
export const MODELS878626 = {
  tot: { nom: "Tot, com ara", ap: null },
  equip: { nom: "Equip de l’obra", ap: { fitxa: "m", docs: "m", fotos: "m", dia: "m", planning: "m", pressupost: "m", cert: "m", factura: "n", economia: "n" } },
  valida: { nom: "Tècnic que valida", ap: { fitxa: "l", docs: "l", fotos: "l", dia: "n", planning: "l", pressupost: "l", cert: "l", factura: "n", economia: "n" } },
  mirar: { nom: "Només mirar", ap: { fitxa: "l", docs: "l", fotos: "l", dia: "l", planning: "l", pressupost: "l", cert: "l", factura: "n", economia: "n" } },
};
const PER_CLAU = new Map();
for (const a of APARTATS878626) for (const c of a.claus) PER_CLAU.set(c, a.k);
// apartat d'una part de les dades de l'obra (null: dates i altres, que sempre hi van)
export function apartatDe878626(clau) {
  if (PER_CLAU.has(clau)) return PER_CLAU.get(clau);
  for (const a of APARTATS878626) if (a.re && a.re.test(clau)) return a.k;
  return null;
}
// la configuració vàlida d'una obra (o null si es comparteix tot, com fins ara)
export function cfgObra878626(o) {
  const c = o && typeof o === "object" ? o.compartir878626 : null;
  if (!c || typeof c !== "object" || !c.ap || typeof c.ap !== "object") return null;
  const ap = {};
  for (const a of APARTATS878626) { const v = c.ap[a.k]; ap[a.k] = v === "n" || v === "l" || v === "m" ? v : "m"; }
  if (ap.fitxa === "n") ap.fitxa = "l"; // la fitxa sempre es veu (el nom, l'adreça…)
  return { model: String(c.model || ""), ap };
}
export const permis878626 = (cfg, apartat) => (!cfg || !apartat ? "m" : cfg.ap[apartat] || "m");
// sense el preu d'abans de la comissió (V87.346): als apartats de lectura, el pressupost porta només el preu final
const senseComissio = r => { if (!r || typeof r !== "object" || (r.puOrig878346 == null && r.com878346 == null)) return r; const { puOrig878346, com878346, ...x } = r; return x; };
// les dades de l'obra que surten del compte
export function filtraDades878626(d, cfg) {
  if (!cfg || !d || typeof d !== "object" || Array.isArray(d)) return d;
  const out = {};
  for (const [k, v] of Object.entries(d)) {
    const p = permis878626(cfg, apartatDe878626(k));
    if (p === "n") continue;
    out[k] = p === "l" && k === "partides" && Array.isArray(v) ? v.map(senseComissio) : v;
  }
  return out;
}
// el que arriba d'un altre compte, damunt de les dades pròpies: només els apartats «m»
export function ajuntaDades878626(local, remote, cfg) {
  if (!cfg) return remote;
  if (!remote || typeof remote !== "object" || Array.isArray(remote)) return local;
  const out = { ...(local && typeof local === "object" && !Array.isArray(local) ? local : {}) };
  const claus = new Set([...Object.keys(out), ...Object.keys(remote)]);
  for (const k of claus) {
    if (permis878626(cfg, apartatDe878626(k)) !== "m") continue;
    if (k in remote) out[k] = remote[k]; else delete out[k];
  }
  return out;
}
// la fitxa de l'obra que arriba d'un altre compte: només si la fitxa és «m»; la configuració sempre és la pròpia
export function ajuntaObra878626(local, remote, cfg) {
  if (!cfg) return remote;
  const base = cfg.ap.fitxa === "m" && remote && typeof remote === "object" ? { ...remote } : { ...(local || {}) };
  base.compartir878626 = local?.compartir878626;
  return base;
}
// a qui la rep: les pestanyes dels apartats «n» no hi són
export function tabsPermeses878626(tabs, cfg) {
  if (!cfg) return tabs;
  const fora = new Set(APARTATS878626.filter(a => cfg.ap[a.k] === "n").flatMap(a => a.tabs));
  return (tabs || []).filter(t => !fora.has(t));
}
export function permisTab878626(tab, cfg) {
  if (!cfg) return "m";
  const a = APARTATS878626.find(x => x.tabs.includes(tab));
  return a ? cfg.ap[a.k] || "m" : "m";
}
