// V87.305 · Encàrrecs tècnics (mòdul tècnic, encàrrec de l'Héctor del 19/10/2026; docs/proposta-perfil-tecnic.md, versió 1):
// cèdula d'habitabilitat, certificat energètic i inspecció d'edifici. Cada encàrrec té 6 passos i, a cada pas, una llista de
// comprovació. A cada obra s'hi poden afegir punts propis. El que es marca es desa dins de l'obra (data.passos878305):
// { fets: { "<pas>.<n>": true, … }, propis: { "<pas>": ["text", …] } }.
// Les dades de normativa (anys de validesa, organismes) no hi són: estan pendents de confirmar amb l'Héctor.

export const ENCARRECS = {
  cedula: {
    nom: "Cèdula d’habitabilitat",
    tipus: /c[èe]dula/i,
    passos: [
      { k: "encarrec", nom: "Encàrrec", items: ["Dades del propietari i de l’habitatge", "Referència cadastral", "Pressupost acceptat"] },
      { k: "documentacio", nom: "Documentació", items: ["Cèdula anterior (si n’hi ha)", "Escriptura o nota simple", "Plànol de l’habitatge"] },
      { k: "visita", nom: "Visita", items: ["Superfície útil de cada peça", "Alçades lliures", "Obertures (il·luminació i ventilació)", "Programa mínim (estança, cuina, bany)", "Aigua, electricitat i desguassos", "Fotos"] },
      { k: "oficina", nom: "Oficina", items: ["Croquis amb les superfícies", "Certificat"] },
      { k: "tramit", nom: "Tràmit", items: ["Presentació a l’Agència de l’Habitatge"] },
      { k: "lliurament", nom: "Lliurament", items: ["Cèdula al client", "Factura", "Data de venciment apuntada"] },
    ],
  },
  cee: {
    nom: "Certificat energètic",
    tipus: /certificat energ[èe]tic|efici[èe]ncia energ/i,
    passos: [
      { k: "encarrec", nom: "Encàrrec", items: ["Dades del client i de l’immoble", "Referència cadastral", "Ús de l’immoble (habitatge, local…)", "Pressupost acceptat"] },
      { k: "documentacio", nom: "Documentació", items: ["Plànols o croquis", "Any de construcció", "Factures o dades de les instal·lacions", "Reformes fetes"] },
      { k: "visita", nom: "Visita", items: ["Orientació i superfícies", "Façanes, coberta i terra (tipus i aïllament)", "Finestres (vidre, marc, persianes)", "Calefacció, aigua calenta i refrigeració (tipus, any, potència)", "Fotos de cada element"] },
      { k: "oficina", nom: "Oficina", items: ["Dades passades al programa del certificat", "Millores proposades"] },
      { k: "tramit", nom: "Tràmit", items: ["Registre a l’ICAEN", "Etiqueta energètica"] },
      { k: "lliurament", nom: "Lliurament", items: ["Certificat i etiqueta al client", "Factura", "Data de venciment apuntada"] },
    ],
  },
  ite: {
    nom: "Inspecció d’edifici",
    tipus: /\bITE\b|IEE|inspecci[óo] d.edifici|inspecci[óo] t[èe]cnica/i,
    passos: [
      { k: "encarrec", nom: "Encàrrec", items: ["Comunitat de propietaris i president o administrador", "Dades de l’edifici (any, plantes, habitatges)", "Pressupost acceptat"] },
      { k: "documentacio", nom: "Documentació", items: ["Inspecció anterior", "Llibre de l’edifici", "Obres fetes", "Plànols"] },
      { k: "visita", nom: "Visita", items: ["Fonaments i estructura", "Façanes i balcons", "Coberta", "Instal·lacions comunes", "Zones comunes", "Deficiències amb gravetat, foto i lloc"] },
      { k: "oficina", nom: "Oficina", items: ["Informe amb les deficiències ordenades per gravetat", "Qualificació de l’edifici", "Actuacions i terminis"] },
      { k: "tramit", nom: "Tràmit", items: ["Presentació a l’Agència de l’Habitatge"] },
      { k: "lliurament", nom: "Lliurament", items: ["Informe a la comunitat", "Factura", "Data de la propera inspecció apuntada"] },
    ],
  },
  // V87.324 · Amiant: localització i diagnosi (UNE 171370-2:2021). L'Héctor, 21/10/2026: «millor un checklist o redireccionar-me
  // a les pàgines on ho he de preparar». Llista proposada perquè la corregeixi.
  amiant: {
    nom: "Amiant",
    tipus: /amiant/i,
    passos: [
      { k: "encarrec", nom: "Encàrrec", items: ["Propietari o comunitat (i administrador)", "Any de construcció o de les reformes (abans del 2002, possible amiant)", "Abast: tot l’edifici o només unes zones", "Motiu: venda, obres, ajuts, requeriment de l’Ajuntament", "Pressupost acceptat"] },
      { k: "documentacio", nom: "Documentació", items: ["Plànols de l’edifici", "Inspecció tècnica (ITE) anterior", "Obres i reformes fetes", "Fotos o dades de materials sospitosos"] },
      { k: "visita", nom: "Visita", items: ["Cobertes i plaques de fibrociment", "Baixants, canals i xemeneies", "Dipòsits d’aigua", "Aïllaments de canonades, calderes i conductes", "Paviments vinílics, coles i morters", "Falsos sostres i revestiments projectats", "Estat de cada material (bo, deteriorat, friable)", "Mostres amb protecció, etiquetades i fotografiades", "Lloc de cada material al plànol"] },
      { k: "oficina", nom: "Oficina", items: ["Mostres al laboratori acreditat", "Inventari: material, lloc, quantitat, estat i risc", "Prioritat d’actuació", "Plànols amb la localització", "Recomanacions: mantenir, encapsular o retirar"] },
      { k: "tramit", nom: "Retirada i ajuts", items: ["Pressupost d’una empresa inscrita al RERA", "Pla de treball aprovat per Treball (el presenta l’empresa)", "Ajuts de l’Agència de Residus (si hi ha convocatòria oberta)", "Comunicació a l’Ajuntament, si ho demana"] },
      { k: "lliurament", nom: "Lliurament", items: ["Informe al client", "Factura", "Data de la propera revisió apuntada"] },
    ],
  },
};

// V87.306 · Documents del tràmit (l'Héctor, 19/10/2026: els passos que s'han de marcar per avançar no l'ajuden a la visita;
// vol una llista de consulta i «un apartat per entrar documents abans de l'enllaç amb Habitatge o Indústria»). Llista proposada
// perquè la corregeixi. Cada document es puja a Documents de l'obra (camp `tramit878306` = la clau) o es marca «No cal»
// (`passos878305.docsNoCal`); se n'hi poden afegir de propis (`passos878305.docsPropis`, la clau és «p:<nom>»).
export const TRAMITS = {
  cedula: {
    nom: "Presentar a l’Agència de l’Habitatge",
    url: "https://tramits.gencat.cat/ca/tramits/tramits-temes/Cedula-dhabitabilitat-de-segona-ocupacio",
    docs: [["sollicitud", "Sol·licitud signada pel propietari"], ["certificat", "Certificat d’habitabilitat signat"], ["planol", "Plànol amb les superfícies (MagicPlan)"], ["fotos", "Fotos de l’habitatge"], ["dni", "DNI o NIF del propietari"], ["propietat", "Escriptura, nota simple o rebut de l’IBI"], ["representacio", "Autorització de representació (si ho tramites tu)"], ["anterior", "Cèdula anterior (si n’hi ha)"], ["taxa", "Justificant de pagament de la taxa"]],
  },
  cee: {
    nom: "Registrar a l’ICAEN",
    url: "https://icaen.gencat.cat/ca/energia/usos_energia/edificis/certificacio/index.html",
    docs: [["certificat", "Certificat energètic signat (PDF del CE3X)"], ["xml", "Fitxer de registre del CE3X (XML)"], ["fotos", "Fotos de l’immoble"], ["dni", "DNI o NIF del propietari"], ["representacio", "Autorització de representació (si ho tramites tu)"], ["taxa", "Justificant de pagament de la taxa"]],
  },
  ite: {
    nom: "Presentar a l’Agència de l’Habitatge",
    url: "",
    docs: [["informe", "Informe d’inspecció signat"], ["fotos", "Fotos de les deficiències"], ["encarrec", "Acord o encàrrec de la comunitat"], ["representacio", "Autorització de representació"], ["anterior", "Inspecció anterior (si n’hi ha)"], ["taxa", "Justificant de pagament de la taxa"]],
  },
};

// Com van els documents d'un encàrrec: quins hi són (documents de l'obra amb `tramit878306`), quins no calen i quants en falten
// V87.324 · amiant: el botó porta als ajuts de l'Agència de Residus (pàgina comprovada el 21/10/2026)
TRAMITS.amiant = {
  nom: "Ajuts per retirar l’amiant (Agència de Residus)",
  url: "https://residus.gencat.cat/ca/consultes_i_tramits_-_nou/subvencions/amiant/",
  docs: [["informe", "Informe de localització i diagnosi signat"], ["laboratori", "Resultats del laboratori (mostres)"], ["inventari", "Inventari de materials amb l’estat i el risc"], ["planols", "Plànols amb la localització"], ["fotos", "Fotos de cada material"], ["propietat", "Document de la propietat (nota simple, escriptura o IBI)"], ["pressupost", "Pressupost de retirada d’una empresa RERA"], ["acord", "Acord de la junta (comunitats)"]],
};

// V87.440 · documents finals (l'Héctor, 30/10/2026: «el de tramitació, els acusaments de rebut al departament que sigui i els documents
// finals que es generen»): van a la carpeta Tramitació i es marquen al pas «Lliurament». La clau porta «f:» al davant.
TRAMITS.cedula.finals = [["rebut", "Acusament de rebut de l’Agència de l’Habitatge"], ["cedula", "Cèdula d’habitabilitat"]];
TRAMITS.cee.finals = [["rebut", "Acusament de rebut de l’ICAEN"], ["etiqueta", "Etiqueta energètica registrada"]];
TRAMITS.ite.finals = [["rebut", "Acusament de rebut"]];
TRAMITS.amiant.finals = [["rebut", "Acusament de rebut, si es presenta"]];

// V87.440 · A quina carpeta de Documents va cada document de l'encàrrec (l'Héctor: «només hi ha documents previs i després de tramitació…
// i després sí que hauria d'haver una de fotos»)
export const PREVIS = "01_DOCUMENTACIO_PREVIA", TRAMITACIO = "01_TRAMITS_AJUNTAMENT", FOTOS = "06B_FOTOS_OBRA";
const DOCS_PREVIS = new Set(["dni", "propietat", "anterior", "representacio", "planol", "planols", "encarrec", "acord", "visita"]);
export function carpetaDoc(key = "") { return DOCS_PREVIS.has(key) ? PREVIS : TRAMITACIO; }

export function estatDocs(k, passos = {}, documents = [], nFotos = 0) {
  const tr = TRAMITS[k]; if (!tr) return null;
  const noCal = passos.docsNoCal || {}, fets = passos.docsFets || {};
  const estat = d => { const fitxers = (documents || []).filter(x => x && x.tramit878306 === d.key); const fotos = d.key === "fotos" && nFotos > 0; return { ...d, fitxers, fotos, fet: fitxers.length > 0 || fotos || !!fets[d.key] || !!noCal[d.key], noCal: !!noCal[d.key] }; };
  const llista = [...tr.docs.map(([key, nom]) => ({ key, nom })), ...(passos.docsPropis || []).map(nom => ({ key: "p:" + nom, nom, propi: true }))]
    // V87.333 · un document és fet si s'ha marcat (docsFets), s'hi ha adjuntat l'arxiu o (abans) s'havia marcat «No cal»
    .map(estat);
  const finals = (tr.finals || []).map(([key, nom]) => estat({ key: "f:" + key, nom }));
  const cal = llista, falten = cal.filter(d => !d.fet).length;
  return { nom: tr.nom, url: tr.url, docs: llista, finals, falten, total: cal.length, aPunt: cal.length > 0 && falten === 0, presentat: passos.presentat || null };
}

// Quin encàrrec tècnic és una obra (pel tipus de feina); null si no n'és cap
// V87.443 · Fitxa de la visita (l'Héctor, 30/10/2026: «el plànol, les fotos i les dades que em genera el MagicPlan… un apartat per poder
// incorporar la documentació i després, amb la targeta de preparació amb IA, emplenar o llegir el que calgui»). Cada treball té els seus camps;
// [clau, nom, text llarg]. Es desa a l'obra (data.fitxa878443 = {clau: valor}).
export const FITXA_VISITA = {
  cee: [["tipus", "Tipus d’edifici"], ["any", "Any de construcció"], ["zona", "Zona climàtica"], ["superficie", "Superfície útil habitable (m²)"], ["alcada", "Alçada lliure (m)"], ["plantes", "Nombre de plantes"], ["orientacio", "Orientació de les façanes"], ["facanes", "Façanes (tipus i aïllament)", 1], ["finestres", "Finestres (m² per orientació, vidre i marc)", 1], ["coberta", "Coberta", 1], ["terra", "Terra", 1], ["calefaccio", "Calefacció", 1], ["acs", "Aigua calenta (ACS)", 1], ["refrigeracio", "Refrigeració", 1]],
  cedula: [["any", "Any de construcció"], ["superficie", "Superfície útil (m²)"], ["alcada", "Alçada lliure (m)"], ["dormitoris", "Nombre de dormitoris"], ["peces", "Peces i superfícies", 1], ["ventilacio", "Ventilació i il·luminació", 1], ["instal", "Instal·lacions", 1]],
  ite: [["any", "Any de construcció"], ["plantes", "Nombre de plantes"], ["habitatges", "Nombre d’habitatges"], ["estructura", "Estructura", 1], ["facanes", "Façanes i cobertes", 1], ["instal", "Instal·lacions", 1], ["deficiencies", "Deficiències", 1]],
  amiant: [["tipus", "Tipus d’edifici"], ["any", "Any de construcció"], ["elements", "Elements inspeccionats (lloc, material i estat)", 1], ["mostres", "Mostres preses", 1], ["risc", "Valoració del risc", 1]],
};
const nomCamp = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\([^)]*\)/g, " ").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
// Les instruccions per a ChatGPT o Claude: omplir la fitxa amb la documentació de la visita. Res no s'inventa, i el que no se sap es deixa buit.
export function promptFitxa(k, { nomTreball = "", dades = "", text = "", altres = [] } = {}) {
  const camps = FITXA_VISITA[k] || [];
  const parts = [
    "Soc arquitecte tècnic i estic fent aquest treball d’un immoble existent a Catalunya: " + (nomTreball || "encàrrec tècnic") + ".",
    dades ? "Dades: " + dades + "." : "",
    "Omple la fitxa de sota amb el que puguis treure de la documentació de la visita. Respon en català, amb una línia per camp i exactament aquest format, i deixa buit el que no sàpigues (no t’inventis cap dada):",
    camps.map(c => c[1] + ":").join("\n"),
  ];
  if (k === "cee") parts.push("Després, escriu una línia amb --- i, a sota, per al CE3X: la zona climàtica de la població segons el CTE, els valors per defecte que acostuma a posar el CE3X segons l’any de construcció, quan convé fer servir valors coneguts, i les mesures de millora més habituals amb el text per posar-les al certificat.");
  else parts.push("Després, escriu una línia amb --- i, a sota, el que hauria de comprovar o que falta per poder acabar el treball.");
  if (altres.length) parts.push("T’adjunto també aquests arxius (plànols o fotos): " + altres.join(", ") + ".");
  if (text) parts.push("DOCUMENTACIÓ DE LA VISITA:\n" + text);
  return parts.filter(Boolean).join("\n\n");
}
// Llegeix la resposta: «Camp: valor», amb guions o negretes si n'hi ha, i les línies següents d'un valor llarg. Acaba a la línia ---.
export function llegirFitxa(k, resposta = "") {
  const camps = FITXA_VISITA[k] || [];
  const perNom = new Map();
  camps.forEach(c => { perNom.set(nomCamp(c[1]), c[0]); perNom.set(nomCamp(c[0]), c[0]); });
  const out = {};
  let act = null;
  for (const brut of String(resposta).split(/\r?\n/)) {
    const l = brut.replace(/^[\s>*•·\-–]+/, "").replace(/\*\*/g, "").replace(/\s+$/, "");
    if (/^\s*[-–—_*]{3,}\s*$/.test(brut)) break;
    const m = l.match(/^([^:：]{2,70})[:：]\s*(.*)$/);
    const clau = m ? perNom.get(nomCamp(m[1])) : null;
    if (clau) { act = clau; out[clau] = m[2].trim(); continue; }
    if (act && l.trim() && camps.find(c => c[0] === act)?.[2]) out[act] = (out[act] ? out[act] + "\n" : "") + l.trim();
    else if (!l.trim()) act = null;
  }
  for (const c of Object.keys(out)) if (!out[c] || /^(—|-|–|n\/?d|no consta|desconegut|sense dades|\?)\.?$/i.test(out[c])) delete out[c];
  return { camps: out, n: Object.keys(out).length };
}
export function encarrecDe(obra = {}) {
  const tipus = String(obra.tipusTreball || obra.tipologia || "");
  for (const [k, e] of Object.entries(ENCARRECS)) if (e.tipus.test(tipus)) return k;
  return null;
}

// V87.440 · Els punts que l'app ja sap no cal marcar-los (l'Héctor, 30/10/2026: marcar «com si el tingués» per poder continuar no és la
// millor manera): es marquen sols amb el que hi ha a l'expedient. Text del punt → què el fa bo.
const AUTO_PUNTS = {
  "Dades del propietari i de l’habitatge": "client", "Dades del client i de l’immoble": "client",
  "Referència cadastral": "rc", "Pressupost acceptat": "pressupost", "Factura": "factura",
  "Fotos": "fotos", "Fotos de cada element": "fotos", "Fotos de les deficiències": "fotos",
  "Presentació a l’Agència de l’Habitatge": "presentat", "Registre a l’ICAEN": "presentat",
  "Data de venciment apuntada": "venciment", "Data de la propera inspecció apuntada": "venciment", "Data de la propera revisió apuntada": "venciment",
};
export function autoPunts(obra = {}, data = {}, client = null) {
  const buit = v => { const s = String(v || "").trim(); return !s || /^(pendent|pendiente|particular)$/i.test(s); };
  const ps = data.passos878305 || {};
  return {
    client: !buit(client?.nom || obra.propietat) && !buit(obra.adreca),
    rc: String(obra.rc || "").replace(/[^0-9a-z]/gi, "").length >= 14,
    pressupost: (data.pressupostosTecnic || []).some(p => /acceptat|facturat/i.test(String(p.estat || "")) && !/no acceptat/i.test(String(p.estat || ""))),
    factura: (data.facturesTecnic || []).some(f => !/anul/i.test(String(f.estat || ""))),
    fotos: (data.fotos || []).length > 0,
    presentat: !!ps.presentat, venciment: !!ps.venciment,
  };
}

// Punts de cada pas (els de la llista i els propis de l'obra) i com va: pas actual = el primer que no té tots els punts fets
export function estatPassos(k, passos = {}, auto = {}) {
  const e = ENCARRECS[k]; if (!e) return null;
  const fets = passos.fets || {}, propis = passos.propis || {};
  const llista = e.passos.map((p, i) => {
    const items = [...p.items.map((text, n) => ({ id: `${p.k}.${n}`, text, auto: !!auto[AUTO_PUNTS[text]] })), ...(propis[p.k] || []).map((text, n) => ({ id: `${p.k}.p${n}`, text, propi: true }))];
    const fet = items.filter(it => it.auto || fets[it.id]).length;
    return { ...p, i, items, fet, total: items.length, complet: items.length > 0 && fet === items.length };
  });
  const actual = llista.findIndex(p => !p.complet);
  const fetTot = llista.reduce((s, p) => s + p.fet, 0), totalTot = llista.reduce((s, p) => s + p.total, 0);
  return { nom: e.nom, passos: llista, actual: actual < 0 ? llista.length : actual, acabat: actual < 0, fet: fetTot, total: totalTot };
}

// V87.440 · Com va tot l'encàrrec: els passos amb els documents (els de presentar a «Tràmit», els finals a «Lliurament»), el pas on som, què
// toca ara i què ha quedat pendent d'abans. On som = l'últim pas amb feina marcada (si és sencer, el següent): si un punt d'un pas no
// es té, es continua igualment i queda a «pendents», sense haver-lo de marcar com si es tingués.
export function resumEncarrec(k, passos = {}, documents = [], auto = {}, nFotos = 0) {
  const e = estatPassos(k, passos, auto), dd = estatDocs(k, passos, documents, nFotos);
  if (!e || !dd) return null;
  const fets = passos.fets || {};
  const llista = e.passos.map(p => {
    const docs = p.k === "tramit" ? dd.docs : p.k === "lliurament" ? dd.finals : [];
    const fet = p.fet + docs.filter(d => d.fet).length, total = p.total + docs.length;
    return { ...p, llDocs: docs, fet, total, complet: total > 0 && fet === total };
  });
  const amb = llista.map(p => p.items.some(it => fets[it.id]) || p.llDocs.some(d => d.fet && !d.fotos));
  let pos = Math.max(amb.lastIndexOf(true), 0);
  while (pos < llista.length && llista[pos].complet) pos++;
  const acabat = pos >= llista.length;
  const faltaDe = p => [...p.items.filter(it => !(it.auto || fets[it.id])).map(it => ({ pas: p.k, nomPas: p.nom, text: it.text, propi: !!it.propi })), ...p.llDocs.filter(d => !d.fet).map(d => ({ pas: p.k, nomPas: p.nom, text: d.nom, propi: !!d.propi }))];
  const ara = acabat ? null : faltaDe(llista[pos])[0] || null;
  const pendents = llista.filter(p => p.i < pos).flatMap(faltaDe);
  const fet = llista.reduce((n, p) => n + p.fet, 0), total = llista.reduce((n, p) => n + p.total, 0);
  return { nom: e.nom, passos: llista, dd, pos, actual: acabat ? "" : llista[pos].k, acabat, ara, pendents, fet, total, pct: total ? Math.round(fet / total * 100) : 0 };
}
