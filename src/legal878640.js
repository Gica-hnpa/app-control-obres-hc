// V87.640 · Privadesa i avisos legals. L'Héctor, 18/11/2026: «mira'm… protecció de dades i demés temes que ha de tenir una app»
// (proposta a Claude Docs) i «pots començar amb les targetes dins Ajustos». Aquí hi ha:
//  · els serveis que fa servir l'app (per a la targeta d'Ajustos i per als textos);
//  · els ESBORRANYS dels quatre textos legals (avís legal, privadesa, condicions i contracte d'encarregat del tractament), que ha de
//    revisar la gestoria o un advocat. Mentre ho són, només els veu l'Héctor.
// Les dades del titular de l'app (qui la ven) encara no hi són: als textos surten marcades en groc. Quan l'Héctor les doni, van a TITULAR.
// Les frases dels serveis passen per t() a App.jsx; els textos legals són en català (el castellà, quan siguin definitius).

export const TITULAR878640 = { nom: "", nif: "", adreca: "", correu: "", registre: "" };
export const WEB878640 = "app-control-obres-hc.onrender.com";
export const DATA_TEXTOS878640 = "18/11/2026";

// [clau, nom per a la pantalla] dels camps del titular que falten
export function faltaTitular878640(tit = TITULAR878640) {
  return [["nom", "nom"], ["nif", "NIF"], ["adreca", "adreça"], ["correu", "correu"]].filter(([k]) => !String(tit?.[k] || "").trim()).map(([, n]) => n);
}

// Qui ajuda l'app a funcionar (subencarregats). `ia` és el que es pot apagar a Ajustos.
export const SERVEIS878640 = [
  { k: "supabase", nom: "Supabase", per: "Desa les dades i els arxius del compte", on: "Frankfurt (Alemanya, UE)", quan: "Sempre" },
  { k: "render", nom: "Render", per: "Obre la pàgina de l’app (no hi desa dades)", on: "EUA", quan: "Sempre" },
  { k: "ia", nom: "Anthropic (Claude)", per: "Llegeix amb IA albarans, factures, PDF i pressupostos, i proposa preus", on: "EUA", quan: "Només quan es prem un botó d’IA" },
  { k: "google", nom: "Google (Gmail i Calendar)", per: "Envia documents des del teu Gmail i omple el teu calendari", on: "EUA", quan: "Només si connectes el teu compte de Google" },
  { k: "meteo", nom: "Open-Meteo", per: "El temps de l’Inici (només el nom del poble)", on: "Suïssa i UE", quan: "Quan s’obre l’Inici" },
];

// Cada text: seccions {h, b:[…]}. Una línia que comença amb «• » és un punt d'una llista; «{serveis}» és la taula dels serveis.
// {nom} {nif} {adreca} {correu} {registre} {web} {empresa} {empresaNif} {fiProva} {preu} {acceptat}: dades que s'omplen en fer el document.
export const TEXTOS878640 = [
  { k: "avis", titol: "Avís legal", seccions: [
    { h: "1. Qui és el titular", b: [
      "• Titular: {nom}", "• NIF: {nif}", "• Domicili: {adreca}", "• Correu de contacte: {correu}", "{registre}",
      "L’app «Control d’obres» és a {web}." ] },
    { h: "2. Què és l’app", b: [
      "Una aplicació web per gestionar obres i expedients: pressupostos, certificacions, hores, despeses, documents, agenda i facturació. És per a tècnics i empreses de la construcció." ] },
    { h: "3. Qui la pot fer servir", b: [
      "Només professionals i empreses amb un compte donat d’alta pel titular. Cada compte entra amb el seu usuari i la seva contrasenya, i n’és responsable: no els ha de deixar a ningú." ] },
    { h: "4. De qui és l’app i de qui són les dades", b: [
      "• L’app, el seu disseny i el seu codi són del titular. No es poden copiar, vendre ni fer servir per fer-ne una altra.",
      "• Les dades que cada compte hi posa (obres, clients, documents, fotos…) són d’aquell compte. El titular només les fa servir per donar el servei." ] },
    { h: "5. Responsabilitat", b: [
      "• L’app ajuda a fer càlculs i documents, però qui els signa o els envia els ha de revisar. El titular no respon dels errors que vinguin de dades mal posades ni de l’ús que se’n faci.",
      "• El titular fa el possible perquè l’app funcioni sempre, però hi pot haver aturades per manteniment o per problemes dels serveis que fa servir." ] },
    { h: "6. Enllaços a altres webs", b: [
      "L’app té enllaços a webs d’altres (Cadastre, Generalitat, Agència Tributària…). El titular no respon del que hi ha en aquestes webs." ] },
    { h: "7. Llei i jutjats", b: [
      "S’aplica la llei espanyola. Per a qualsevol desacord, els jutjats de Girona, llevat que la llei digui una altra cosa." ] },
  ] },
  { k: "privadesa", titol: "Política de privadesa", seccions: [
    { h: "1. Qui és el responsable de les teves dades", b: [
      "{nom}, NIF {nif}, {adreca}. Correu: {correu}." ] },
    { h: "2. Quines dades tractem i de qui", b: [
      "• De qui té un compte: el nom, l’usuari o el correu, la contrasenya (desada xifrada: ningú la pot llegir), l’idioma i les preferències, i les dades tècniques d’accés (adreça IP, data i hora, aparell) que els servidors guarden per seguretat.",
      "• Les dades que cada empresa hi posa sobre altres persones (clients, promotors, treballadors, industrials, proveïdors): d’aquestes, la responsable és l’empresa i el titular de l’app n’és l’encarregat. Ho regula el contracte d’encarregat del tractament." ] },
    { h: "3. Per a què", b: [
      "• Donar el servei: que puguis entrar, desar la feina i trobar-la a tots els teus aparells.",
      "• Fer còpies de seguretat i protegir les dades.",
      "• Respondre les teves consultes i facturar el servei.",
      "No fem publicitat, no venem dades i no fem perfils de ningú." ] },
    { h: "4. Per quin motiu ho podem fer", b: [
      "El contracte del servei (article 6.1.b del RGPD), les obligacions legals, com guardar les factures (article 6.1.c), i l’interès legítim de protegir l’app i les dades (article 6.1.f)." ] },
    { h: "5. Quant de temps les guardem", b: [
      "Mentre el compte estigui actiu. Quan es dona de baixa, hi ha 30 dies per descarregar les dades i després s’esborren. Les còpies de seguretat s’esborren soles quan els toca (com a màxim, al cap de 12 mesos). Les factures del servei es guarden el temps que marca la llei (6 anys)." ] },
    { h: "6. Qui més les veu", b: [
      "Només els serveis que ajuden l’app a funcionar, amb contracte i només per a això:", "{serveis}",
      "Només les donarem a una autoritat si una llei ens hi obliga." ] },
    { h: "7. Dades fora de la Unió Europea", b: [
      "Anthropic i Google són dels Estats Units. Les dades hi viatgen amb les garanties del RGPD: el Marc de privadesa de dades UE-EUA o les clàusules contractuals tipus de la Comissió Europea.",
      "La IA només rep un document quan algú prem un botó d’IA, i cada compte la pot apagar a Ajustos." ] },
    { h: "8. Els teus drets", b: [
      "• Pots demanar veure les teves dades, corregir-les, esborrar-les, limitar-ne l’ús, oposar-t’hi o endur-te-les.",
      "• A Ajustos › Usuaris i accés › Privadesa les pots descarregar. Per a la resta, escriu a {correu}. Responem en un mes com a màxim.",
      "• Si creus que no ho fem bé, pots reclamar a l’Agència Espanyola de Protecció de Dades (www.aepd.es)." ] },
    { h: "9. Seguretat", b: [
      "Connexió xifrada, contrasenya per entrar, cada compte només veu les seves dades (ho controla el servidor) i còpies de seguretat cada dia. Si hi hagués una fuita de dades, ho comunicaríem a l’autoritat i a qui calgui en 72 hores com a màxim." ] },
    { h: "10. Galetes i dades al navegador", b: [
      "L’app no fa servir galetes de publicitat ni d’estadístiques. Només desa al navegador el que necessita per funcionar: la sessió i les dades per treballar sense cobertura." ] },
    { h: "11. Canvis d’aquest text", b: [
      "Si el canviem, ho direm a l’app abans que s’apliqui." ] },
  ] },
  { k: "condicions", titol: "Condicions del servei", seccions: [
    { h: "1. Què s’ofereix", b: [
      "L’ús de l’app «Control d’obres» per internet, amb les dades al núvol i als aparells del compte, i les millores que s’hi vagin fent." ] },
    { h: "2. Comptes", b: [
      "Els comptes els dona d’alta el titular. L’empresa respon de qui fa servir el seu compte i els seus usuaris, i de guardar les contrasenyes." ] },
    { h: "3. Preu", b: [
      "{preu}", "Durant la prova pilot, el servei és gratuït fins al {fiProva}." ] },
    { h: "4. Ús correcte", b: [
      "No es pot fer servir l’app per a res il·legal, intentar entrar a dades d’altres comptes, sobrecarregar-la ni copiar-la. No s’hi han de posar dades de salut ni altres dades especials si no cal." ] },
    { h: "5. Les dades", b: [
      "Les dades són de l’empresa, que les pot descarregar quan vulgui. El titular les tracta com a encarregat, segons el contracte d’encarregat del tractament." ] },
    { h: "6. Funcionament i còpies", b: [
      "El titular fa el possible perquè l’app funcioni sempre, en fa còpies de seguretat cada dia i avisarà de les aturades previstes. Pot canviar o millorar les funcions de l’app." ] },
    { h: "7. Responsabilitat", b: [
      "L’app és una eina: els documents que se’n treuen els ha de revisar qui els fa servir. La responsabilitat del titular es limita a l’import pagat els últims 12 mesos, llevat de dol o culpa greu." ] },
    { h: "8. Baixa", b: [
      "• L’empresa pot plegar quan vulgui, avisant per escrit.",
      "• El titular pot tancar un compte que no paga o que no compleix aquestes condicions, avisant-ho abans.",
      "• Després de la baixa hi ha 30 dies per descarregar les dades; després s’esborren." ] },
    { h: "9. Canvis de les condicions", b: [
      "S’avisaran amb 30 dies. Si no s’hi està d’acord, es pot plegar sense cap cost." ] },
    { h: "10. Llei i jutjats", b: [
      "S’aplica la llei espanyola. Per a qualsevol desacord, els jutjats de Girona." ] },
  ] },
  { k: "encarregat", titol: "Contracte d’encarregat del tractament", seccions: [
    { h: "Parts", b: [
      "• Responsable del tractament: {empresa}, NIF {empresaNif} (l’empresa o el professional que fa servir l’app).",
      "• Encarregat del tractament: {nom}, NIF {nif}, {adreca}.",
      "Aquest contracte compleix l’article 28 del Reglament general de protecció de dades (RGPD)." ] },
    { h: "1. Objecte", b: [
      "L’encarregat tracta dades personals per compte del responsable només per donar-li el servei de l’app «Control d’obres»: desar-les, mostrar-les, fer-ne còpies i, quan el responsable ho demana, llegir documents amb IA, enviar correus o omplir el calendari." ] },
    { h: "2. Quines dades i de qui", b: [
      "• Clients, promotors, contactes, industrials i proveïdors: nom, NIF, adreça, telèfon, correu i dades bancàries de les factures.",
      "• Treballadors: nom, DNI si s’hi posa, categoria, cost per hora, hores, fitxatges (amb la ubicació, si el fitxatge la demana) i documentació.",
      "• Persones que surten a fotos, actes o documents d’obra, i signatures.",
      "No es preveu tractar dades de salut ni altres categories especials. Si el responsable hi desa documents que en porten (p. ex. un certificat d’aptitud mèdica), l’encarregat els protegeix igual i només els desa." ] },
    { h: "3. Durada", b: [
      "Mentre el responsable faci servir l’app." ] },
    { h: "4. Què es compromet a fer l’encarregat", b: [
      "• Tractar les dades només segons les instruccions del responsable (el que es fa amb l’app) i no fer-les servir per a res més.",
      "• Que tothom qui hi tingui accés guardi secret.",
      "• Protegir-les (article 32 del RGPD): connexió xifrada, accés amb contrasenya, cada compte separat al servidor i còpies de seguretat cada dia.",
      "• Fer servir només els serveis de l’annex. Si se n’hi afegeix cap, avisar-ho amb 30 dies perquè el responsable s’hi pugui oposar, i exigir-los les mateixes obligacions.",
      "• Ajudar el responsable a atendre els drets de les persones (veure, corregir, esborrar, limitar, oposar-se, endur-se les dades).",
      "• Avisar el responsable de qualsevol fuita de dades sense esperar, i com a màxim en 48 hores, amb tota la informació que tingui.",
      "• Ajudar-lo, si cal, en les avaluacions d’impacte i en les consultes a l’autoritat.",
      "• En acabar el servei, deixar-li descarregar les dades i esborrar-les en 30 dies, llevat del que la llei obligui a guardar. Les còpies de seguretat s’esborren quan els toca (com a màxim, al cap de 12 mesos).",
      "• Donar-li la informació que necessiti per demostrar que es compleix aquest contracte i permetre-li’n revisions raonables." ] },
    { h: "5. Què es compromet a fer el responsable", b: [
      "• Tenir permís o un motiu legal per a les dades que hi posa i informar-ne les persones (treballadors, clients…).",
      "• En particular, informar els treballadors del registre de jornada i, si el fitxatge demana la ubicació, d’això també.",
      "• Decidir si fa servir la IA (es pot apagar a Ajustos)." ] },
    { h: "6. Dades fora de la Unió Europea", b: [
      "Anthropic i Google són dels Estats Units. Les dades hi viatgen amb el Marc de privadesa de dades UE-EUA o amb les clàusules contractuals tipus de la Comissió Europea." ] },
    { h: "Annex · Serveis que ajuden l’encarregat (subencarregats)", b: ["{serveis}"] },
    { h: "Acceptació", b: ["{acceptat}"] },
  ] },
];

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const falta = txt => `<mark>[${esc(txt)}]</mark>`;

// El document en HTML (fulls A4). `dades`: {titular, empresa, empresaNif, acceptat, color, esborrany}
export function textLegalHtml878640(doc, dades = {}) {
  const tit = { ...TITULAR878640, ...(dades.titular || {}) };
  const C = /^#[0-9a-f]{6}$/i.test(String(dades.color || "")) ? dades.color : "#1E3A5F";
  const valors = {
    nom: tit.nom ? esc(tit.nom) : falta("Nom del titular"),
    nif: tit.nif ? esc(tit.nif) : falta("NIF del titular"),
    adreca: tit.adreca ? esc(tit.adreca) : falta("Adreça del titular"),
    correu: tit.correu ? esc(tit.correu) : falta("Correu per a la privadesa"),
    registre: tit.registre ? esc(tit.registre) : "",
    web: esc(WEB878640),
    empresa: dades.empresa ? esc(dades.empresa) : falta("Nom de l’empresa client"),
    empresaNif: dades.empresaNif ? esc(dades.empresaNif) : falta("NIF de l’empresa client"),
    fiProva: falta("data de fi de la prova"),
    preu: falta("Preu, forma de pagament i durada, segons l’oferta"),
    acceptat: dades.acceptat ? esc(dades.acceptat) : falta("Data i persona que l’accepta a l’app"),
  };
  const omple = s => esc(s).replace(/\{(\w+)\}/g, (m, k) => (k in valors ? valors[k] : m));
  const serveis = `<table><thead><tr><th>Servei</th><th>Per a què</th><th>On</th><th>Quan</th></tr></thead><tbody>${SERVEIS878640.map(s => `<tr><td><b>${esc(s.nom)}</b></td><td>${esc(s.per)}</td><td>${esc(s.on)}</td><td>${esc(s.quan)}</td></tr>`).join("")}</tbody></table>`;
  const bloc = b => {
    const out = []; let llista = [];
    const tanca = () => { if (llista.length) { out.push(`<ul>${llista.join("")}</ul>`); llista = []; } };
    for (const l of b) {
      if (l === "{serveis}") { tanca(); out.push(serveis); continue; }
      const txt = omple(l.replace(/^• /, ""));
      if (!txt.trim()) continue;
      if (l.startsWith("• ")) llista.push(`<li>${txt}</li>`); else { tanca(); out.push(`<p>${txt}</p>`); }
    }
    tanca(); return out.join("");
  };
  const css = `@page{size:A4 portrait;margin:16mm 16mm 18mm}body{font-family:Arial,Helvetica,sans-serif;font-size:10.5px;line-height:1.5;color:#0F172A;margin:0}
.cap{border-bottom:3px solid ${C};padding-bottom:8px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
h1{margin:0;font-size:19px;color:${C}}.cap .sub{color:#475569;font-size:9.5px;text-align:right}.esb{display:inline-block;background:#FEF3C7;color:#92400E;border:1px solid #F59E0B;border-radius:4px;padding:1px 6px;font-weight:700;font-size:9px;margin-bottom:3px}
h2{font-size:12px;color:${C};margin:14px 0 4px;break-after:avoid}p{margin:4px 0}ul{margin:4px 0;padding-left:18px}li{margin:2px 0}
mark{background:#FEF08A;color:#713F12;padding:0 2px;border-radius:2px}
table{width:100%;border-collapse:collapse;margin:6px 0;font-size:9.5px}th{background:${C};color:#fff;text-align:left;padding:4px 6px;font-size:8.6px;text-transform:uppercase;letter-spacing:.3px}
td{padding:4px 6px;border-bottom:1px solid #E2E8F0;vertical-align:top}tr{break-inside:avoid}.peu{margin-top:16px;color:#64748B;font-size:8.5px;border-top:1px solid #E2E8F0;padding-top:6px}`;
  const sub = dades.esborrany !== false ? `<span class="esb">ESBORRANY PER REVISAR</span><br>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(doc.titol)}</title><style>${css}</style></head><body>
<div class="cap"><h1>${esc(doc.titol)}</h1><div class="sub">${sub}Control d’obres · ${esc(DATA_TEXTOS878640)}</div></div>
${doc.seccions.map(s => `<h2>${esc(s.h)}</h2>${bloc(s.b)}`).join("\n")}
<div class="peu">${esc(doc.titol)} · Control d’obres · ${esc(WEB878640)}</div></body></html>`;
}
