# APP Control d'Obres · V87.128

Versió derivada de V87.127 centrada en estabilitzar la graella de certificacions i fer que el quadre mensual d'administració s'incorpori al capítol o partida que indiqui l'usuari.

Canvis:
- Correcció de la graella de certificació perquè els camps verds i el botó de línies de medició no deformin ni se superposin sobre altres columnes.
- Quadre mensual d'administració amb selector d'on ha d'aparèixer: capítol nou, capítol existent o partida de referència.
- Si es tria una partida, la partida resum d'administració s'afegeix dins el mateix capítol amb codi derivat i queda vinculada a la partida triada.
- La partida d'administració segueix entrant com a 1 ut × total del quadre, suma a certificació/proforma i no incrementa el pressupost base.
- En el pressupost d'obra, en mode edició, cada partida pot canviar-se de capítol amb un desplegable i es manté l'opció d'eliminar-la.
- Es mantenen les proteccions d'importació segura, còpies locals i Supabase de les versions anteriors.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
