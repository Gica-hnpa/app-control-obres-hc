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

export function estatDocs(k, passos = {}, documents = []) {
  const tr = TRAMITS[k]; if (!tr) return null;
  const noCal = passos.docsNoCal || {}, fets = passos.docsFets || {};
  const llista = [...tr.docs.map(([key, nom]) => ({ key, nom })), ...(passos.docsPropis || []).map(nom => ({ key: "p:" + nom, nom, propi: true }))]
    // V87.333 · un document és fet si s'ha marcat (docsFets), s'hi ha adjuntat l'arxiu o (abans) s'havia marcat «No cal»
    .map(d => { const fitxers = (documents || []).filter(x => x && x.tramit878306 === d.key); return { ...d, fitxers, fet: fitxers.length > 0 || !!fets[d.key] || !!noCal[d.key], noCal: !!noCal[d.key] }; });
  const cal = llista, falten = cal.filter(d => !d.fet).length;
  return { nom: tr.nom, url: tr.url, docs: llista, falten, total: cal.length, aPunt: cal.length > 0 && falten === 0, presentat: passos.presentat || null };
}

// Quin encàrrec tècnic és una obra (pel tipus de feina); null si no n'és cap
export function encarrecDe(obra = {}) {
  const tipus = String(obra.tipusTreball || obra.tipologia || "");
  for (const [k, e] of Object.entries(ENCARRECS)) if (e.tipus.test(tipus)) return k;
  return null;
}

// Punts de cada pas (els de la llista i els propis de l'obra) i com va: pas actual = el primer que no té tots els punts fets
export function estatPassos(k, passos = {}) {
  const e = ENCARRECS[k]; if (!e) return null;
  const fets = passos.fets || {}, propis = passos.propis || {};
  const llista = e.passos.map((p, i) => {
    const items = [...p.items.map((text, n) => ({ id: `${p.k}.${n}`, text })), ...(propis[p.k] || []).map((text, n) => ({ id: `${p.k}.p${n}`, text, propi: true }))];
    const fet = items.filter(it => fets[it.id]).length;
    return { ...p, i, items, fet, total: items.length, complet: items.length > 0 && fet === items.length };
  });
  const actual = llista.findIndex(p => !p.complet);
  const fetTot = llista.reduce((s, p) => s + p.fet, 0), totalTot = llista.reduce((s, p) => s + p.total, 0);
  return { nom: e.nom, passos: llista, actual: actual < 0 ? llista.length : actual, acabat: actual < 0, fet: fetTot, total: totalTot };
}
