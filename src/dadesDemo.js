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
  // V87.605 · la casa unifamiliar (gestió total) i l'aixecament dels exemples per començar
  casa: { id: "client-demo-casa", nom: "Laura Roca Prova", rao: "", tipus: "Particular", contacte: "Laura Roca", telefon: "600 000 006", email: "laura.roca@exemple.test", adreca: "C/ dels Pins, 14", codiPostal: "17251", poblacio: "Calonge", nif: "00000006Y" },
  aixeca: { id: "client-demo-aixeca", nom: "Joan Prova Bosch", rao: "", tipus: "Particular", contacte: "Joan Prova", telefon: "600 000 007", email: "joan.prova@exemple.test", adreca: "C/ Ample, 3, 1r", codiPostal: "17200", poblacio: "Palafrugell", nif: "00000007F" },
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
// V87.605 · Casa unifamiliar aïllada (obra nova): el pressupost de la constructora i el que s'ha certificat a cada una de les 4 certificacions
const CASA = [
  ["01 MOVIMENT DE TERRES", "01.01", "m2", "Esbrossada i neteja del solar", 450, 1.8, [450]],
  ["01 MOVIMENT DE TERRES", "01.02", "m3", "Excavació de rases i pous de fonamentació", 62, 24.5, [62]],
  ["01 MOVIMENT DE TERRES", "01.03", "m3", "Càrrega i transport de terres a l’abocador", 75, 14.2, [75]],
  ["02 FONAMENTS I ESTRUCTURA", "02.01", "m3", "Formigó HA-25 armat en sabates i riostres", 38, 215, [38]],
  ["02 FONAMENTS I ESTRUCTURA", "02.02", "m2", "Forjat unidireccional de biguetes i revoltons", 340, 68, [0, 170, 170]],
  ["02 FONAMENTS I ESTRUCTURA", "02.03", "m3", "Pilars i bigues de formigó armat", 18, 640, [0, 9, 9]],
  ["03 COBERTA", "03.01", "m2", "Coberta inclinada de teula ceràmica amb aïllament", 190, 92, [0, 0, 95, 95]],
  ["04 TANCAMENTS I PALETERIA", "04.01", "m2", "Façana de doble full amb aïllament tèrmic", 260, 78, [0, 0, 130, 90]],
  ["04 TANCAMENTS I PALETERIA", "04.02", "m2", "Envans interiors de maó", 210, 29.5, [0, 0, 0, 120]],
  ["04 TANCAMENTS I PALETERIA", "04.03", "m2", "Arrebossats i enguixats interiors", 620, 15.8, [0, 0, 0, 200]],
  ["05 INSTAL·LACIONS", "05.01", "pa", "Instal·lació elèctrica i de telecomunicacions", 1, 14500, [0, 0, 0.2, 0.3]],
  ["05 INSTAL·LACIONS", "05.02", "pa", "Lampisteria, sanejament i ACS amb aerotèrmia", 1, 18900, [0, 0, 0.25, 0.25]],
  ["05 INSTAL·LACIONS", "05.03", "pa", "Climatització amb terra radiant", 1, 16400, [0, 0, 0, 0.3]],
  ["06 FUSTERIA I VIDRES", "06.01", "ut", "Finestra d’alumini amb trencament de pont tèrmic", 14, 980, []],
  ["06 FUSTERIA I VIDRES", "06.02", "ut", "Porta interior lacada", 11, 340, []],
  ["07 ACABATS", "07.01", "m2", "Paviment de gres porcellànic", 165, 48, []],
  ["07 ACABATS", "07.02", "m2", "Pintura plàstica interior", 620, 7.4, []],
  ["07 ACABATS", "07.03", "pa", "Mobles de cuina i equipament dels banys", 1, 12800, []],
  ["08 URBANITZACIÓ", "08.01", "ml", "Tanca perimetral i porta d’accés", 85, 96, []],
  ["08 URBANITZACIÓ", "08.02", "m2", "Paviment exterior i jardineria", 140, 38, []],
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
// V87.605 · agents de l'obra, actes de les visites i les certificacions i factures de la casa unifamiliar
const agent = (k, nom, rol, empresa) => ({ id: `ag-demo-${k}`, nom, rol, empresa, email: `${k.replace(/[^a-z0-9]/g, "")}@exemple.test`, telefon: "", nif: "", adreca: "", createdAt: ara(), updatedAt: ara() });
const acta = (k, n, d, titol, text, estat, agentIds, rols = {}) => ({ id: `acta-demo-${k}`, createdAt: dia(d).toISOString(), updatedAt: dia(d).toISOString(), numero: String(n).padStart(2, "0"), titol, data: iso(d), text, fotoIds: [], agentIds, docs: [], croquis: [], estat, ...rols });
function certsCasa() {
  const rows = partides(CASA);
  return [-110, -80, -50, -20].map((d, i) => ({ id: `cert-demo-casa-${i + 1}`, numero: String(i + 1), data: iso(d), estat: i < 2 ? "Cobrada" : "Pendent", budgetId: "principal", import: Math.round(rows.reduce((s, r) => s + (r.certsByNum[String(i + 1)] || 0) * r.pu, 0) * 100) / 100, createdAt: ara(), updatedAt: ara() }));
}
// les 3 primeres certificacions, facturades a la promotora (sèrie de l'empresa, IVA 10 % d'habitatge); les dues primeres, cobrades
function facturesCasa(certs, client) {
  const r2 = x => Math.round(x * 100) / 100, perAny = {};
  const destinatari = { nom: client.nom, nif: client.nif, adreca: `${client.adreca}, ${client.codiPostal} ${client.poblacio}` };
  return certs.slice(0, 3).map((c, i) => {
    const df = -108 + 30 * i, any = dia(df).getFullYear(), prefix = `F${any}-`, num = (perAny[any] = (perAny[any] || 0) + 1);
    const base = c.import, iva = 10, ivaImp = r2(base * iva / 100);
    return { id: `fo-demo-casa-${i + 1}`, certId: c.id, budgetId: "principal", pfNumero: `PF-${String(c.numero).padStart(3, "0")}`, certNum: c.numero, numero: `${prefix}${String(num).padStart(3, "0")}`, num, serieEmpresa: true, prefix,
      data: iso(df), base, ded: 0, iva, ivaImp, ret: 0, retImp: 0, total: r2(base + ivaImp), destinatari, avisCobr878496: { data: iso(df + 30) },
      ...(i < 2 ? { cobrada: true, dataCobrament: iso(df + 20) } : {}), createdAt: ara() };
  });
}
const hora = (k, d, hores, feina, extra = {}) => ({ id: `h-demo-${k}`, data: iso(d), hores, tipusRegistre: "Honoraris", tipusFeina: feina, observacions: "", preuHora: 50, createdAt: ara(), ...extra });

// Cada obra: dades bàsiques (l'App hi posa el codi i la plantilla) i el que porta dins
const COLLA = { k: "c:Colla 1", nom: "Colla 1" }, MARC = { k: "t:treb-demo-marc", nom: "Marc Prova" };
function obres(perfil, inici = false) {
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
    horesK: [["do1", -14, 1.5, "Visita d’obra"], ["do2", -7, 2, "Visita d’obra"], ["do3", -4, 1, "Visita d’obra"], ["do4", -2, 0.75, "Oficina"]],
    // V87.605 · els agents i les actes de les visites (pestanya Visites)
    agents: [agent("do-constr", "Xavier Prova", "Constructora / contractista", "Construccions Prova SL"), agent("do-do", "Anna Prova", "Direcció d’obra", "Anna Prova, arquitecta")],
    actes: [
      acta("do1", 1, -14, "Visita d’obra: enderrocs", "Enderrocs acabats. S’han retirat els envans de la cuina i el bany.\nLa biga de l’entrada està en bon estat: no cal reforçar-la.\nLa runa ja s’ha baixat de l’escala.", "Signada", ["ag-demo-do-constr", "ag-demo-do-do"], { promotor: "Marta Puig Serra", constructor: "Construccions Prova SL", do: "Anna Prova, arquitecta", deo: "Despatx Tècnic Prova" }),
      acta("do2", 2, -4, "Visita d’obra: paleteria i instal·lacions", "Arrebossats correctes.\nAbans del paviment cal passar els tubs de l’electricitat i fer la prova de pressió de l’aigua.\nLa constructora enviarà el resultat de la prova.", "Esborrany", ["ag-demo-do-constr"], { promotor: "Marta Puig Serra", constructor: "Construccions Prova SL", do: "Anna Prova, arquitecta", deo: "Despatx Tècnic Prova" }),
    ] } });
  // V87.605 · Casa unifamiliar amb gestió total (l'Héctor, 12/11/2026: «un expedient de control d'obra d'una casa unifamiliar inventada amb
  // gestió total: control de certificacions i factures»): pressupost de la constructora, 4 certificacions (3 facturades, 2 cobrades), actes
  // de les visites, honoraris, hores, planning, tasques i cites
  const rolsCasa = { promotor: "Laura Roca Prova", constructor: "Construccions Prova SL", do: "Anna Prova, arquitecta", deo: "Despatx Tècnic Prova", css: "Seguretat Prova SL" };
  const certsC = certsCasa();
  const casa = o("casa", "Casa unifamiliar C/ dels Pins 14", "Gestió integral d’obra", CLIENTS.casa, "En curs / Actiu", "C/ dels Pins, 14", "Calonge", "17251", { subtitol: "Habitatge unifamiliar aïllat de nova construcció", constructor: "Construccions Prova SL", do: "Anna Prova, arquitecta", deo: "Despatx Tècnic Prova", dades: {
    partides: partides(CASA), certificacions: certsC, facturesObra878297: facturesCasa(certsC, CLIENTS.casa),
    ganttConfig87217: planning(CASA, -125, [8, 30, 12, 25, 30, 10, 20, 12]),
    agents: [agent("casa-constr", "Xavier Prova", "Constructora / contractista", "Construccions Prova SL"), agent("casa-do", "Anna Prova", "Direcció d’obra", "Anna Prova, arquitecta"), agent("casa-css", "Marc Prova Puig", "Coordinació S+S", "Seguretat Prova SL")],
    actes: [
      acta("casa1", 1, -112, "Acta de replanteig i d’inici de l’obra", "Es comprova el replanteig de la casa sobre el solar amb la constructora: cotes i nivells correctes segons el projecte.\nEs lliura el Llibre d’ordres i el Pla de seguretat aprovat.\nVisita d’obra cada dimarts a les 9 h.", "Signada", ["ag-demo-casa-constr", "ag-demo-casa-do", "ag-demo-casa-css"], rolsCasa),
      acta("casa2", 2, -84, "Visita d’obra: armat dels fonaments", "Revisat l’armat de les sabates i les riostres abans de formigonar: recobriments i separadors correctes.\nEs demana l’albarà i el certificat de la planta del formigó.\nEs pot formigonar.", "Signada", ["ag-demo-casa-constr", "ag-demo-casa-do"], rolsCasa),
      acta("casa3", 3, -45, "Visita d’obra: forjat de la planta primera", "Revisat l’apuntalament i l’armat de negatius del forjat.\nFalten 4 separadors a la zona de la cuina: es posen abans de formigonar.\nProvetes del formigó a 7 dies: correctes.", "Enviada", ["ag-demo-casa-constr", "ag-demo-casa-do"], rolsCasa),
      acta("casa4", 4, -6, "Visita d’obra: coberta i façanes", "Coberta: teula col·locada al 50 %; cal revisar el carener i els ràfecs.\nFaçana: aïllament de 8 cm ben col·locat; cal segellar les juntes dels premarcs abans de tancar.\nLa promotora vol canviar el paviment del menjador per parquet: la constructora en farà un preu contradictori.", "Esborrany", ["ag-demo-casa-constr"], rolsCasa),
    ],
    pressupostosTecnic: [{ id: "pt-demo-casa", numero: "P-DEMO-06", data: iso(-140), concepte: "Direcció d’execució i gestió de l’obra (certificacions i factures)", text: "", base: 8400, iva: 21, estat: "Acceptat" }],
    facturesTecnic: [
      { id: "ft-demo-casa-1", numero: "F-DEMO-03", data: iso(-76), concepte: "Honoraris: fonaments i estructura (30 %)", text: "", base: 2520, iva: 21, retencio: 15, descompte: 0, estat: "Cobrada", pressupostId: "pt-demo-casa", createdAt: ara(), updatedAt: ara() },
      { id: "ft-demo-casa-2", numero: "F-DEMO-04", data: iso(-16), concepte: "Honoraris: coberta i tancaments (25 %)", text: "", base: 2100, iva: 21, retencio: 15, descompte: 0, estat: "Pendent", pressupostId: "pt-demo-casa", createdAt: ara(), updatedAt: ara() },
    ],
    notes: [nota(1, -18, "Certificació 4 de la constructora revisada: s’ha tret 1 m² de façana que encara no estava acabat. Imports correctes.")],
    tasques: [tasca("casa1", 1, "Revisar els amidaments de la certificació 5", "Alta"), tasca("casa2", 3, "Demanar el preu contradictori del parquet"), tasca("casa3", -2, "Reclamar la factura F-003 a la promotora (vençuda)", "Urgent")],
    citaK: [["casa", 2, "09:00", "Visita d’obra casa C/ dels Pins 14", "Visita d’obra"], ["casa2", 6, "18:00", "Reunió amb la promotora: paviment del menjador", "Visita"]],
    horesK: [["c1", -112, 2, "Visita d’obra"], ["c2", -84, 1.5, "Visita d’obra"], ["c3", -45, 1.5, "Visita d’obra"], ["c4", -18, 3, "Oficina", { observacions: "Revisió de la certificació 4" }], ["c5", -6, 2, "Visita d’obra"]] } });
  // V87.605 · un encàrrec petit: aixecament planimètric
  const aixecament = o("aixecament", "Aixecament pis C/ Ample 3, 1r", "Plànols / aixecament", CLIENTS.aixeca, "En procés", "C/ Ample, 3, 1r", "Palafrugell", "17200", { dades: {
    pressupostosTecnic: [{ id: "pt-demo-aix", numero: "P-DEMO-05", data: iso(-10), concepte: "Aixecament planimètric de l’habitatge i plànols de l’estat actual (DWG i PDF)", text: "", base: 380, iva: 21, estat: "Acceptat" }],
    notes: [nota(1, -3, "Mides preses amb el làser i fotos de cada estança. Falta l’alçada del celobert i la posició dels baixants.")],
    tasques: [tasca("aix1", 1, "Passar l’aixecament a DWG", "Alta"), tasca("aix2", 4, "Enviar els plànols al client i fer la factura")],
    citaK: [["aix", -3, "10:00", "Presa de mides C/ Ample 3", "Visita"]],
    horesK: [["aix1", -3, 2.5, "Visita d’obra", { observacions: "Presa de mides" }], ["aix2", -1, 2, "Oficina", { observacions: "Dibuix dels plànols" }]] } });
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
  // V87.605 · «Exemples per començar» dels comptes de debò (l'Héctor, 12/11/2026: per ensenyar l'app als de la prova pilot; després es
  // treuen i s'hi entra un expedient seu): pocs i variats. El tècnic sense el mòdul d'obra no veu certificacions: la casa, només a Gestió total.
  if (inici && perfil === "tecnic") return [direccio, aixecament, tecnic[0], tecnic[1]];
  if (inici && perfil === "complet") return [casa, direccio, aixecament, tecnic[0], tecnic[1]];
  if (perfil === "tecnic") return [...tecnic, direccio];
  if (perfil === "constructor") return constructora;
  if (perfil === "complet") return [...tecnic.slice(0, 2), direccio, ...constructora];
  if (perfil === "treballador") return constructora.slice(0, 2);
  return [];
}

// Despeses: les de l'obra (albarans, factura que els inclou, subcontracta) i les pròpies del tècnic
function despeses(perfil, inici = false) {
  const obra = perfil === "tecnic" || (inici && perfil === "complet") ? "" : "obra-demo-reforma";
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
    if (inici && perfil === "complet") out.push({ id: "alb-demo-m4", meva: true, tipusMeva: "Desplaçament (km)", data: iso(-6), obraId: "obra-demo-casa", proveidor: "Girona → Calonge i tornada", km: "96", preuKm: "0,26", base: "24,96", iva: "0", total: "24,96", linies: [], notes: "", facturatClient: false, createdAt: ara(), updatedAt: ara() });
  }
  return out;
}

// 26/10/2026 · treballadors inventats per a les constructores (partes, hores, fitxatge, Agenda › Equip)
function treballadors(perfil, inici = false) {
  if (perfil !== "constructor" && (perfil !== "complet" || inici)) return [];
  const w = (k, nom, ofici, costHora, colla) => ({ id: `treb-demo-${k}`, nom, ofici, costHora, dni: "", mobil: "", alta: iso(-400), actiu: true, docs: [], colla });
  return [w("pere", "Pere Prova", "Oficial 1a", "25", "Colla 1"), w("joan", "Joan Prova", "Peó", "18", "Colla 1"), w("marc", "Marc Prova", "Encarregat", "28", "")];
}
export function dadesDemo(perfil, { inici = false } = {}) {
  const llista = obres(perfil, inici);
  const usats = new Set(llista.map(x => x.obra.client.id));
  return {
    clients: Object.values(CLIENTS).filter(c => usats.has(c.id)),
    obres: llista,
    despeses: despeses(perfil, inici),
    treballadors: treballadors(perfil, inici),
    ajudes: { iso, cita, hora },
  };
}
