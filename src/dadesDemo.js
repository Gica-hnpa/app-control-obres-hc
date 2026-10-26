// V87.328 · Dades d'exemple dels comptes de prova (l'Héctor, 21/10/2026: «una versió amb un usuari i contrasenya inventat per
// cadascun dels perfils»). Tot és inventat: noms, adreces, telèfons (600 000 0xx), correus (@exemple.test) i referències.
// Les dates són a partir d'avui, perquè l'agenda, les tasques i les hores surtin vives. L'App hi posa els codis d'expedient,
// les plantilles de cada tipus de feina i l'estructura buida de cada obra (dadesDemoApp878328 a App.jsx).

const dia = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const iso = n => { const d = dia(n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const ara = () => new Date().toISOString();

const CLIENTS = {
  marta: { id: "client-demo-marta", nom: "Marta Puig Serra", rao: "", tipus: "Particular", contacte: "Marta Puig", telefon: "600 000 001", email: "marta.puig@exemple.test", adreca: "C/ Nou, 5, 3r 1a", codiPostal: "17230", poblacio: "Palamós", nif: "00000001R", color: "blue", logo: "" },
  comunitat: { id: "client-demo-comunitat", nom: "Comunitat de Propietaris C/ Major 12", rao: "Comunitat de Propietaris C/ Major 12", tipus: "Promotor", contacte: "Anna Ferrer (administradora)", telefon: "600 000 002", email: "administracio@exemple.test", adreca: "C/ Major, 12", codiPostal: "17220", poblacio: "Sant Feliu de Guíxols", nif: "H00000002", color: "green", logo: "" },
  immo: { id: "client-demo-immo", nom: "Immobiliària Costa Prova", rao: "Immobiliària Costa Prova SL", tipus: "Immobiliària / agència", contacte: "Laia Soler", telefon: "600 000 003", email: "laia@exemple.test", adreca: "Av. de Castell d’Aro, 40", codiPostal: "17250", poblacio: "Platja d’Aro", nif: "B00000003", color: "orange", logo: "" },
  jordi: { id: "client-demo-jordi", nom: "Jordi Vila Roca", rao: "", tipus: "Particular", contacte: "Jordi Vila", telefon: "600 000 004", email: "jordi.vila@exemple.test", adreca: "Mas Roca, s/n", codiPostal: "17251", poblacio: "Calonge", nif: "00000004W", color: "purple", logo: "" },
  promo: { id: "client-demo-promo", nom: "Promocions Empordà Prova", rao: "Promocions Empordà Prova SL", tipus: "Promotor", contacte: "Xavier Pons", telefon: "600 000 005", email: "xavier.pons@exemple.test", adreca: "C/ de la Riera, 20", codiPostal: "17001", poblacio: "Girona", nif: "B00000005", color: "teal", logo: "" },
};

// Pressupost d'una reforma: capítols, partides i el que s'ha certificat (quantitat de cada certificació)
const REFORMA = [
  ["01 ENDERROCS", "01.01", "m2", "Enderroc d’envà de maó i retirada de runa", 8, 18.5, [8]],
  ["01 ENDERROCS", "01.02", "ut", "Retirada de sanitaris i mobiliari de cuina", 1, 320, [1]],
  ["01 ENDERROCS", "01.03", "m3", "Càrrega i transport de runa a l’abocador", 6, 42, [6]],
  ["02 PALETERIA", "02.01", "m2", "Envà de maó foradat de 7 cm", 14, 32.8, [14]],
  ["02 PALETERIA", "02.02", "m2", "Arrebossat de morter de ciment", 40, 16.4, [20, 20]],
  ["02 PALETERIA", "02.03", "m2", "Paviment de gres porcellànic", 52, 38, [0, 26]],
  ["03 INSTAL·LACIONS", "03.01", "pa", "Instal·lació elèctrica completa de l’habitatge", 1, 3200, [0, 0.5]],
  ["03 INSTAL·LACIONS", "03.02", "pa", "Instal·lació de lampisteria i desguassos", 1, 2450, [0, 0.6]],
  ["03 INSTAL·LACIONS", "03.03", "ut", "Plat de dutxa i mampara de vidre", 1, 690, []],
  ["04 ACABATS", "04.01", "m2", "Pintura plàstica en parets i sostres", 180, 7.2, []],
  ["04 ACABATS", "04.02", "ut", "Porta interior de fusta lacada", 5, 285, []],
  ["04 ACABATS", "04.03", "ml", "Sòcol de fusta", 66, 6.8, []],
];
const FACANA = [
  ["01 BASTIDA I PROTECCIONS", "01.01", "m2", "Bastida tubular a façana, muntatge i lloguer", 320, 9.5, [320]],
  ["01 BASTIDA I PROTECCIONS", "01.02", "ut", "Proteccions col·lectives i senyalització", 1, 480, [1]],
  ["02 REPARACIÓ DE FAÇANA", "02.01", "m2", "Sanejat de fissures i reparació del revestiment", 140, 34, [40]],
  ["02 REPARACIÓ DE FAÇANA", "02.02", "ml", "Reparació de cantells de balcó amb morter", 60, 48, []],
  ["03 PINTURA", "03.01", "m2", "Pintura de façana al silicat, dues mans", 320, 14.5, []],
];
const COBERTA = [
  ["01 RETIRADA DE FIBROCIMENT", "01.01", "m2", "Retirada de plaques de fibrociment per empresa RERA", 210, 22, []],
  ["02 COBERTA NOVA", "02.01", "m2", "Panell sandvitx de 30 mm", 210, 38, []],
  ["02 COBERTA NOVA", "02.02", "ml", "Canal de xapa lacada", 28, 26, []],
];
function partides(llista) {
  return llista.map(([cap, codi, ut, concepte, q, pu, certs]) => {
    const certsByNum = {}; const extra = {};
    (certs || []).forEach((c, i) => { if (c) { certsByNum[String(i + 1)] = c; extra[`cert_${i + 1}`] = c; } });
    return { codi, cap, ut, concepte, desc: "", q, pu, certsByNum, ...extra, budgetId: "principal", tipus: "Exemple" };
  });
}
function certificacions(llista, dates) {
  const rows = partides(llista);
  return dates.map((d, i) => ({ id: `cert-demo-${i + 1}-${Math.random().toString(36).slice(2, 7)}`, numero: String(i + 1), data: iso(d), estat: i < dates.length - 1 ? "Cobrada" : "Pendent", budgetId: "principal", import: Math.round(rows.reduce((s, r) => s + (r.certsByNum[String(i + 1)] || 0) * r.pu, 0) * 100) / 100, createdAt: ara(), updatedAt: ara() }));
}
// planning: cada capítol rere l'anterior, a partir d'un dia (dies laborables); des de la V87.341, vinculats (si se n'allarga un, els
// de després es mouen) i el 3r comença 2 dies abans que acabi el 2n
// qui: per a cada capítol, qui hi treballa (la colla o un treballador; Agenda › Equip)
function planning(llista, inici, dies, qui = []) {
  const caps = [...new Set(llista.map(x => x[0]))]; const capPlans = {}; let d = inici;
  caps.forEach((c, i) => { capPlans[c] = { start: iso(d), durationDays: dies[i] || 5, ...(i ? { dep: caps[i - 1], lag: i === 2 ? "-2" : "0" } : {}), ...(qui[i]?.length ? { qui: qui[i] } : {}) }; d += Math.round((dies[i] || 5) * 7 / 5); });
  return { plannedStart: iso(inici), capPlans, updatedAt: ara() };
}
const nota = (n, d, text) => ({ id: `nota-demo-${n}-${Math.random().toString(36).slice(2, 7)}`, numero: n, data: iso(d), text, fotos: [], docs: [], createdAt: ara(), updatedAt: ara() });
const tasca = (k, d, text, prioritat = "Normal", estat = "Pendent") => ({ id: `tsk-demo-${k}`, data: iso(d), hora: "09:00", text, estat, prioritat, createdAt: ara() });
function cita(k, d, hora, title, tipus, obra, client) {
  const x = dia(d);
  return { id: `ev-demo-${k}`, day: x.getDate(), month: x.getMonth(), year: x.getFullYear(), hora, horaFi: "", title, tipus, type: tipus, obra: obra.nom, obraId: obra.id, client: client?.nom || "", adreca: [obra.adreca, obra.poblacio].filter(Boolean).join(", "), iso: iso(d), color: "blue", note: "", detail: "" };
}
const hora = (k, d, hores, feina, extra = {}) => ({ id: `h-demo-${k}`, data: iso(d), hores, tipusRegistre: "Honoraris", tipusFeina: feina, observacions: "", preuHora: 50, createdAt: ara(), ...extra });

// Cada obra: dades bàsiques (l'App hi posa el codi i la plantilla) i el que porta dins
const COLLA = { k: "c:Colla 1", nom: "Colla 1" }, MARC = { k: "t:treb-demo-marc", nom: "Marc Prova" };
function obres(perfil) {
  const o = (k, nom, tipus, client, estat, adreca, poblacio, codiPostal, extra = {}) => ({ k, obra: { id: `obra-demo-${k}`, nom, tipus, client, estat, adreca, poblacio, codiPostal, rc: extra.rc || "", subtitol: extra.subtitol || "", constructor: extra.constructor || "Pendent", deo: extra.deo || "Pendent", do: extra.do || "Pendent" }, dades: extra.dades || {} });
  const tecnic = [
    o("cedula", "Cèdula pis C/ de la Riera 8, 2n 1a", "Cèdula d’habitabilitat", CLIENTS.immo, "En procés", "C/ de la Riera, 8, 2n 1a", "Palamós", "17230", { rc: "0000001AB0000A0001AA", dades: {
      tasques: [tasca("ced1", -1, "Demanar la nota simple a la propietat", "Alta"), tasca("ced2", 1, "Visita per prendre mides (MagicPlan)")],
      pressupostosTecnic: [{ id: "pt-demo-ced", numero: "P-DEMO-01", data: iso(-12), concepte: "Cèdula d’habitabilitat de segona ocupació", text: "", base: 180, iva: 21, estat: "Acceptat" }],
      citaK: [["ced", 1, "10:00", "Visita cèdula C/ de la Riera 8", "Visita"]] } }),
    o("cee", "Certificat energètic Av. del Mar 23", "Certificat energètic", CLIENTS.marta, "Pressupostat", "Av. del Mar, 23, 1r", "Sant Feliu de Guíxols", "17220", { dades: {
      pressupostosTecnic: [{ id: "pt-demo-cee", numero: "P-DEMO-02", data: iso(-3), concepte: "Certificat d’eficiència energètica de l’habitatge", text: "", base: 150, iva: 21, estat: "Pendent" }],
      tasques: [tasca("cee1", 3, "Trucar per saber si accepta el pressupost")] } }),
    o("ite", "Inspecció tècnica C/ Major 12", "ITE / IEE / inspecció d’edifici", CLIENTS.comunitat, "En procés", "C/ Major, 12", "Sant Feliu de Guíxols", "17220", { dades: {
      pressupostosTecnic: [{ id: "pt-demo-ite", numero: "P-DEMO-03", data: iso(-30), concepte: "Inspecció tècnica de l’edifici (IITE)", text: "", base: 950, iva: 21, estat: "Acceptat" }],
      facturesTecnic: [{ id: "ft-demo-ite", numero: "F-DEMO-01", data: iso(-8), concepte: "50 % a l’encàrrec de la inspecció", text: "", base: 475, iva: 21, retencio: 15, descompte: 0, estat: "Pendent", pressupostId: "pt-demo-ite", createdAt: ara(), updatedAt: ara() }],
      notes: [nota(1, -6, "Visita a la coberta: fissures a l’ampit del terrat i rajola aixecada a la cantonada nord. Cal fotografiar-ho millor el dia de la inspecció completa.")],
      tasques: [tasca("ite1", 5, "Redactar l’informe d’inspecció")],
      citaK: [["ite", 4, "09:30", "Inspecció de façanes i coberta", "Visita"]] } }),
    o("amiant", "Amiant coberta magatzem Mas Roca", "Amiant (localització i diagnosi)", CLIENTS.jordi, "Pendent de resposta", "Mas Roca, s/n", "Calonge", "17251", { dades: { tasques: [tasca("ami1", 2, "Enviar el pressupost de la diagnosi")] } }),
  ];
  const direccio = o("reforma-do", "Reforma habitatge C/ Nou 5", "Direcció / seguiment d’obra", CLIENTS.marta, "En curs / Actiu", "C/ Nou, 5, 3r 1a", "Palamós", "17230", { constructor: "Construccions Prova SL", deo: "Despatx Tècnic Prova", dades: {
    pressupostosTecnic: [{ id: "pt-demo-do", numero: "P-DEMO-04", data: iso(-70), concepte: "Direcció d’execució de l’obra", text: "", base: 2400, iva: 21, estat: "Acceptat" }],
    facturesTecnic: [{ id: "ft-demo-do", numero: "F-DEMO-02", data: iso(-20), concepte: "Primer pagament de la direcció d’execució", text: "", base: 1200, iva: 21, retencio: 15, descompte: 0, estat: "Pendent", pressupostId: "pt-demo-do", createdAt: ara(), updatedAt: ara() }],
    notes: [nota(1, -14, "Enderrocs acabats. S’han retirat els envans de la cuina i el bany; la biga de l’entrada està bé."), nota(2, -4, "Revisada la paleteria: arrebossats correctes. Falta col·locar els tubs de l’electricitat abans del paviment.")],
    tasques: [tasca("do1", 0, "Revisar el replanteig del bany amb el lampista", "Alta"), tasca("do2", 7, "Preparar la certificació de final de mes")],
    citaK: [["do", 2, "08:30", "Visita d’obra C/ Nou 5", "Visita d’obra"]],
    horesK: [["do1", -14, 1.5, "Visita d’obra"], ["do2", -7, 2, "Visita d’obra"], ["do3", -4, 1, "Visita d’obra"], ["do4", -2, 0.75, "Oficina"]] } });
  const constructora = [
    o("reforma", "Reforma integral pis C/ Nou 5", "Gestió integral d’obra", CLIENTS.marta, "En curs / Actiu", "C/ Nou, 5, 3r 1a", "Palamós", "17230", { constructor: "Construccions Prova SL", dades: {
      partides: partides(REFORMA), certificacions: certificacions(REFORMA, [-40, -10]), ganttConfig87217: planning(REFORMA, -45, [5, 15, 12, 10], [[COLLA], [COLLA], [], [COLLA]]),
      notes: [nota(1, -3, "Arribat el gres porcellànic: 55 m² al pis. Falta la mampara (setmana que ve).")],
      tasques: [tasca("ref1", 0, "Col·locar el paviment del menjador", "Alta"), tasca("ref2", 2, "Rebre la mampara i el plat de dutxa"), tasca("ref3", -1, "Tancar el pas d’instal·lacions del bany", "Urgent")],
      citaK: [["ref", 0, "08:00", "Arribada del material (gres i morter)", "Material"], ["ref2", 3, "12:00", "Visita de la direcció d’obra", "Visita d’obra"]],
      horesK: [["r1", -5, 8, "Paleta", { treballador: true, observacions: "Arrebossats del bany" }], ["r2", -4, 8, "Paleta", { treballador: true, observacions: "Envà de la cuina" }], ["r3", -3, 7.5, "Paleta", { treballador: true, observacions: "Paviment de l’habitació" }], ["r4", -1, 8, "Paleta", { treballador: true, observacions: "Paviment del passadís" }]] } }),
    o("facana", "Façana Comunitat C/ Major 12", "Gestió integral d’obra", CLIENTS.comunitat, "Acceptat", "C/ Major, 12", "Sant Feliu de Guíxols", "17220", { constructor: "Construccions Prova SL", dades: {
      partides: partides(FACANA), certificacions: certificacions(FACANA, [-6]), ganttConfig87217: planning(FACANA, -12, [5, 15, 10], [[MARC], [MARC], [MARC]]),
      tasques: [tasca("fac1", 1, "Revisar els ancoratges de la bastida", "Alta")],
      citaK: [["fac", 1, "07:30", "Inici de la reparació de façana", "Obra"]],
      horesK: [["f1", -2, 8, "Oficial", { treballador: true, observacions: "Sanejat de fissures" }]] } }),
    o("coberta", "Coberta magatzem Mas Roca", "Gestió integral d’obra", CLIENTS.jordi, "Pressupostat", "Mas Roca, s/n", "Calonge", "17251", { dades: { partides: partides(COBERTA), tasques: [tasca("cob1", 4, "Demanar pressupost de retirada a l’empresa RERA")] } }),
  ];
  if (perfil === "tecnic") return [...tecnic, direccio];
  if (perfil === "constructor") return constructora;
  if (perfil === "complet") return [...tecnic.slice(0, 2), direccio, ...constructora];
  if (perfil === "treballador") return constructora.slice(0, 2);
  return [];
}

// Despeses: les de l'obra (albarans, factura que els inclou, subcontracta) i les pròpies del tècnic
function despeses(perfil) {
  const obra = perfil === "tecnic" ? "" : "obra-demo-reforma";
  const out = [];
  if (obra && perfil !== "treballador") {
    out.push({ id: "alb-demo-1", data: iso(-35), obraId: obra, tipus: "Albarà", proveidor: "Materials Costa Prova", numero: "A-1021", base: "186.40", iva: "21", total: "225.54", linies: [{ concepte: "Ciment gris (sacs de 25 kg)", quantitat: "12", unitat: "ut", preu: "8.20", import: 98.4 }, { concepte: "Sorra rentada (big bag)", quantitat: "2", unitat: "ut", preu: "44", import: 88 }], notes: "", facturatClient: false, capitol: "02 PALETERIA", createdAt: ara(), updatedAt: ara() });
    out.push({ id: "alb-demo-2", data: iso(-20), obraId: obra, tipus: "Albarà", proveidor: "Materials Costa Prova", numero: "A-1034", base: "412.75", iva: "21", total: "499.43", linies: [], notes: "Morter cola i gres", facturatClient: false, capitol: "02 PALETERIA", createdAt: ara(), updatedAt: ara() });
    out.push({ id: "alb-demo-3", data: iso(-15), obraId: obra, tipus: "Material", proveidor: "Materials Costa Prova", numero: "F-2208", base: "599.15", iva: "21", total: "724.97", linies: [], notes: "Factura del mes: inclou els dos albarans", facturatClient: false, capitol: "02 PALETERIA", cobreix: ["alb-demo-1", "alb-demo-2"], createdAt: ara(), updatedAt: ara() });
    out.push({ id: "alb-demo-4", data: iso(-8), obraId: obra, tipus: "Subcontracta", proveidor: "Electricitat Prova", numero: "77", base: "1800", iva: "0", total: "1800", isp: true, linies: [], notes: "50 % de la instal·lació elèctrica", facturatClient: false, capitol: "03 INSTAL·LACIONS", createdAt: ara(), updatedAt: ara() });
  }
  if (perfil === "tecnic" || perfil === "complet") {
    out.push({ id: "alb-demo-m1", meva: true, tipusMeva: "Desplaçament (km)", data: iso(-4), obraId: "obra-demo-reforma-do", proveidor: "Girona → Palamós i tornada", km: "84", preuKm: "0,26", base: "21,84", iva: "0", total: "21,84", linies: [], notes: "", facturatClient: false, createdAt: ara(), updatedAt: ara() });
    out.push({ id: "alb-demo-m2", meva: true, tipusMeva: "Taxes de visat", data: iso(-25), obraId: "obra-demo-reforma-do", proveidor: "Col·legi (visat)", base: "85", iva: "0", total: "85", linies: [], notes: "", facturatClient: false, createdAt: ara(), updatedAt: ara() });
    out.push({ id: "alb-demo-m3", meva: true, tipusMeva: "Material", data: iso(-9), obraId: "", proveidor: "Papereria Prova", numero: "T-551", base: "12.40", iva: "21", total: "15.00", linies: [], notes: "Cinta mètrica i retoladors", facturatClient: false, createdAt: ara(), updatedAt: ara() });
  }
  return out;
}

// 26/10/2026 · treballadors inventats per a les constructores (partes, hores, fitxatge, Agenda › Equip)
function treballadors(perfil) {
  if (perfil !== "constructor" && perfil !== "complet") return [];
  const w = (k, nom, ofici, costHora, colla) => ({ id: `treb-demo-${k}`, nom, ofici, costHora, dni: "", mobil: "", alta: iso(-400), actiu: true, docs: [], colla });
  return [w("pere", "Pere Prova", "Oficial 1a", "25", "Colla 1"), w("joan", "Joan Prova", "Peó", "18", "Colla 1"), w("marc", "Marc Prova", "Encarregat", "28", "")];
}
export function dadesDemo(perfil) {
  const llista = obres(perfil);
  const usats = new Set(llista.map(x => x.obra.client.id));
  return {
    clients: Object.values(CLIENTS).filter(c => usats.has(c.id)),
    obres: llista,
    despeses: despeses(perfil),
    treballadors: treballadors(perfil),
    ajudes: { iso, cita, hora },
  };
}
