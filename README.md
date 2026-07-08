# APP Control d'Obres · V87.126

Versió derivada de V87.125 centrada en les incidències detectades a certificacions, proforma, pressupost i costos per administració.

Canvis principals:
- Correcció visual del botó “Eliminar capítol” perquè en capítols del pressupost no quedi tallat.
- Factura/proforma: eliminat el desplegable “Veure descripció” dins el document imprès/previsualitzat; les descripcions llargues passen a sortir com a text estàtic quan existeixen.
- Resum de l’expedient: les darreres certificacions ja calculen l’import real des de les partides certificades i no només des del camp antic `import`, evitant valors 0,00 € quan sí hi ha amidaments.
- Línies de medició: eliminada duplicació de línies al modal i corregit el càlcul perquè multipliqui unitats × llargada × amplada × alçada segons unitat o camps emplenats.
- Certificacions: ampliades columnes i inputs perquè no es tallin imports, percentatges o números de tres xifres.
- Afegit botó `€/h` dins la certificació per entrar costos per administració: concepte, dia, hores oficials, cost hora oficial, hores peons, cost hora peó, material i total.
- El cost per administració s’aplica a la certificació actual de la partida seleccionada i guarda el detall per número de certificació.
- Es mantenen les proteccions anteriors d’importació segura, còpies locals i Supabase Sync.

Build:
- `npm install --no-audit --no-fund --legacy-peer-deps`
- `npm run build`
- Build correcte amb Vite.

Publicació:
- Build Command: `npm install --no-audit --no-fund --legacy-peer-deps && npm run build`
- Publish Directory: `dist`
