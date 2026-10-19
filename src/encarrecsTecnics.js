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
};

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
