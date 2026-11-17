// V87.626 · Compartir una obra triant QUÈ VEU i QUÈ POT FER (fase 1 de la proposta del 16/11/2026, contestada per l'Héctor el 17/11).
// Per a cada apartat de l'obra: «n» (no el veu: no surt del compte), «l» (lectura) o «m» (modificar). La configuració és de l'obra
// (`obra.compartir878626 = { model, ap: { fitxa:"m", docs:"l", … } }`), la posa el propietari i viatja amb l'obra perquè qui la rep
// sàpiga què pot fer. Sense configuració (les compartides d'abans i «Tot, com ara») tot continua igual que fins ara.
//  · En pujar l'obra compartida (cloudSync › localShare), les parts dels apartats «n» no hi van; als apartats «l» el pressupost porta
//    només el preu final (sense el preu d'abans de la comissió).
//  · En arribar canvis d'un altre compte (cloudSync › applyShared), a l'obra pròpia només entren els dels apartats «m»; la resta es
//    queda com era (i al cicle següent es torna a pujar la bona).
//  · Qui la rep no veu les pestanyes dels apartats «n», i les dels «l» són només de lectura.
// V87.627 · Fase 2: a les certificacions, també «v» (Validar): les veu com de lectura i només en pot tornar l'estat (validada o tornada),
// qui ho diu, quan i el comentari (`certificacions[].validacio878627`). Fase 3: l'enllaç per al client. Còpia a part per a cada persona:
// quan hi hagi la taula nova (SQL).
export const APARTATS878626 = [
  { k: "fitxa", nom: "Fitxa i contactes", claus: ["agents", "hiddenAgentIdentities878192", "fitxa878443", "passos878305", "obra"], tabs: ["Dades", "Agents"] },
  { k: "docs", nom: "Documents i plànols", claus: ["documents", "sectionDocs"], tabs: ["Documents", "Plànols", "Documentació"] },
  { k: "fotos", nom: "Fotos", claus: ["fotos"], tabs: ["Fotografies"] },
  { k: "dia", nom: "Dia a dia (partes, actes, notes, tasques)", claus: ["actes", "notes", "partes878349", "sectionNotes", "signaRemot878409", "tasques", "events", "assistents878406"], tabs: ["Actes", "Notes", "Partes obra", "Tasques"] },
  { k: "planning", nom: "Planning", claus: ["ganttConfig87217"], tabs: ["Gantt", "Planning"] },
  { k: "pressupost", nom: "Pressupost", claus: ["partides", "pressupostos", "budgetGroups", "activeBudgetIdObra", "numPres878528", "principalBudgetName", "pressupost",
    "amidaments878328", "amidamentsFases878342", "versioPrincipal878528", "ivaPres878580", "capitolsTancats", "resumCapsPres878603", "condicions878368", "estatsPres878562",
    "descPartides878582", "preusVenda878352", "marges878378", "inicial878412", "dtePres878580", "economicRecoveryV87214"], re: /^pressupostRapid/, tabs: ["Pressupost", "Pressupost ràpid", "Amidaments", "Pressupost obra"] },
  { k: "cert", nom: "Certificacions", claus: ["certificacions", "certDesc878582", "certAdminMonthlyByNum", "contrast878424", "certificationRecoveryV87215"], tabs: ["Certificacions", "Certificacions obra"] },
  { k: "factura", nom: "Facturació i honoraris", claus: ["factures", "facturesObra878297", "facturesVF878285", "factParams", "facturesTecnic", "pressupostosTecnic"], tabs: ["Facturació", "Facturació obra", "Honoraris"] },
  { k: "economia", nom: "Hores, despeses i rendiment", claus: ["rendiment878342", "industrials878608", "hores", "temps"], tabs: ["Seguiment econòmic", "Rendiment", "Rendiments"] },
];
// Models (un toc) i, a sota, cada apartat es pot canviar.
export const MODELS878626 = {
  tot: { nom: "Tot, com ara", ap: null },
  equip: { nom: "Equip de l’obra", ap: { fitxa: "m", docs: "m", fotos: "m", dia: "m", planning: "m", pressupost: "m", cert: "m", factura: "n", economia: "n" } },
  valida: { nom: "Tècnic que valida", ap: { fitxa: "l", docs: "l", fotos: "l", dia: "n", planning: "l", pressupost: "l", cert: "v", factura: "n", economia: "n" } },
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
  for (const a of APARTATS878626) { const v = c.ap[a.k]; ap[a.k] = v === "n" || v === "l" || v === "m" || (v === "v" && a.k === "cert") ? v : "m"; }
  if (ap.fitxa === "n") ap.fitxa = "l"; // la fitxa sempre es veu (el nom, l'adreça…)
  return { model: String(c.model || ""), ap };
}
export const permis878626 = (cfg, apartat) => (!cfg || !apartat ? "m" : cfg.ap[apartat] || "m");
// V87.633 · la més estricta de dues configuracions (la de l'aparell i la que porta la fila del núvol): un altre aparell del mateix
// compte pot tenir-ne una de més nova o encara cap. Ordre: n < l < v < m.
const ORDRE878633 = { n: 0, l: 1, v: 2, m: 3 };
export function mesEstricta878633(a, b) {
  if (!a) return b || null; if (!b) return a;
  const ap = {};
  for (const x of APARTATS878626) { const p = a.ap[x.k] || "m", q = b.ap[x.k] || "m"; ap[x.k] = ORDRE878633[p] <= ORDRE878633[q] ? p : q; }
  return { model: a.model || b.model || "", ap };
}
// V87.633 · als apartats de lectura (o de validar), el pressupost porta només el preu final: sense el preu d'abans de la comissió (V87.346),
// ni els descompostos ni els costos, d'on es podria treure (la revisió del 17/11: amb el descompost es veia la comissió)
const intern878633 = k => /^(descompost|cost)/.test(k) || k === "puOrig878346" || k === "com878346";
const senseIntern = r => { if (!r || typeof r !== "object" || !Object.keys(r).some(intern878633)) return r; const x = {}; for (const [k, v] of Object.entries(r)) if (!intern878633(k)) x[k] = v; return x; };
const NOMES_M878633 = new Set(["marges878378", "preusVenda878352", "economicRecoveryV87214"]); // com es fan els preus: només amb el pressupost «Modificar»
// les dades de l'obra que surten del compte
export function filtraDades878626(d, cfg) {
  if (!cfg || !d || typeof d !== "object" || Array.isArray(d)) return d;
  const out = {};
  for (const [k, v] of Object.entries(d)) {
    const p = permis878626(cfg, apartatDe878626(k));
    if (p === "n") continue;
    if ((p === "l" || p === "v") && NOMES_M878633.has(k)) continue;
    out[k] = (p === "l" || p === "v") && k === "partides" && Array.isArray(v) ? v.map(senseIntern) : v;
  }
  return out;
}
// el que arriba d'un altre compte, damunt de les dades pròpies: només els apartats «m». V87.633 · les parts que no són de cap apartat
// (dates i altres) només si la fitxa és «m»; i mai s'esborra una part que no hi és (pot ser d'un aparell que no la tenia).
export function ajuntaDades878626(local, remote, cfg) {
  if (!cfg) return remote;
  if (!remote || typeof remote !== "object" || Array.isArray(remote)) return local;
  const out = { ...(local && typeof local === "object" && !Array.isArray(local) ? local : {}) };
  for (const k of Object.keys(remote)) {
    const p = permis878626(cfg, apartatDe878626(k) || "fitxa");
    if (p === "v" && k === "certificacions") { out[k] = ambValidacions878627(out[k], remote[k]); continue; }
    if (p !== "m") continue;
    out[k] = remote[k];
  }
  return out;
}
// V87.633 · hi ha parts dels apartats «No» amb contingut? (una fila pujada per un aparell d'abans de la V87.626)
export function teApartatsNo878633(d, cfg) {
  if (!cfg || !d || typeof d !== "object" || Array.isArray(d)) return false;
  const ple = v => Array.isArray(v) ? v.length > 0 : v && typeof v === "object" ? Object.keys(v).length > 0 : v != null && v !== "";
  return Object.entries(d).some(([k, v]) => permis878626(cfg, apartatDe878626(k)) === "n" && ple(v));
}
// V87.627 · de les certificacions que arriben de qui valida, només la validació (validada o tornada), i només si és posterior a la pròpia
// (a l'enviament per validar, si encara no s'ha validat). Les quantitats validades són les de la versió enviada (no les que diu qui valida).
export function ambValidacions878627(loc, rem) {
  if (!Array.isArray(loc)) return loc;
  const per = new Map((Array.isArray(rem) ? rem : []).filter(c => c && c.id != null).map(c => [String(c.id), c]));
  return loc.map(c => {
    const v = per.get(String(c?.id))?.validacio878627;
    if (!v || typeof v !== "object" || !["validada", "tornada"].includes(v.estat) || !v.at) return c;
    const l = c.validacio878627;
    if (l && l.estat === "pendent" && String(v.at) <= String(l.enviat || "")) return c;
    if (l && l.estat !== "pendent" && String(l.at || "") >= String(v.at)) return c;
    const { estat, per: qui, at, comentari, qv, doc } = v;
    // V87.628 · i, si s'ha validat amb la signatura de l'AutoFirma, el PDF signat (l'arxiu és a l'espai de l'obra de qui l'ha compartida)
    const pdf = estat === "validada" && doc && typeof doc === "object" && doc.id ? { id: String(doc.id).slice(0, 200), nom: String(doc.nom || "").slice(0, 200) } : undefined;
    return { ...c, validacio878627: { ...(l || {}), estat, per: String(qui || "").slice(0, 120), at: String(at), comentari: String(comentari || "").slice(0, 2000), qv: l?.q && typeof l.q === "object" ? l.q : (qv && typeof qv === "object" ? qv : undefined), doc: pdf } };
  });
}
// la fitxa de l'obra que arriba d'un altre compte: només si la fitxa és «m»; la configuració sempre és la pròpia
export function ajuntaObra878626(local, remote, cfg) {
  if (!cfg) return remote;
  const base = cfg.ap.fitxa === "m" && remote && typeof remote === "object" ? { ...remote } : { ...(local || {}) };
  base.compartir878626 = local?.compartir878626;
  if (local?.enllac878629) base.enllac878629 = local.enllac878629;
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
