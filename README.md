# APP Control d’Obres V87.199

Versió centrada en el control manual, la depuració i la llegibilitat de la llibreria de partides.

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
- Des de la partida es pot guardar clarament a la llibreria del client.

## Llibreria central

- Nova pestanya `Llibreria` al menú principal.
- Vista global i vista filtrada per client.
- Identificador intern descriptiu i estable separat del codi propi de cada pressupost.
- El codi, el capítol i el preu no creen duplicats.
- Les coincidències es determinen pel contingut tècnic: concepte, descripció i unitat.
- Els preus diferents queden a l’històric de la mateixa partida.
- Les antigues llibreries es conserven, però les noves importacions no hi incorporen partides automàticament.
- Dins d’un expedient es consulta primer la llibreria del client i després la global.
- Una partida global utilitzada en un expedient queda vinculada al client.
- La llibreria forma part del Supabase Sync i de la còpia JSON local.
