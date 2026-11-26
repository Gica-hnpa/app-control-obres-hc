# Repàs de la constructora, pantalla per pantalla (25/11/2026)

L'Héctor: «a la tarda mirarem pantalla a pantalla segons el perfil per comprovar errors que he vist». Primer perfil: **constructora**.
Cada pantalla, a l'ordinador i al mòbil. Els errors s'apunten aquí; s'arreglen per tandes i cada tanda es publica. Per a cada error, una prova
que faci el camí sencer com un usuari, perquè no torni.

Estat de cada línia: ☐ per mirar · ✎ apuntat (per arreglar) · ✔ arreglat (versió)

## Fora de l'obra (menú)

1. ☐ **Inici** — salutació, rajoles, obres en curs, avisos, el temps
2. ☐ **Contactes** — clients, industrials, fitxa
3. ☐ **Obres** — llista, filtres, obra nova, importar
4. ☐ **Control horari** — personal, fitxatge, calendari, validar
5. ☐ **Pressupostos** — llistat i estat
6. ☐ **Comptabilitat** — Facturació · Despeses · Caixa i bancs · Rendiment
7. ☐ **Agenda** — cites, equip, Google Calendar
8. ☐ **Empresa** — dades, treballadors, documentació, industrials, calendari laboral
9. ☐ **Ajustos**

## Dins de l'obra

10. ☐ **Fitxa** — Resum · Dades · Agents · Documents · Fotografies · Industrials / comparatius · Tancament
11. ☐ **Dia a dia** — Partes d'obra · Notes · Actes · Agenda · Tasques · Planning
12. ☐ **Pressupost** — Amidaments · Pressupost · Certificacions. **Recordar a l'Héctor:** al pressupost d'un client (amidaments i «Afegir de la llibreria»), primer el preu que ja se li va fer en una altra obra («Preu d'aquest client · Obra X» / «D'aquest client»), sol, sense targeta (punt 10)
13. ☐ **Comptabilitat de l'obra** — Facturació · Albarans i despeses · Rendiment

## Errors apuntats

| # | Pantalla | Aparell | Què passa | Estat |
|---|---|---|---|---|
| 1 | Obra › Pressupost › Ajustos | tots | L'IVA del pressupost no passava a la proforma ni a la factura (client de Socoterm) | ✔ V87.662 |
| 2 | Menú | ordinador | Amb el logo de l'empresa, G3C no sortia a dalt | ✔ V87.662 |
| 3 | Obra › capçalera | mòbil | L'estat sortia tallat («Pendent de resp…») | ✔ V87.662 |
| 4 | Barra de baix | mòbil de 360 px | «Expedie…» tallat | ✔ V87.662 |
| 5 | Obrir l'app | mòbil | A vegades triga uns segons a obrir-se. Possibles causes: just després de publicar una versió es torna a baixar l'app (~1 MB; V87.649: 7 s amb 4G lent) i, després d'«Entrar», s'esperen els canvis del núvol (`cycle({startup:true})`) abans d'ensenyar res. Per mesurar amb `v649test` | ✎ |
| 6 | Obrir l'app | mòbil | A vegades no s'obre a l'Inici sinó a la pantalla on era. La V87.635 ja posa l'Inici en obrir i recarregar; torna on eres (1) quan el mòbil no havia tancat l'app (només era al fons: tampoc demana la contrasenya) i (2) quan l'app es recarrega sola per portar canvis d'un altre aparell (`reloadSafely`, `aco-on-era`) | ✎ decidir |
| 7 | Obrir l'app | iPhone | A sovint s'ha de fer petita amb els dits. Arreglat a la V87.661 (zoom en tocar un camp de menys de 16 px); comprovar que el mòbil ja és a la V87.661 i, si torna a passar, captura abans de fer-la petita. Al meu recorregut: mirar si alguna pantalla és més ampla que el mòbil | ✎ comprovar |
| 8 | Contactes › «Des de les despeses» | tots | Hauria de ser automàtic: quan es llegeix una factura (despesa) d'una empresa o persona que no és a Contactes, crear el contacte al grup que toca (Industrials / Magatzems), o com a mínim un avís a Contactes «contacte nou per comprovar o posar al grup»; potser també a l'Inici | ✎ a mig fer (V87.663): sols al grup que toca, avís a Contactes i a l'Inici; els d'abans, amb «Des de les despeses» |
| 9 | Contactes › «Seleccionar» | tots | «Moure a… · Moure · Eliminar» i «Acabar»: no s'entén si «Moure» ja fa el canvi (sí, al moment) ni què fa «Acabar» (surt de la selecció). Ha de dir «Fet» | ✎ a mig fer (V87.663): «Cancel·lar» (Moure i Eliminar ja tanquen la selecció) |
| 10 | Contactes › fitxa d'un contacte | ordinador | Hauria de sortir amb les dades a la vista, i només «Editar» (ara «Veure dades» i «Editar client»). La pestanya «Obres» té sentit; «Partides habituals» (V87.280) no s'entén aquí | ✎ a mig fer (V87.663): dades a la vista i «Editar» a l'ordinador. Partides habituals: avui només surten a «Afegir de la llibreria» si abans s'ha tocat «Posar-les a la llibreria del client»; el pressupost dels amidaments no les fa servir (base → Preus → banc → mitjana de totes les obres). Proposta: treure-les de la fitxa i, al pressupost (a mà i amidaments), primer el preu que ja es va fer a aquest client en una altra obra («Preu d'aquest client: obra X»). **Decidit (25/11):** fora de la fitxa (fet, V87.663); el preu del client, sol i sense targeta, quan es miri la pantalla de Pressupost (recordar-l'hi) |
| 11 | Després d'«Entrar» | mòbil | Mesurat (`v663velocitat`, mòbil lent simulat, dades de prova): 0,98 s. Contrasenya al núvol 0,2 s → empremta 0,15 s (s'espera) → paquets i canvis del núvol 0,2 s → obres compartides 0,2 s (després, no alhora) → pintar 0,3 s. Al mòbil de debò, cada viatge al núvol pot ser de 0,5–1 s | ✎ a mig fer (V87.663): empremta de fons i compartides alhora |
| 12 | Tornar a l'app després de 30 min al fons | mòbil | Decisió de l'Héctor (25/11): demanar la contrasenya i anar a l'Inici | ✎ a mig fer (V87.663) |
| 13 | Inici › rajoles de les obres | ordinador | El client i el lloc surten tallats amb «…»; al mòbil (Obres) es veuen sencers amb el tipus de treball. Afegir-hi la data de creació de l'expedient | ✎ a mig fer (V87.663) |
| 14 | Obres › llista | ordinador | L'agrupació (any › «Les meves obres» / una franja lila per cada client que comparteix › obres) i les alineacions no són nítides: tres nivells amb fons diferents, el nom del client repetit a la franja i a la columna, «Compartida» repetit (franja, columna i etiqueta sota el nom), les pestanyes Totes/Obertes enganxades a la vora. Revisar-ho amb el connector de disseny (ui-design-review) i portar la proposta abans de fer-la. L'Héctor: «al mòbil tot molt millor, molt més ordenat» → la llista del mòbil (targetes: número · client, nom, tipus · població, estat · data) com a model | ✎ proposta |
| 15 | Obres › llista | ordinador | A les obres compartides surt el número d'expedient de l'Héctor (2026-004) al costat del de la Brava (2026-025): al constructor no li serveix; treure'l (com a molt, «de Héctor Cubero») | ✎ |
| 16 | Obres › llista | ordinador | L'ordre i l'estructura de les columnes: «Tipologia treball» repeteix la línia grisa de sota el nom; «Compartida per» ocupa una columna per a poques obres; el nom del treball s'emporta massa amplada | ✎ proposta (amb el 14) |
| 17 | Obres › estats | tots | El client de Socoterm: els colors dels estats s'assemblen massa (p. ex. «En procés» i «En curs / Actiu», tots dos verds). Colors ben diferents per a cada estat | ✎ proposta (amb el 14) |
| 18 | Obres › llista | ordinador | Repartir millor l'amplada: l'adreça surt en dues línies i la població en una tercera | ✎ |
| 19 | Obres › adreça | tots | Davant de la població, el codi postal (p. ex. «17250 Sant Antoni de Calonge») | ✎ |
| 20 | Obres › «Importar» | tots | L'Héctor no sabia què fa (V87.358: la llista d'obres d'anys anteriors i les seves factures d'un Excel o CSV, perquè l'empresa no comenci buida). El nom del botó no ho diu: p. ex. «Importar obres d'un Excel» o «Obres d'anys anteriors». L'Héctor: «no ho veig clar ni pràctic»; l'Excel ha de ser una taula amb títols de columna que l'app reconegui, i qui comenci el 2027 només arrossegarà alguna obra del 2026, que és millor entrar a mà (Nova obra → importar el pressupost → importar la darrera certificació a origen). Proposta: treure «Importar» de la llista d'Obres i, com a molt, deixar-lo a Ajustos per a qui vulgui l'històric. Mirar a «Nova obra» que el camí d'una obra arrossegada sigui clar (certificacions fetes fora de l'app). **Decidit (25/11): treure'l del tot** (també el punt 21 deixa de valer per a aquest botó) | ✎ |
| 21 | Obres › «Importar» (i altres botons) | ordinador | «Importar» surt com a text sol, sense requadre: no s'endevina que es pot tocar. Ha de ser un botó com els de Contactes (requadre blanc amb vora i icona). Mirar tots els botons secundaris que surten com a text pla (p. ex. «Veure dades» / «Editar client» de la fitxa del contacte) | ✎ |
| 22 | Obres › «Filtres» | tots | L'Héctor: no val la pena i no és correcte (a «Client» no hi surten tots: `ExpFilters878275` només posa els clients que són a Contactes; els de les obres compartides —MANUEL CEBRIÁN, VILASECA— no hi són) i amb moltes obres serà inacabable. Treure el bloc «Filtres» i deixar només el cercador (la lupa), que ha de trobar per tot: any, número, estat, client, promotor, tipus de treball, nom, adreça, codi postal i població. Diverses paraules alhora es combinen (p. ex. «2025 tancat», «brava reforma»). Es queden Totes / Obertes / Tancades | ✎ |
| 23 | Totes les pantalles | ordinador | Sobra espai buit entre el menú blau nit i el contingut i al marge dret: aprofitar l'amplada. A la captura de l'Héctor d'Obres: la llista va dins d'una targeta separada del menú i de la dreta per una franja grisa; a dins, les pestanyes Totes/Obertes/Tancades i «Filtres» toquen la vora de la targeta, mentre que el cercador i la taula tenen marge: tot alineat al mateix marge | ✎ proposta (amb el 14) |
| 24 | Totes les pantalles | ordinador | El títol de la pantalla («Obres»…) com al mòbil: una barra blau nit a dalt, amb el títol una mica més gran (Barlow Condensed, en blanc) i els botons principals («Nova obra»…) a la mateixa barra; tot integrat amb el menú. Per a totes les pantalles, no només Obres. Mai text fosc sobre el blau | ✎ proposta (amb el 14), amb imatge d'abans i després |
| 25 | Obres › llista | mòbil i iPad | L'any surt petit, i hi ha tres menes de targetes que no s'assemblen ni s'alineen: l'any (sense res), «Les meves obres» / cada client, i les obres. Proposta de l'Héctor: tot plegable per nivells — els anys plegats; en obrir-ne un, els clients plegats; en obrir un client, les seves obres — amb les targetes de cada nivell iguals, ordenades i alineades (com les targetes plegables de la resta de l'app). Revisar-ho amb el connector de disseny junt amb el 14. Cada nivell es pot distingir pel color, com fins ara (l'any, els clients que comparteixen en lila…), però amb la mateixa forma de targeta. A decidir: l'any d'ara obert de sèrie? | ✎ proposta |
| 26 | Obres › llista | ordinador | Decidit amb l'Héctor (25/11): a l'ordinador, NO plegable: totes les obres a la vista, a tota l'amplada, amb l'any com a títol de grup (sense franges per client: la compartida es marca a la fila) i filtrant amb Obertes / Tancades / Totes i el cercador. El plegable per nivells (punt 25), només al mòbil i l'iPad | ✎ proposta (amb el 14) |
| 27 | Menú (ordre) | tots | Ara: Inici · Contactes · Obres · Control horari · Pressupostos · Comptabilitat · Agenda · Empresa · Ajustos. L'Héctor: ¿Control horari abans de Pressupostos? Proposta: primer la feina de cada dia, després els números i al final les fitxes i els ajustos — Inici · Obres · Pressupostos · Agenda · Control horari · Comptabilitat · Contactes · Empresa · Ajustos. El mateix ordre per al tècnic (Expedients, Hores…) i per a les rajoles de l'Inici del mòbil. **L'Héctor (25/11): Contactes es queda on és (2n)** → Inici · Contactes · Obres · Pressupostos · Agenda · Control horari · Comptabilitat · Empresa · Ajustos. Cada paquet només treu opcions, no en canvia l'ordre (constructora sense «Personal i fitxatge»: sense Control horari; sense «Control d'obra» ni «Factures»: sense Comptabilitat; tècnic: Pressupostos = honoraris, Hores amb «Hores i rendiment», sense Empresa; finques: Inici · Contactes · Obres · Agenda · Ajustos) | ✎ confirmar |
| 28 | Paquets de la constructora | — | L'Héctor: ¿per què «Factures i comptabilitat» és un paquet diferent de «Control d'obra»? Control d'obra sense factures només dona despeses i rendiment. Proposta: partir-los com el menú — «Control d'obra» (a peu d'obra: partes, planning, equip, foto de l'albarà) i «Comptabilitat» (al despatx: factures, cobraments, despeses, caixa i bancs, rendiment, gestoria), que és el desplegable sencer. Toca el document «Perfils i paquets» (preus encara per decidir). L'Héctor: «estem barrejant paquets que hi ha dins de l'obra». Proposta: cada paquet = una opció del menú + un bloc de dins de l'obra, amb el mateix nom — Base: Inici, Contactes, Obres, Agenda + Fitxa i Dia a dia (notes, actes, agenda, fotos, documents) · Pressupost i certificacions: Pressupostos + el bloc «Pressupost i certificacions» · Control d'obra: dins de Dia a dia, partes, planning, equip i albarans · Comptabilitat: Comptabilitat + el bloc «Comptabilitat» de l'obra (facturació, despeses, rendiment) · Personal i fitxatge: Control horari (i treballadors i calendari laboral). Ara (V87.653) «Dia a dia» és barrejat: notes, actes, agenda i tasques són de la base; partes i planning, de Control d'obra (i Agenda › Equip). La Facturació de l'obra (proformes) surt sempre a la constructora, encara que no tingui Factures: amb la proposta, les proformes anirien a Certificacions. **Decidit (25/11):** a la versió d'aquest repàs NO es toquen els paquets (Obres seria l'única opció del menú sense desplegable, i els paquets de dins de l'obra no es veuen fins que s'hi entra: no és fàcil). Preparar captures amb una proposta per a una versió posterior | ✎ captures de proposta (més endavant) |
| 29 | Menú | ordinador i mòbil | Desplegables com el de Comptabilitat a les opcions que tenen apartats a dins, perquè es vegi què inclouen: Control horari (Personal · Fitxatge · Calendari · Les meves hores), Empresa (Dades · Treballadors · Documentació · Industrials · Calendari). Plegats de sèrie; s'obren tocant-los | ✎ |
| 30 | Calendaris | tots | Hi ha dos «Calendari»: Empresa › Calendari (el laboral: festius i jornada) i Control horari › Calendari (els dies i les hores de cada treballador), i a més l'Agenda. Dir «Calendari laboral» al d'Empresa. Treballadors i Calendari d'Empresa només surten amb «Personal i fitxatge»: mirar si van millor dins de Control horari (tot el del personal junt). Revisar-ho quan mirem Control horari i Empresa | ✎ |
| 31 | Control horari › Personal | ordinador | Liat i poc organitzat. La mateixa informació tres vegades: les 5 targetes dels dies (hores de tothom per dia), «Treballadors 6» (la llista) i «Setmana de tothom» (treballador × dia). Només per setmanes: també cal el resum o llistat **per mes**. Proposta: una sola taula (treballador × dia, total en hores i €, i una fila de total per dia), els noms obren la fitxa (fora la targeta «Treballadors»; la llista completa, a Empresa › Treballadors), selector «Setmana · Mes» amb ‹ ›, i «Llistats» i «Emplenar hores» a la mateixa línia. Al mes: treballador × setmana (o dies del mes) i totals. Captures abans/després abans de fer-ho | ✎ proposta |

## Estat després de la V87.663 (25/11/2026, vespre)

- **Fets (✔ V87.663):** 5 i 11 (entrada més ràpida), 6 i 12 (30 min al fons → contrasenya i Inici), 8 (contactes nous de les despeses, avís a
  Contactes i a l'Inici), 9 («Cancel·lar»), 10 (fitxa amb les dades i «Editar»; fora les partides habituals), 13 (rajoles de l'Inici senceres amb el
  tipus i la data), 15 (sense el número de l'Héctor a les compartides), 17 (colors d'estat), 18 (amplades de la taula), 19 (codi postal), 20 (fora
  «Importar»), 21 (botons de la fitxa amb requadre; cap altre botó-text a les pantalles principals), 22 (fora «Filtres», cercador per tot), 27 (ordre
  del menú), 29 (desplegables de Control horari i Empresa), 30 («Calendari laboral»; moure Treballadors i Calendari a Control horari, encara no).
- **Per comprovar (l'Héctor):** 7 (zoom de l'iPhone amb la V87.661; a 390 px cap pantalla principal és més ampla que el mòbil).
- **Propostes amb captures, per decidir:** 14, 16, 23, 24, 26 (Obres a l'ordinador, barra blau nit), 25 (Obres al mòbil plegable), 31 (Control
  horari › Personal), 28 (paquets).
- **Recordar:** a la pantalla 12 (Pressupost), el preu que ja es va fer al mateix client, sol, sense targeta.
- **Següent pantalla del repàs:** 4, Control horari (Personal ja mirat: proposta 31), després Pressupostos.

## Repàs del 26/11/2026 (respostes a les propostes i pantalles noves)

| # | Pantalla | Aparell | Què diu l'Héctor | Estat |
|---|---|---|---|---|
| 32 | Totes les pantalles | ordinador | Proposta 14/24 **acceptada**: la barra blau nit amb el títol i els botons principals, a totes les pantalles | ✔ V87.664 |
| 33 | Obres › llista | ordinador | La columna **Promotor es queda**. Si el client i el promotor són la mateixa persona, només surt una vegada, a Promotor | ✔ V87.664 |
| 34 | Obres › grups | tots | Només l'any, per a la constructora i l'administrador de finques. El **tècnic (amb gestió)** manté els grups dels clients a més dels expedients propis. L'any d'ara i tots els seus grups, **oberts de sèrie** | ✔ V87.664 |
| 35 | Obres › llista | mòbil | Proposta 25 **acceptada** (plegable per nivells, com ja és) amb l'any d'ara obert | ✔ V87.664 |
| 36 | Control horari › Personal | ordinador | Proposta 31 **acceptada**, més ordenada i amb línies fines entre files i columnes | ✔ V87.664 |
| 37 | Control horari › Calendari | mòbil | El text surt tallat. Millor tot el mes i, a cada dia, les hores fetes i a quina obra | ✔ V87.664 |
| 38 | Obra › bloc «Pressupost i certificacions» | tots (constructora) | Al mòbil deia només «Pressupost»; amb amidaments, comparatiu i certificacions: millor **«Control d'obra»**, i el **Planning** a dins (a «Dia a dia» no hi té sentit). Aclarit: dins de l'obra, no al menú de l'esquerra | ✔ V87.664 |
| 39 | Obra › Agents | tots | En posar els tècnics de l'obra no surt el desplegable dels que ja són a Contactes, ni es pot crear un contacte nou que vagi sol al seu grup | ✔ V87.664 |
| 40 | Obra › Dades › «Més dades» | tots | «Referència del client» no té sentit; la cadastral i l'idioma, fora del plegable, amb les altres dades | ✔ V87.664 |
| 41 | Documents › carpeta de l'ordinador | ordinador | S'ha de poder treure la carpeta. Què són els arxius d'«Últims canvis»? (els que s'han copiat entre l'app i la carpeta) | ✔ V87.664 |
| 42 | Targetes plegables | tots | La targeta oberta, amb una vora més fosca, per distingir-la del que hi ha a dins (p. ex. el mes dels partes) | ✔ V87.664 |
| 43 | Partes d'obra | ordinador | Ordre: «Parte d'avui» (blau nit), «Diversos dies» i, al final, els llistats. «Diversos dies», d'un altre color i amb un nom més clar (fer diversos partes de cop), sense fer-ne una frase | ✔ V87.664 |
| 44 | Partes d'obra | ordinador | La fila de la feina feta amb l'import, no a sota dels mesos: un plegable amb una gràfica de barres | ✔ V87.664 |
| 45 | Parte (dins) | ordinador | Títol «Observacions» amb fons gris. A l'ordinador, les observacions a l'esquerra i els treballadors a la dreta (ara, el nom a l'esquerra i les hores i el cost a la vora dreta) | ✔ V87.664 |
| 46 | Totes les targetes | tots | El títol de les targetes amb contingut a sota (p. ex. «Notes»), amb fons gris | ✔ V87.664 |
| 47 | Nota / parte (dins) | mòbil | El mateix fons al voltant de la capçalera (el dia, què s'ha de fer…) | ✔ V87.664 |
| 48 | Parte › Enviar | tots | Poder-lo enviar perquè el torni signat el responsable de validar-lo (director d'obra o d'execució), com a comprovant | ✔ V87.664 |
| 49 | Parte | tots | PDF, Enviar i Tancar, a sota de la nota (es llegeix i l'acció es busca a baix) | ✔ V87.664 |
| 50 | Obra › Actes | constructora | La constructora no fa actes (les fan els tècnics), però pot guardar-ne una que li enviïn: si no n'hi ha, poder-ne posar; si n'hi ha, la llista i prou | ✔ V87.664 |
| 51 | Agenda | ordinador | A dalt, el calendari del mes (com el de l'Inici); a sota, les targetes de la setmana o del dia triat, l'una al costat de l'altra. Feines pendents igual. La «Nota de veu» en blau nit, la principal | ✔ V87.664 |

## Repàs del 26/11/2026 (tarda): Pressupost de l'obra i comparatiu d'industrials

| # | Pantalla | Aparell | Què diu l'Héctor | Estat |
|---|---|---|---|---|
| 52 | Pressupost › barra de dalt | ordinador | El número del pressupost (P2026_0002) es veu molt petit; l'avís taronja (⚠ 3) sobre el blau nit no es veu bé | per fer |
| 53 | Pressupost › editant | ordinador | «Cancel·lar» surt mal escrit («Cancellar») i sense requadre, quan «Guardar canvis» i «Opcions» en tenen | per fer |
| 54 | Pressupost › capítol | ordinador | El menú del capítol és un «⋯» que no diu res: «creus que així detecten que hi ha opcions?» | per fer |
| 55 | Pressupost › part de dalt | ordinador | Desordenada: el «fora de pressupost» en taronja, els tres avisos i, al costat, Editar · Imprimir · Enviar · Signar · Tancar · ⋯. Ordenar-ho (amb disseny) | per fer |
| 56 | Obra › rajola activa | tots | La rajola triada (p. ex. «Control d'obra»): la icona en blanc i grisos no es veu i queda lletja | per fer |
| 57 | Industrials | ordinador | S'hauria de dir **«Comparatiu d'industrials»** | per fer |
| 58 | Industrials › llegir un PDF | tots | No llegeix com les factures: ni l'industrial, ni la data, ni les altres dades; només les partides i la referència (que posa com a capítol) | per fer |
| 59 | Industrials › targetes | tots | A la franja blau nit hi ha d'anar el nom del capítol; a dins, les ofertes (l'empresa i el nom del pressupost), el comparatiu i, un cop adjudicat, l'adjudicatari en verd | per fer |
| 60 | Industrials › adjudicar | tots | Els preus de l'oferta adjudicada han d'anar al pressupost, al capítol que toca, deixant posar el % de marge sobre el preu d'origen (0 % si l'industrial ja l'hi ha afegit) | per fer |
