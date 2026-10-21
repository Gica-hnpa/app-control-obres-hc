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

(per omplir amb el que digui l’Héctor)
