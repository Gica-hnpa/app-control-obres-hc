# Revisió del mòdul tècnic, pestanya per pestanya (20/10/2026)

L’Héctor revisa l’app oberta i diu què canviar; s’apunta aquí i es fa per tandes (no es toca el codi fins que una
tanda està decidida). Després es farà el mateix amb els altres mòduls.

## 1. Inici — fet a la V87.314

1. **Requadres de dalt que porten on diuen**: en tocar-ne un s’obre la llista d’expedients filtrada amb el que diu el
   títol, i res més:
   - «Expedients oberts» → només els oberts;
   - «En execució» → només els que estan en curs;
   - «Esperant resposta» → només els pressupostats o pendents de resposta.
   Hi ha d’haver un requadre nou **«Total expedients»** → tots.
2. **Ordinador: aprofitar l’espai**. A l’esquerra, una sota l’altra:
   - **Pròximes cites**: les visites de l’Agenda;
   - **Feines pendents**: tasques que ell es programa amb una data límit, amb **avisos de colors** a mesura que
     s’acosta la data.
   A la dreta, el **Resum d’expedients amb el gràfic**, que es queda (dona color i no és tant text).
3. **Fora «Treballs oberts del mes»**: es repeteix amb altres pestanyes.
4. Fora els textos que expliquen l’app («Afegeix-ne una amb el botó superior», «Obre el desplegable…», «estat «En curs /
   Actiu»», «de 0 pendents»).

## 2. Clients i Agents → un sol «Contactes» (decidit el 20/10/2026) — fet a la V87.315

1. **Un sol directori «Contactes»** al menú, en lloc de Clients i Agents (Agents és la mateixa llibreria de persones
   que es repeteixen en obres i expedients). Grups: **Promotors · Constructores / contractistes · Tècnics · Industrials ·
   Immobiliàries / agències · Altres** (les immobiliàries són clients potencials d’un tècnic: certificats). Les obres i les
   actes agafen les persones d’aquí. No es perd cap dada.
2. Fora els rètols **TOTAL · OBRA · TIPOLOGIES** (no s’entenen i en tocar-los no fan res).
3. **Mòbil i iPad sense haver de baixar tant**: grups plegats que s’obren en tocar-los.
4. **Cercador**: «br» treu contactes que no ho porten (Socoterm, Alberto…). Ha de buscar al nom.
5. **Fitxa del contacte**: els camps que ja vam decidir (nom, raó social, tipologia, NIF, correu, telèfon, adreça, CP,
   població) més **persona de contacte i mòbil**, amb **«+ Afegir una altra persona de contacte»** (p. ex. dos
   encarregats d’una empresa).
6. **Telèfons que es poden tocar** per trucar (mòbil i iPad).
7. **Logo** a la fitxa (sobretot les empreses; alguns ja en tenen).
8. Fora els textos que expliquen («Aquesta pestanya manté el directori ordenat…»).

## 3. Expedients — fet a la V87.314

1. **Primer, paquets per estat** (com a l’Inici): en tocar-ne un, els seus expedients **per any i per número**. Els
   tancats no cal veure’ls sempre (només per consultar).
2. **El número d’expedient és el seu, com a tècnic.** Dins de la fitxa, a més, el **número del client** (expedient,
   obra o pressupost de Brava, Socoterm…).

## 4. Pressupostos (menú principal) — fet a la V87.316

1. **Primer la llista** dels seus pressupostos als clients, per any i per número (ara és a baix de tot).
2. Els totals (amb i sense IVA, facturat, comparatives) **en pestanyes agrupades**, sense ocupar tanta pantalla.
3. **Mòbil**: la llista ara llisca de costat; ha de ser diferent (targetes).

## 5. Agents

(ajuntat a Contactes, apartat 2)

## Tanda 2 (20/10/2026, després de veure la tanda 1 publicada) — fet a la V87.317

### Pressupostos (segona volta)
1. **La llista és el principal**, a dalt i ben visible: per blocs d’any. Primer l’**any en curs**; els altres anys amb un
   desplegable (o «Tots»).
2. Abans de la llista, **requadres de colors** que filtren en tocar-los (com a l’Inici): pendents, acceptats, no acceptats,
   facturats, tots.
3. **A sota i plegat**: gràfics i resums (informes escrits, comparatius, gràfica lineal) en pestanyes que s’obren només si es
   toquen. No carregar l’app amb coses obertes que no calen. Fora «Lectura ràpida».
4. **Mòbil i iPad sense lliscar cap a la dreta**; les accions de cada pressupost en un sol desplegable, amb les més fetes servir a
   la vista.
5. «Obrir calculadora» i «Calcular amb barem d’honoraris» són el mateix: un sol botó.

### Preus
- Al tècnic, **fora del menú**: només dins d’un pressupost d’un expedient (project manager, control integral).

### Hores (abans de Facturació al menú)
1. El resum de dalt es pot quedar; la gràfica a sota o en una pestanya / desplegable (tipus de gràfica o informe).
2. Només els expedients **actius, oberts i en procés**: què hi estic dedicant.
3. Cada apunt amb el seu estat i color: **facturat / pendent / no es factura**, i accions (facturar, eliminar, no comptabilitzar…).
   Dins d’un expedient: totes les hores per dies amb l’estat al costat (pot estar facturat en part). Quan tots els apunts estan
   facturats o «no es factura», l’expedient ja és per tancar.

### Despeses (les meves)
- Les seves, també per expedients actius o oberts. Tipus de despesa d’un tècnic: desplaçaments (km), dietes, aparcament,
  peatges, material, taxes de visat, taxes i llicències, fotocòpies i impressions, missatgeria, altres.
- **Ajuntar hores i despeses**: en obrir un expedient es veu tot de cop.

### Agenda
- De moment, bé.

## Tanda 3 (20/10/2026) — fet a la V87.318

### Despeses (menú principal)
- «Em surten les que tinc… però on les entro? A cada expedient hauria de fer-ho. En comptes d’un llistat que ara està a 0, no
  podria entrar-les aquí i assignar-li una obra o expedient?»
  - Al menú hi surten **totes** les seves despeses: les meves (desplaçaments, taxes…) i les de les obres (albarans, material).
  - «+ Nova despesa» a dalt; a l’editor, primer **«Meva / De l’obra»** i just a sota **l’expedient**.
  - «Totes · Les meves · De les obres» i **«Per data / Per expedient»**.
  - Sense cap despesa, no surten els requadres a 0.
  - A **Hores i despeses**, «+ Despesa» a dalt i a cada expedient.

## Tanda 4 (20/10/2026, tarda) — dins de l’expedient, començant per la gestió integral — fet a les V87.319–322

### Fitxa (Resum · Dades · Documents · Entrega)
1. **Entrega sobra**: a Documents, un paquet més de **«Final d’obra»** (sempre, encara que només calgui quan fa direcció d’obra).
2. **Dades › Obra: massa coses a emplenar.** «Definició tipus de feina» encara; **«Direcció / criteri de l’obra» i «Observacions
   internes» no les emplena mai**: fora (sense perdre el que hi hagi escrit).
3. **Agents**: poden estar aquí. Però en grups plegats: si en toca un l’emplena; si no, no ocupa pantalla ni cal fer tant scroll.

### Seguiment
4. **Agenda**, bé. Les **tasques de l’expedient** (a sota) haurien de recordar-se com les «Feines pendents» de l’Inici.
5. **Planning**, molt bé; vigilar l’iPad i el mòbil (veure’l en horitzontal?).

### Econòmic › Pressupost
6. «Pressupost per al client» no s’entén si no ho saps: dir-ne **«Ajustos del pressupost»** (observacions, formes de pagament…).
7. Diversos pressupostos (1a fase, posteriors…): bé, però mirar-ho als aparells petits.
8. **Avisos** («3 partides certificades per sobre…», «1 codi repetit»): no a dalt; **al final** de la pantalla o en una pestanya
   lateral. I que l’app avisi sola de més coses (pressupost passat, partides sense preu…).
9. En obrir el pressupost, **tots els capítols plegats** (ara s’obre el primer).
10. **Estructura**: el capítol surt dues vegades (requadre blau «Capítol principal» i a sota la fila gris amb les partides):
    ocupa molta pantalla sense sentit. Una sola fila per capítol.
11. **«Accions»**: massa opcions dins d’un sol menú. 3 o 4 grups a la vista (editar, crear i importar…) o un desplegable
    resumit; mirar si tot serveix o si hi ha coses repetides.
12. **Capítol i partides**: «Accions del capítol», «Marcar», «Accions» a cada partida (editar, amidaments, descripció,
    descompost, desar a la llibreria, moure de capítol, eliminar…): massa coses, lia. Ha de ser fàcil per a un autònom que
    s’ho porta tot ell.

## Següent

Expedients (dins de l’expedient) · Preus · Facturació · Agenda · Ajustos i, dins de l’expedient, Fitxa (Resum, Dades i agents, Documents,
Entrega), Seguiment (Visites, Agenda, Planning) i Econòmic (Pressupost, Certificacions, Facturació, Despeses, Rendiment,
Honoraris).
