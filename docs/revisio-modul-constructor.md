# Revisió del mòdul de constructora (empresa)

L’Héctor, 21/10/2026: «el mòdul contractista o empresa és el que m’interessa tancar abans per ensenyar-lo a clients i començar a
treure un rendiment». Es fa com amb el tècnic: ell diu què canviar pantalla per pantalla, s’apunta aquí i es fa per tandes.

## Com provar-ho

- Compte de prova **demo-constructor** (o **demo-gestio** per veure-ho tot): dades d’exemple (3 obres amb pressupost, certificacions,
  despeses, planning, hores). S’ha de crear abans al panell de Supabase: `GUIES_USUARIS\COMPTES_DE_PROVA.txt`.
- O el teu compte, amb una obra de «Gestió integral d’obra».

## Pantalles que té ara la constructora

| Menú | Què hi ha |
|---|---|
| Inici | Requadres (obres obertes, en execució, esperant resposta, total), pròximes cites, feines pendents, nota de veu |
| Contactes | Clients, industrials, tècnics… en grups |
| Obres | Llista amb paquets i filtres; dins de cada obra: Fitxa · Seguiment · Econòmic |
| Preus | Llibreria de partides (i les habituals de cada client) |
| Hores | Personal (part del dia de cada treballador, amb el cost) · Les meves hores |
| Facturació | Proformes, «Fer factura» amb la sèrie del client, VeriFactu (aturat fins parlar amb la gestoria) |
| Despeses | Albarans, factures de material i subcontractes de totes les obres; albarà ↔ factura |
| Agenda | Cites, Google Calendar, nota de veu |
| Ajustos | Perfil i mòduls, dades de l’empresa, usuaris… |

Dins de l’obra, Econòmic: Amidaments (PDF, Excel, BC3) · Pressupost · Certificacions · Facturació · Despeses · Rendiment (cost real per
capítol) · Hores.

## Coses que ja sabem que falten (per decidir l’ordre)

- **Treballadors de l’empresa**: ara el perfil treballador té el seu espai; falta que vegi les obres de la seva empresa i que l’oficina
  vegi les seves hores i despeses (usuaris d’una mateixa empresa).
- **Hores per treballador** i cost per hora al Rendiment de l’obra (mòdul 3).
- **Factures de veritat (VeriFactu)**: aturat fins parlar amb la gestoria (obligatori per a les S.L. des de l’1/1/2027).
- **Llegir pressupostos i albarans amb IA directa** (sense copiar i enganxar): cal la clau d’Anthropic (de pagament, cèntims per lectura).
- **Portal del client** (que el promotor vegi l’obra, el pressupost i les certificacions amb el seu compte).
- **Comptador de temps automàtic** que no compti com a feina el temps que només es consulta una obra (replantejar-lo).

## Tandes

### Tanda 1 · V87.336 (21/10/2026 al vespre, l’Héctor amb el compte de Brava al mòbil)

- **Inici:** fora el gràfic «Resum d’expedients» (ja hi ha els requadres de dalt). A la constructora (i gestió total), **«Obres en
  curs»**: cada obra en execució amb el **% certificat** sobre el pressupost (sense imports) i la data de l’última certificació;
  en tocar-la s’obre. Compten els pressupostos que tenen alguna certificació. Al tècnic, res al costat.
- **Contactes:** els **promotors de les obres** (també de les que ens han compartit, com Verbania) hi surten encara que no siguin
  agents. Si se’n canvia un, passa a la llista pròpia.
- **Obra compartida:**
  - a Dades › Client hi surt el client de qui la comparteix i no es pot canviar (abans el desplegable deia «David Fuster»: el
    primer client propi, perquè el de l’obra no és a la llista de Brava);
  - Documents sense la carpeta «Despatx tècnic / honoraris» (són els honoraris de qui la comparteix).
- **Resum de l’obra:** el Cadastre només amb el mòdul tècnic; fora el gràfic «Import per certificació».
- **Pressupost:** un capítol principal que agrupa capítols (Verbania: «05 P1.FUSTERIA INTERIOR» amb «05.05 LACAT PORTES») és una
  sola línia plegada amb un sol total, com els altres; en tocar-la, s’obren els seus capítols una mica endins.
- **Agenda de l’obra:** «Nota de veu» (la cita queda a l’obra; «Posar-ho a l’agenda» o «Revisar i desar»).
- Arreglat de pas: en omplir un compte de prova amb dades d’exemple, les obres que ja li havien compartit s’esborraven.
- Prova: `tools/proves/constructor336test.mjs` (24).

### Tanda 2 · Facturació, despeses i rendiment (V87.337–338; l’Héctor, 21/10/2026 a la nit)

- **V87.337 · Facturació:**
  - **Sèrie de factures de l’empresa** (`F2026-001`…; la sèrie es pot canviar a «Fer factura»; el número següent mira totes les
    factures, també les de les obres compartides) i **l’empresa com a emissora** dels documents (Ajustos › **Dades de l’empresa**: nom
    fiscal, CIF, adreça, telèfon, correu, IBAN i logo). Si falten el CIF o l’adreça, «Fer factura» els demana.
  - **«Fer factura» a la certificació** (al costat de «PDF» i «Enviar»); amb la factura feta, la certificació diu «Factura F…».
    L’IVA i la retenció es trien a «Fer factura».
  - **Facturació (menú):** «Factures» en ordre numèric amb filtre per any, obra i cobrament («Pendent de cobrar» / «Cobrada» amb la
    data), totals i **Exportar Excel** per a la gestoria; «Per facturar»: les certificacions sense factura, amb «Fer factura» i «Ja
    facturada fora de l’app».
  - **Enviar per correu** (certificació, factura, pressupost): el client, les seves persones de contacte, el promotor i els agents de
    l’obra amb correu, o una adreça escrita; s’obre el correu de l’aparell (o Gmail). El PDF s’ha d’adjuntar a mà: per enviar-lo sol
    caldria un servei de correu al servidor (pendent de decidir).
  - **Arreglat:** a les obres amb dos pressupostos (Verbania, Maricel), cada proforma sumava les partides de tots dos (la Cert. 1 de
    Verbania sortia amb 60.209 € en lloc de 34.852 € i 25.356 €).
  - Quan hi hagi VeriFactu: la proforma (la certificació) i després «Emetre» amb VeriFactu; la factura surt al mateix llistat.
- **V87.338 · Despeses i rendiment:**
  - **Despeses:** requadres Factures de material · Factures d’industrials · Albarans · Despeses de l’empresa (filtren); tipus nou
    **«Despesa de l’empresa»** (sense obra, amb categoria: personal, lloguers, vehicles, maquinària, assegurances, gestoria,
    subministraments, oficina, altres DGE); **Exportar Excel**.
  - **Rendiment de l’obra:** certificat a origen − despeses = benefici, en € i en % de benefici industrial (i sobre el cost); el
    facturat i el pressupost, com a referència (si només s’ha facturat una part, el rendiment no surt en negatiu). A sota, el cost
    per capítol.
  - **Facturació › Rendiment:** totes les obres per any (ingressos, despeses, benefici, %), les despeses de l’empresa i el resultat.

### Tanda 3 · el paquet «Empresa» · V87.339 (22/10/2026)

- **Menú «Empresa»** (constructora i gestió total), abans d’Ajustos: **Dades** (les de la V87.337; ja no són a Ajustos) · **Treballadors**
  (nom, ofici, **cost per hora**, DNI, mòbil, alta, de baixa; documentació: PRL, revisió mèdica, EPI, alta a la SS) ·
  **Documentació** de l’empresa (REA, RC, Hisenda, Seguretat Social, pla de prevenció, servei de prevenció, mútua, i els que s’hi
  afegeixin) · **Industrials** (els de Contactes i «Nou industrial», amb la seva documentació: REA, RC, SS, Hisenda, TC2/RNT, PRL).
- Cada document: data de caducitat, arxiu adjunt (PDF o foto) o «El tinc»; estat **Vigent / Caduca d’aquí a N dies (30 o menys) /
  Caducat / Falta**, i a dalt l’avís dels caducats i dels que caduquen aviat.

### (pla inicial del paquet «Empresa»)

- **Dades de l’empresa:** nom, CIF, adreça, logo… (ara són a Ajustos).
- **Documentació general:** REA, documentació dels treballadors (formació, aptituds mèdiques, EPI), assegurances, amb dates de
  caducitat.
- **Treballadors:** nom, ofici, **cost per hora** (es pot canviar per obra).
- **Industrials:** els de Contactes, amb la seva documentació.

### Tanda 4 · personal propi · V87.340 (22/10/2026)

- **Hores (menú)** de la constructora i la gestió total: «Personal» (de sèrie) · «Les meves hores» (la pantalla d’abans).
  **«Hores del personal»** és un part del dia: el dia (‹ › i el calendari), cada treballador d’alta amb l’obra (les obertes) i les
  hores, «+ Una altra obra» si n’ha fet més d’una, el total del dia (hores i €) i «Desar el dia». Tornar a desar un dia el canvia
  (no es duplica). Un dia buit ja porta l’última obra de cadascú; «Com el …» copia el dia d’abans. A sota, la setmana per treballador.
- **Dins de l’obra › Econòmic › Hores:** «Hores del personal» (hores i cost), per treballador amb **el cost per hora en aquesta obra**
  (si es deixa buit, el de l’empresa), «Per dies» i «+ Afegir hores».
- **Rendiment:** el cost del personal entra a les despeses de l’obra («Personal») i al Rendiment de totes les obres.
- No va a Despeses ni a l’Excel de la gestoria (les nòmines ja hi van per una altra banda).
- El cost per hora de cada treballador és de l’empresa: en una obra compartida, l’altre compte no el veu.
- **Pendent:** que cada treballador apunti les seves hores des del seu mòbil (usuaris d’una mateixa empresa) i el **fitxatge**
  (estudiar si és viable lligar-lo: argument de venda).

### Tanda 5 · Planning · V87.341 (22/10/2026)

- **Vinculacions:** a «Planificar», el «⋯» de cada capítol obre la seva finestra: comença **en una data** o **després d’un altre
  capítol** — en acabar, uns dies **abans que acabi** (s’encavalquen) o uns dies **després que acabi** — i la durada en dies
  laborables. Si se n’allarga un, els que en depenen es mouen sols. Al Gantt, una fletxa de cada capítol al que en depèn; a la
  columna, «↳ 02 −2 d». No es pot vincular un capítol a un que ja en depèn.
- «Generar planning» amb «Un capítol darrere l’altre» ja els deixa vinculats.
- **Qui hi treballa** (a la mateixa finestra): colles, treballadors (Empresa › Treballadors, amb el camp nou **«Colla»**) i
  industrials (els de Contactes). Surt al costat de la barra. Si una persona és a dos capítols els mateixos dies (també per la
  colla), avís a dalt del Gantt.
- «Treure del planning»: els que en depenien es queden a la data on eren.
- Una data d’inici en dissabte o diumenge comença el dilluns.
- Fora els textos que explicaven el Planning.
- **Fet a la V87.381:** Agenda › «Equip», totes les obres alhora per treballador, colla o industrial (on és cadascú cada dia,
  en vermell si és a dues obres). **Pendent:** que els treballadors vegin al mòbil el seu planning (cal lligar el compte del treballador).

### Tanda 6 · fases, rendiment i despeses · V87.342–344 (22/10/2026, l’Héctor mirant Verbania i entrant les despeses de Socoterm)

- **Fases** (V87.342): cada pressupost de l’obra és una fase. A dalt de l’Econòmic (Amidaments, Pressupost, Certificacions,
  Facturació, Despeses i Rendiment), la barra «Fases» (número, nom, import i % certificat); a Despeses i Rendiment també «Tota
  l’obra». Al «⋯»: nova fase, canviar el nom, eliminar. Els amidaments, les despeses i les hores del personal van per fase.
- **Rendiment de l’obra per fase**: pressupost, certificat a origen i facturat; el compte: ingressos − materials − mà d’obra −
  industrials = marge; − DGE (% dels ingressos) = benefici, amb el BI previst («N punts per sobre/sota»). DGE i BI previst es posen
  a l’obra (al Rendiment) o a Empresa › Dades per a totes. A sota, «Per capítols» (pressupost, certificat, % executat, cost real).
  Fora el «Seguiment econòmic · inicial i actual» que no s’entenia.
- **Hores de la constructora** (V87.342): només el personal; fora «Les meves hores» i el comptador automàtic (el cap, si compta,
  és un treballador més; si no, va dins del DGE).
- **Rendiment de l’empresa** (V87.343, menú sota Despeses): l’any, filtre per obres, xifres (ingressos, costos directes, marge,
  benefici després de DGE i resultat de l’empresa amb les despeses reals de l’empresa), gràfiques de línies (mes a mes, entre anys,
  entre obres) i la taula per obres. Avisa si el DGE previst no cobreix les despeses reals de l’empresa.
- **V87.344**: a la constructora, totes les obres amb les pestanyes d’una gestió integral (també les de «només pressupost»: hi ha
  Despeses) i només tres tipus de treball (Gestió integral, Pressupost, Altres). Despeses en **Materials** (factures i albarans) ·
  **Mà d’obra** (tipus nou, i al Rendiment també les hores del personal) · **Industrials**, també dins de l’obra. **Importar
  despeses d’un Excel**: llegeix totes les pestanyes (busca la fila de títols: data, proveïdor, número, concepte, base, IVA, total,
  obra), el tipus de cada pestanya surt del seu nom, es tria l’obra, es poden desmarcar files i les que ja hi són no es tornen a
  importar.
- **V87.345** (l’Héctor amb l’Excel «CONTROL BENEFICIO» de Les Moreres: «m’ho ha posat tot com a materials»): entén les pestanyes en
  castellà (Materiales, Trabajadores, Combustible, Comisión), grups nous **Altres** (combustible, lloguers…) i **Comissió**; la pestanya
  «Facturado» entra com a factures de l’obra (compten com a facturat al Rendiment); Beneficio, Rendimiento i Resumen no s’importen.
  L’Excel queda a **Documents › 99 · Altres** de l’obra. A la llista de despeses, **Seleccionar**: totes, unes quantes o les d’un Excel
  (o d’una pestanya), i canviar-ne el tipus, l’obra o la fase, marcar-les com a repercutides o eliminar-les.
- **V87.346 · Comissió al pressupost**: botó % amb un llum a la capçalera del pressupost. Es posa el % i totes les partides
  d’aquell pressupost pugen aquest %; treure-la torna a l’original. Per editar, es treu i es torna a posar en guardar. A la llibreria hi
  va sempre el preu sense comissió. Els documents no en diuen res (el client final no l’ha de saber).
- **V87.347** (l’Héctor amb Socoterm): les obres que li comparteix l’Héctor no s’eliminen («Treure de la meva llista»), tenen un número
  propi de l’empresa amb el de l’Héctor al costat, i el client és el promotor (o el que triï l’empresa, sense tocar l’obra de l’Héctor).
  Al desplegable del client hi ha també els altres contactes. El Rendiment ja no suma dues vegades la factura de l’app i la de l’Excel.
  Fora «repercutir al client» a les constructores; la selecció avisa on van les despeses.
- **V87.348**: llista de despeses per grups i en columnes (número, data, entrada, proveïdor, base, IVA, total), factures de diverses
  línies amb el desglossament a dins, mà d’obra per dies i treballadors per categoria (amb hores i €/hora), l’ull per veure la factura o la
  foto, filtres de proveïdor (sense treballadors), treballador i cerca, i vistes Tot · En execució · Per obra · Per any.
- **V87.349 · Partes d’obra** (a Seguiment; decisions de l’Héctor sobre `docs/proposta-parts-obra.md`): el parte del dia sobre el
  pressupost (Feta / Una part: %, quantitat feta, fet avui o mesures), feina fora de pressupost (amb hores i material si es vol), «Desar»
  (per revisar) i «Està bé · a la propera certificació». Al mòbil, a Despeses, els requadres baixen fins a la llista i els filtres són plegats.
- **V87.350**: partes més fàcils (llista per mesos; en tocar un dia, el resum amb només el que s’hi ha fet; «Una part» amb dues
  preguntes; filtre «Per fer»; botons «Guardar · Per revisar» i «Passar a la certificació · Ja està revisat») i Despeses plegades d’entrada.
- **Demanat:** imatge de l’empresa a Ajustos (logo, color de l’app, documents amb el logo i el color) i auditoria de tota l’app.
- **V87.351–359:** imatge de l’empresa, partes amb hores i material, auditoria i simplificacions, hores en un sol lloc, foto del
  Cadastre, fitxatge (fase 1), importar obres d’anys anteriors; V87.359: despeses del parte a les obres compartides, esborrar la
  certificació i treure un parte de la certificació.

### Tanda 6 · demanat el 23/10/2026 al migdia

1. **Número de versió** només a la cantonada (fora del menú i d’Ajustos).
2. **Tots els llistats en ordre d’entrada** (obres, factures, despeses…), també les obres compartides; a les compartides, **una columna
   amb el codi de l’Héctor** (qui la comparteix) per saber de què es parla.
3. **Avisos** a l’Inici i a l’obra: toca fer la certificació, partes per revisar, documentació de l’empresa que caduca (REA, Seguretat
   Social…).
4. **Pressupost:** veure una partida completa tocant-la (número, descripció, mà d’obra, material, altres, i després CI, DGE i BI); preu
   manual amb un descompost senzill (com el preu d’un industrial); **resum del pressupost** (material —desglossable—, mà d’obra i altres,
   amb quantitats i %).
5. **Afegir una partida de la llibreria** al pressupost: no funcionava i és difícil de seguir; fer-ho més fàcil.
6. **Planning al mòbil** en taula (inici, final, vinculacions i colles), sense el gràfic.
7. **Dades del contractista:** menys camps, pestanyes principals que es despleguen en tocar-les (sense haver de baixar i baixar).
8. **Icones en lloc de paraules** (impressora per imprimir, llapis per editar…): valorar què s’entén més.
9. **Pendent de decidir:** posar preus a tot el pressupost amb IA (BEDEC o CYPE); productes d’una marca (Kerakoll) als descompostos
   (l’Héctor n’enviarà l’enllaç); fitxatge des del mòbil de cada treballador; comptador de temps; barra de fases amb una sola fase;
   importar anys anteriors des d’un PDF (quan hi hagi el fitxer d’un client).

### Recordatori

- **Facturació:** proforma → factura amb VeriFactu (aturat fins que l’Héctor parli amb la gestoria).

### Tanda 7 · demanat el 23/10/2026 al vespre (l’Héctor amb el compte de Socoterm, obra «CP EDEN PLAYA»)

1. **Certificacions:** una certificació amb factura s’ha pogut tocar (el Σ en mode consulta obria l’edició i va deixar la partida a 0,
   mentre l’import i la factura es quedaven a 4.487,50 €). Bloquejar-la del tot; la quantitat s’ha de poder escriure directament (no només
   amb Σ); botons ordenats: fora «Més» (només hi havia «Importar»), una línia amb Editar i un desplegable amb la resta (icona + paraula,
   opció B); el número de factura fora de les accions, en una **columna pròpia de la llista** (número correlatiu o «Pendent»); la llista
   i el resum, més estrets (columnes massa amples); adaptat a cada pantalla.
2. **Documents de l’obra:** tots els grups a la vista; en tocar-ne un, els seus documents al costat (o a dalt al mòbil), sense baixar.
3. **Partes d’obra:** el mateix (els capítols a la vista i, en tocar-ne un, les seves partides sense baixar).
4. **Rendiment de l’obra:** també la gràfica.
5. **Hores dins de l’obra:** a la constructora sobra (les hores ja són a Despeses › Mà d’obra).
6. **Icones:** opció B (icona i paraula) als botons.
7. Les revisions automàtiques han de mirar també que les dades quadrin (certificació = partides, factura = certificació).
8. Termini: tot tancat i provat a final de la setmana que ve (30/10/2026).
