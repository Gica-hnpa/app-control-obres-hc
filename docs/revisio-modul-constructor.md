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

### Tanda 2 · el paquet «Empresa» (pendent)

- **Dades de l’empresa:** nom, CIF, adreça, logo… (ara són a Ajustos).
- **Documentació general:** REA, documentació dels treballadors (formació, aptituds mèdiques, EPI), assegurances, amb dates de
  caducitat.
- **Treballadors:** nom, ofici, **cost per hora** (es pot canviar per obra).
- **Industrials:** els de Contactes, amb la seva documentació.

### Tanda 3 · despeses, hores i rendiment (pendent)

- **Despeses:** factures de material, factures d’industrials i **cost del personal propi**.
- **Hores de la constructora:** per dies, les hores de cada treballador a cada obra × el cost per hora (de l’empresa o de l’obra).
  Potser dins de Despeses (com a personal).
- **Rendiment:** el principal és **facturat / certificat − total de despeses**; el pressupost, com a referència.
- **Fitxatge del personal:** estudiar si és viable lligar-lo (argument de venda).

### Tanda 4 · Planning (pendent)

- Un Gantt de debò: data d’inici, durada, **vinculacions** (en acabar una, començar l’altra; començar-ne una 2 dies abans que acabi
  l’altra), **colles** i industrials assignats. Necessita primer els treballadors de l’empresa (tanda 2).

### Recordatori

- **Facturació:** proforma → factura amb VeriFactu (aturat fins que l’Héctor parli amb la gestoria).
