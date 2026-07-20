# APP Control d’Obres V87.202

Versió centrada a començar la depuració de la llibreria pels capítols, abans de classificar o editar les partides.

## Capítols primer i fusió guiada V87.202

- La pantalla comença amb `PAS 1 · Depurar i definir els capítols`, obert d’entrada.
- La safata de partides passa al pas 2 i la llibreria definitiva al pas 3; totes dues queden plegades inicialment.
- Nou selector clar per fusionar cada capítol amb un altre d’existent.
- Si el capítol té partides, fusionar-lo les conserva i elimina el nom repetit.
- Si és buit, apareix l’acció directa `Eliminar buit`.
- Es poden crear capítols nous des de la capçalera o des del gestor.
- Es detecten possibles capítols repetits ignorant la numeració inicial i petites diferències de plural.
- Per cada grup suggerit es pot triar amb un sol botó quin nom conservar; mai es fusiona automàticament.

## Llibreria única i capítols compartits V87.201

- Hi ha una sola llibreria de partides; ja no existeixen els àmbits separats global/client.
- El client és només un filtre i una vinculació opcional per localitzar les partides que utilitza habitualment.
- Hi ha un únic catàleg persistent de capítols compartit per tots els filtres i editors de la llibreria.
- Els capítols es poden crear, canviar de nom, fusionar i eliminar si són buits des d’un únic gestor.
- Un capítol nou apareix immediatament als desplegables de creació, edició, moviments massius i safata pendent.
- A la safata, el capítol importat es mostra com a capítol d’origen i abans de guardar cal escollir el capítol final.
- Dins dels pressupostos es consulta la mateixa llibreria única, amb un filtre opcional per veure només les partides relacionades amb aquell client.
- Afegir una partida a un pressupost la relaciona automàticament amb el client, sense copiar-la ni crear una segona llibreria.

## Safata de partides i codis V87.200

- Nova safata `Partides detectades pendents de revisar`.
- Recupera les antigues llibreries separades per client i les línies de tots els pressupostos dels expedients.
- Mostra per separat les aparicions totals, les partides tècniques úniques, l’origen i el client.
- Permet cercar i filtrar per origen, client i capítol.
- Permet seleccionar una partida o moltes, assignar el capítol final i incorporar-les a la llibreria única.
- Les coincidències tècniques s’unifiquen quan es guarden; la safata conserva el recompte d’aparicions.
- La safata mostra 100 resultats inicials i permet carregar-ne 100 més sense bloquejar la pantalla.
- Nou format de codi curt: `PREFIX_PARAULA_001`, per exemple `MA_BAST_001`.
- El prefix, la paraula clau i el número correlatiu es poden editar individualment a cada partida.
- Les partides creades o recuperades generen el codi curt automàticament, però després es pot personalitzar.

## Llibreria controlada V87.199

- Importar un pressupost o un Excel ja no afegeix automàticament totes les partides a la llibreria.
- Cada partida només entra a la llibreria quan l’usuari prem expressament `Desar a la llibreria`.
- El filtre de capítols i el gestor de capítols treballen sobre el mateix àmbit: global, client o tota la llibreria.
- El gestor permet cercar, canviar el nom i fusionar capítols sense barrejar àmbits involuntàriament.
- Nou filtre d’origen per localitzar les partides importades per versions anteriors.
- Selecció múltiple per moure partides de capítol o eliminar les que no es vulguin conservar.
- Els codis interns segueixen l’esquema `INICIALS-CONSEPTE-0001`, per exemple `ED-BASTIDA-0001`.
- Botó per regenerar els codis antics `LIB-000001` amb el nou esquema.
- S’elimina de la pantalla el codi visible orientatiu; el pressupost continua generant la seva numeració pròpia.
- Tipografia, camps, filtres i targetes ampliats per facilitar la lectura en ordinador i mòbil.

## Canvi directe de capítol V87.198

- El selector superior passa a dir `Filtrar per capítol` i només filtra la llista.
- Dins de cada partida hi ha un desplegable real `Canviar de capítol`.
- En seleccionar un capítol, el canvi es desa immediatament.
- Es mostra el missatge verd `Capítol canviat i guardat`.
- L’opció `Crear un capítol nou` permet afegir una classificació nova.

## Gestió de capítols V87.197

- Nou desplegable `Gestionar capítols de la llibreria` al menú principal Llibreria.
- Permet canviar el nom d’un capítol a totes les seves partides de cop.
- Si el nom nou ja existeix, els dos capítols es fusionen sense perdre partides.
- Permet passar totes les partides d’un capítol a `General`.
- Mostra el nombre de partides globals i clients vinculats a cada capítol.
- Disseny plegable i adaptat a mòbil.

## Pressupost

- S’elimina de la vista principal el bloc duplicat de versions amb les accions Duplicar/Eliminar.
- El total del pressupost queda destacat a la dreta.
- Les accions es concentren en un desplegable.
- Origen, importació i annexos queden dins un segon desplegable.
- Al mòbil cada partida és plegable i disposa d’un selector únic d’accions.
- Des de la partida es pot guardar expressament a la llibreria única i relacionar-la amb el client de l’expedient.

## Llibreria central

- Nova pestanya `Llibreria` al menú principal.
- Vista completa i vista filtrada per client sobre la mateixa llibreria.
- Identificador intern descriptiu i estable separat del codi propi de cada pressupost.
- El codi, el capítol i el preu no creen duplicats.
- Les coincidències es determinen pel contingut tècnic: concepte, descripció i unitat.
- Els preus diferents queden a l’històric de la mateixa partida.
- Les antigues llibreries es conserven, però les noves importacions no hi incorporen partides automàticament.
- Dins d’un expedient es consulta tota la llibreria o només les partides relacionades amb el client.
- Una partida utilitzada en un expedient queda vinculada al client sense duplicar-se.
- La llibreria forma part del Supabase Sync i de la còpia JSON local.
