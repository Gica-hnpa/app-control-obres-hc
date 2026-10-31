// V87.456 · Famílies dels recursos d'un descompost, com una base de preus (l'Héctor, 31/10/2026: «un llistat ordenat com una base de preus amb
// agrupacions de materials de la mateixa família i els seus preus: morters, i a dins morter de ciment pòrtland, morters flexibles o cola…;
// sanitaris, doncs els de la seva família»). Funció pura: mira el nom del recurs i el posa a una família; el que no s'hi assembla, a «Altres».

// en l'ordre de la llista (el de les bases de preus: de l'obra grossa als acabats)
export const FAMILIES = [
  ["runa", "Runa, transport i taxes"],
  ["arids", "Àrids"],
  ["ciment", "Ciment, calç i guix"],
  ["morters", "Morters, adhesius i pastes"],
  ["formigo", "Formigó"],
  ["acer", "Acer i ferralla"],
  ["ceramica", "Maons i ceràmica"],
  ["aillament", "Aïllaments i impermeabilització"],
  ["pladur", "Pladur i falsos sostres"],
  ["paviment", "Paviments i revestiments"],
  ["pintura", "Pintures i acabats"],
  ["fusteria", "Fusteria i mobles"],
  ["tancament", "Alumini, vidre i serralleria"],
  ["sanitaris", "Sanitaris i griferia"],
  ["lampisteria", "Lampisteria i sanejament"],
  ["electricitat", "Electricitat i il·luminació"],
  ["clima", "Calefacció i climatització"],
  ["auxiliars", "Mitjans auxiliars i petit material"],
  ["altres", "Altres"],
];

// l'ordre de les regles és el de prioritat: el més concret primer («placa de guix» és pladur, no guix; «aixeta» és sanitaris encara que digui «tub»)
const REGLES = [
  ["runa", /\b(enderroc\w*|demolicio\w*|demolicion\w*)\b/],
  ["sanitaris", /\b(inodor|wc|lavabo|bide|plat de dutxa|plato de ducha|aixeta|griferia|grifo|mampara|sifo|columna de dutxa|cisterna|bastidor|geberit|banyera|bañera|mirall|espejo|accessoris (de )?bany|pica|fregadero|encimera)\b/],
  ["pladur", /\b(pladur|placa de guix|placas? de yeso|guix laminat|yeso laminado|montants?|perfileria|fals sostre|falsos sostres|falso techo|trasdossat|trasdosado)\b/],
  ["aillament", /\b(aillament|aislamiento|llana (de roca|mineral)|lana (de roca|mineral)|xps|eps|poliestire|poliureta|tela asfaltica|lamina|impermeabilitz|impermeabiliz|kerdi|geotextil|membrana)\b/],
  ["morters", /\b(morter|mortero|ciment cola|cemento cola|cola|adhesius?|adhesivos?|pasta (de|per|para)|beurada|lechada|rejuntat|rejuntado|arrebossat|arrebossat|enfoscat|autonivellant|autonivelante)\b/],
  ["formigo", /\b(formigo|hormigon|solera)\b/],
  ["acer", /\b(ferralla|acer|acero|armadura|malla electrosoldada|mallazo|heb|hea|ipe|ipn|upn|perfil metal\w*|connector\w*|ancoratge\w*)\b/],
  ["ceramica", /\b(mao|maons|ladrillo\w*|totxana|totxo|bloc|blocs|bloque\w*|bovedilla|revolto|teula|teja|envan?)\b/],
  ["paviment", /\b(gres|porcellanic\w*|porcelanic\w*|rajola\w*|azulejo\w*|baldosa\w*|paviment\w*|revestiment\w*|socol\w*|rodapie|parquet|tarima|marbre|marmol|pedra natural|microciment|terratzo|ceramic\w*)\b/],
  ["pintura", /\b(pintura\w*|vernis|barniz|imprimacio|imprimacion|segelladora|sellador\w*|lasur|esmalt\w*)\b/],
  ["tancament", /\b(finestra\w*|ventana\w*|vidre\w*|vidrio\w*|alumini|aluminio|persiana\w*|screen\w*|barana\w*|barandilla\w*|reixa\w*|reja\w*|serralleria|cerrajeria)\b/],
  ["fusteria", /\b(portes?|puerta\w*|fusta|madera|dm|armari\w*|moble\w*|mueble\w*|tapete?s?|marcs?|melamina|roure|balda\w*|escriptori\w*|ferratge\w*|tirador\w*|frontisse\w*|bisagra\w*|manet\w*|premarc\w*)\b/],
  ["pintura", /\b(lacat\w*|lacado)\b/],
  ["clima", /\b(radiador\w*|caldera\w*|split\w*|aerotermi\w*|climatitz\w*|climatiz\w*|calefacc\w*|aire condicionat|aire acondicionado|fan ?coil)\b/],
  ["electricitat", /\b(cable\w*|mecanisme\w*|mecanismo\w*|interruptor\w*|endoll\w*|enchufe\w*|quadre electric|cuadro electrico|lluminaria\w*|luminaria\w*|llum|llums|led|electric\w*|tub corrugat)\b/],
  ["lampisteria", /\b(tub|tubs|tubo|tubos|canonada\w*|tuberia\w*|pvc|multicapa|valvula\w*|desguas\w*|desague\w*|sanejament|saneamiento|baixant\w*|bajante\w*|connexion\w*)\b/],
  ["ciment", /\b(ciment|cemento|cal|calc|guix|yeso|escaiola|escayola)\b/],
  ["arids", /\b(sorra\w*|arena\w*|grava\w*|arid\w*|gravilla)\b/],
  ["auxiliars", /\b(mitjans auxiliars|medios auxiliares|petits? materials?|pequeno material|consumible\w*|proteccion\w*|proteccio|proteccions|cinte?s|bastida\w*|andami\w*|puntal\w*|disc\w*|materials i accessoris|fixacion\w*|remats?)\b/],
  ["runa", /\b(runa|escombro\w*|contenidor\w*|contenedor\w*|transport\w*|carrega\w*|carga|taxes?|tasas?|big bag|abocador\w*|vertedero\w*|gestor\w*)\b/],
];

const net = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[·'’]/g, " ").replace(/\s+/g, " ").trim();

export function familiaRecurs(concepte) {
  const c = net(concepte);
  if (!c) return "altres";
  for (const [k, re] of REGLES) if (re.test(c)) return k;
  return "altres";
}

// les línies repartides per famílies, en l'ordre de la llista i cada família per nom: [{k, nom, linies, imp}]
export function perFamilies(linies = []) {
  const m = new Map();
  (linies || []).forEach(l => { const k = familiaRecurs(l?.concepte); if (!m.has(k)) m.set(k, []); m.get(k).push(l); });
  return FAMILIES.filter(([k]) => m.has(k)).map(([k, nom]) => {
    const ls = m.get(k).slice().sort((a, b) => String(a?.concepte || "").localeCompare(String(b?.concepte || ""), "ca", { numeric: true }));
    return { k, nom, linies: ls, imp: ls.reduce((s, l) => s + (+l?.imp || 0), 0) };
  });
}

// la mà d'obra per categories: una fila per categoria, encara que surti amb unitats diferents («h» i «h/m²»)
export function perCategories(linies = []) {
  const m = new Map();
  (linies || []).forEach(l => {
    const k = net(l?.concepte); const x = m.get(k) || { concepte: l?.concepte || "—", q: 0, imp: 0 };
    x.q += +l?.q || 0; x.imp += +l?.imp || 0; m.set(k, x);
  });
  return [...m.values()].sort((a, b) => b.imp - a.imp).map(x => ({ ...x, pu: x.q ? x.imp / x.q : 0 }));
}
