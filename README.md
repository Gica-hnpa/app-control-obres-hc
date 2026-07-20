# APP Control d’Obres V87.197

Versió centrada en la creació de pressupostos i la gestió de la llibreria de partides.

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
- Identificador intern estable (`LIB-000001`) separat del codi visible del pressupost.
- El codi, el capítol i el preu no creen duplicats.
- Les coincidències es determinen pel contingut tècnic: concepte, descripció i unitat.
- Els preus diferents queden a l’històric de la mateixa partida.
- Migració automàtica de les antigues llibreries de clients.
- Dins d’un expedient es consulta primer la llibreria del client i després la global.
- Una partida global utilitzada en un expedient queda vinculada al client.
- La llibreria forma part del Supabase Sync i de la còpia JSON local.
