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
| Hores | Hores per obra (encara no per treballador) |
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

### Tanda 4 · personal propi (pendent)

- **Cost del personal propi a les obres:** per dies, les hores de cada treballador a cada obra × el cost per hora (de l’empresa o de
  l’obra). Potser dins de Despeses (com a personal); entraria al Rendiment de l’obra.
- **Fitxatge del personal:** estudiar si és viable lligar-lo (argument de venda).

### Tanda 5 · Planning (pendent)

- Un Gantt de debò: data d’inici, durada, **vinculacions** (en acabar una, començar l’altra; començar-ne una 2 dies abans que acabi
  l’altra), **colles** i industrials assignats. Necessita primer els treballadors de l’empresa (tanda 2).

### Recordatori

- **Facturació:** proforma → factura amb VeriFactu (aturat fins que l’Héctor parli amb la gestoria).
