# Auditoria de facilitat de l’app (23/10/2026, V87.352)

*Per a l’Héctor. Demanat el 22/10/2026: «veure la facilitat i simplicitat de les pantalles, que no dupliquin informació… i què ens
distingeix de la resta».*

**Com s’ha fet.** Amb els tres comptes de prova (tècnic, constructora i gestió total) s’han recorregut **134 pantalles**: totes les del
menú i tots els apartats d’una obra, a l’ordinador i al mòbil. Per a cada pantalla s’ha comptat:

- quants botons i camps té;
- quanta lletra té;
- quant s’ha de baixar per veure-la sencera;
- quins textos surten repetits i quins expliquen l’app.

També s’han mirat les captures una per una. No hi ha hagut cap error de l’app.

L’eina és `tools/proves/auditoriaux.mjs` i les captures són a `D:\aco-tmp\auditoriaux`.

---

## 1. En poques línies

- **Ja està bé:** l’obra per dins (Fitxa · Seguiment · Econòmic), el Pressupost, la Facturació de l’empresa, les Despeses plegades,
  els Partes i la barra de baix del mòbil.
- **El que pesa:** l’Inici, Documents, Preus, Ajustos i, al tècnic, Honoraris i Facturació. Tenen massa blocs, frases que expliquen
  l’app i coses que surten dues vegades.
- **Les hores del personal s’entren a 4 llocs i es desen a 2.** El Rendiment les suma totes: si s’entren al parte i també a Hores,
  compten dues vegades. **És el que més urgeix decidir.**
- Molt d’espai per a coses buides: «0 documents» 11 vegades, requadres a 0, una foto buida que ocupa mitja pantalla del mòbil.
- Tres errors petits: el títol de Preus no es llegeix, la taula de Certificacions surt buida i trencada quan no n’hi ha cap, i la
  targeta nova «Imatge de l’empresa» no té marge.

---

## 2. La mateixa informació a dos llocs

| On | Què surt dues vegades | Proposta |
|---|---|---|
| **Inici** | «1 tasca vençuda» a la línia de dalt i al requadre vermell (amb la frase «Decideix què en fas…») | Un sol avís amb «Revisar-les» |
| **Inici** | «Total d’obres» i «Obres obertes» (sovint el mateix número) | Treure «Total» (és a la llista d’obres) |
| **Inici (gestió total)** | La finestra «Tasca vençuda» s’obre sola en entrar, i té «Ara no» i «Tancar» | Que no s’obri sola (ja hi ha «Revisar-les»); un sol botó per tancar |
| **Resum de l’obra** | Barra «Pressupost preparat… 0 € de 13.328 €» i, a sota, Pressupost vigent · Certificat · Pendent | Només els requadres |
| **Resum de l’obra** | Foto buida gran (mitja pantalla al mòbil) amb les inicials | Sense foto, només «Afegir foto» petit |
| **Resum de l’obra** | «Promotor / propietat: El mateix client» | No dir-ho si és el mateix |
| **Dades de l’obra** | «Estat de l’expedient» (ja es canvia a la barra de l’obra) i el títol «Dades de l’obra · fitxa» | Treure l’estat d’aquí i el «· fitxa» |
| **Pressupost, Certificacions, Rendiment** | La barra «Fases» amb una sola fase repeteix «Pressupost principal» | Amagar-la si només n’hi ha una (s’afegeix amb «Afegir › Un pressupost nou al costat») |
| **Certificacions sense cap** | «Encara no té certificacions» i, a sota, «Certificació 1» amb una taula buida | Només l’avís i «+ Nova certificació» |
| **Honoraris (tècnic)** | «Calcular honoraris» dues vegades; «Pressupostos d’honoraris» com a botó i com a títol; 5,5 pantalles amb el comptador, registres, rendiment, factures per estat, temps per tipus, ingressos i «Lectura ràpida» | Pressupostos · Factures · Hores a la vista; la resta, plegada a «Informes» |
| **Documents** | «Documents de l’expedient · nom de l’obra» (el nom ja és a dalt) i el xip «01 · Documentació prèvia · 0 docs» | Títol «Documents» i fora el xip |
| **Documents** | 12 carpetes amb la descripció i «0 documents» (3 pantalles al mòbil) | Les carpetes amb documents a la vista; les buides, plegades a «Altres carpetes (9)»; sense descripcions |
| **Preus** | Tres llocs per crear (a dalt, al requadre «Llibreria buida» i a «Capítols i partides»), dos textos d’explicació i 4 requadres a 0 | Un sol «+ Partida» i «+ Capítol»; amb la llibreria buida, només una frase |
| **Número de versió** | Surt tres vegades: al menú, a la cantonada de baix i a Ajustos | Una sola (Ajustos o el menú) |
| **Ajustos** | 13 apartats (5,7 pantalles al mòbil) i noms tècnics («Supabase Storage», «JSON») | 3 grups plegats: **La meva empresa** · **Preferències** · **Dades i còpies** |
| **Facturació (tècnic)** | Franja de VeriFactu a dalt («Veure com funcionarà») cada vegada | Només a Ajustos |
| **Inici i llista d’obres** | Cada tasca i cada obra porta un desplegable propi d’accions o d’estat (7 a l’Inici) | Les accions, en obrir la tasca o l’obra |

---

## 3. Frases que expliquen l’app (no les vols)

- **Agenda:** «Clica un espai buit per crear una cita i arrossega-la…»
- **Inici:** «Decideix què en fas: acabar-les, posar-los un nou termini…»
- **Ajustos:**
  - «Cada persona tria el seu idioma…»;
  - «No queda res antic per alliberar…»;
  - «Partides i capítols eliminats…»;
  - el text llarg de VeriFactu.
- **Preus:**
  - «Els pressupostos nous no alimenten automàticament…»;
  - «Una sola llibreria, amb filtre de client…»;
  - «Ara només hi entrarà allò que tu validis…»
- **Documents:** la descripció de cada carpeta i «Obre el document amb el mateix format…»
- **Honoraris:** «Quan entris hores a Gestió temps es calcularà…»
- **Hores i Obra › Hores sense treballadors:** «Primer posa els treballadors a Empresa › Treballadors.», sense cap botó per anar-hi.

---

## 4. Les hores del personal (decisió teva)

Avui es poden entrar a **quatre llocs**:

1. Hores › Personal (el part del dia de tota l’empresa).
2. Obra › Econòmic › Hores.
3. Parte d’obra › Hores (des de la V87.352).
4. Despeses › Mà d’obra (a mà o amb l’Excel).

Les dues primeres es desen a «hores del personal» i les dues últimes a Despeses. El Rendiment **les suma totes**: si l’encarregat posa
les hores al parte i l’oficina les torna a posar a Hores, surten el doble.

**Proposta:** un sol lloc on es desen, **Despeses › Mà d’obra** (on ja van les del parte i les de l’Excel). Hores › Personal i Obra ›
Hores es quedarien com una vista d’aquestes mateixes hores (per dia i per treballador), on també es poden entrar. Les que ja hi ha a
«hores del personal» hi passarien soles.

---

## 5. Errors trobats

- **Preus:** el títol «Només les partides que tu decideixes guardar» és fosc sobre fons fosc i no es llegeix.
- **Certificacions sense cap:** la capçalera de la taula surt amb franges fosques buides.
- **Ajustos › Imatge de l’empresa (V87.351) i Enllaços de les obres:** el contingut toca la vora de la targeta, sense marge.
- **Empresa › Dades:** codi postal, població i província ocupen una línia sencera cada un.
- **Comptador de temps** (ja era a la llista): compta en només mirar una obra i, al mòbil, tapa el contingut.

---

## 6. Què ens diferencia (per explicar-ho als clients)

**Al mercat hi ha dos tipus de programes:**

- **Programes grans d’empresa amb una app de partes a part** ([a3ERP Tree Construcción](https://www.wolterskluwer.com/es-es/solutions/a3erp/tree-construccion),
  [Cegid](https://www.cegid.com/ib/es/blog/app-partes-trabajo-control-diario-obra/), [SiS](https://www.softwaredoit.es/software-construccion/index.html)).
  Són potents, però per a empreses grans, a l’ordinador i cars. Segons Cegid, la construcció és dels sectors menys digitalitzats i
  l’app de partes és el que més els demanen.
- **Apps d’obra** (PlanRadar, [SafetyCulture, Buildertrend](https://safetyculture.com/es/aplicaciones/software-construccion)). Fan
  actes, fotos i registres diaris, però no tenen pressupost, certificacions ni factures. I Presto o Arquímedes no van a l’obra.

**El que tenim i no tenen junt:**

1. **De l’obra a la factura sense passar res a mà.**
   - Els amidaments i el pressupost es llegeixen de PDF, Excel o BC3.
   - El parte del dia es fa al mòbil.
   - Va sol a la certificació i d’aquí a la factura.
   - Les hores i el material del parte van a les despeses, i el Rendiment diu què es guanya a cada obra.
2. **Tècnic i constructora a la mateixa obra**, cadascú amb el seu número, el seu client i la seva part econòmica.
3. **Fet per com es treballa aquí:**
   - català i castellà, i els documents en l’idioma de l’obra;
   - els pobles i codis postals de Catalunya;
   - els tràmits del tècnic (cèdula, certificat energètic, ITE, amiant) amb els enllaços oficials.
4. **A l’obra de debò:** funciona sense cobertura, amb fotos, dictat i nota de veu a l’agenda.
5. **Amb la imatge de cada empresa:** el logo i el color, també als pressupostos i les factures.
6. **VeriFactu preparat** per a l’1/1/2027.
7. **La meitat del preu** que els programes separats (vegeu `guia-comercial.md`).

**Frase:** «De l’obra a la factura, sense passar res a mà».

**On encara anem enrere (per no prometre-ho):**

- no és a les botigues d’apps (s’instal·la des del navegador);
- encara no hi ha fitxatge legal dels treballadors;
- VeriFactu encara no està activat;
- la lectura amb IA encara passa per ChatGPT o Claude, fora de l’app.

---

## 7. Proposta d’ordre

- **V87.353, sense preguntar** (errors i frases que ja havies dit que no vols):
  - el títol de Preus;
  - els marges d’Ajustos;
  - fora les frases que expliquen (Inici, Agenda, Preus, Ajustos, Honoraris);
  - «Afegir treballadors» quan no n’hi ha;
  - el «· fitxa» de Dades;
  - codi postal, població i província en una línia.
- **V87.354, amb el teu sí:**
  - Inici sense repeticions;
  - Resum de l’obra més curt;
  - Fases amagades amb una sola fase;
  - Certificacions buides;
  - Documents compactes;
  - Preus;
  - Honoraris del tècnic;
  - Ajustos en 3 grups;
  - VeriFactu només a Ajustos;
  - una sola versió a la vista.
- **Decisió teva:** les hores del personal en un sol lloc (apartat 4).
