# APP Control d'Obres · V87.133

Versió de continuació sobre V87.132.

Canvis principals:
- Certificació: les accions de cada partida passen a un desplegable intern **Accions** dins de la mateixa línia.
- Des de cada partida es pot obrir el quadre mensual d'administració, reobrir el quadre guardat, modificar-lo i reimprimir-lo.
- El quadre d'administració assignat a una partida existent s'aplica directament a aquella partida: no crea partides ADM duplicades.
- S'afegeix avís intern perquè l'import aplicat sigui el total del quadre i la quantitat es calculi segons el PU de la partida.
- Reordenació/canvi de capítol i codi queda dins el desplegable d'accions de la partida.
- Dades de l'obra: agents en format desplegable/accordion, adaptat a iPad i mòbil, amb camps NIF/CIF, adreça, telèfon, email i col·legiat/registre.
- Inici: expedients recents ordenats per darrer treball/accés i mostra de la data de darrer moviment.
- Es manté Supabase Sync, còpies locals, importació segura i correccions de certificació de V87.132.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
