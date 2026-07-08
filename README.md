# APP Control d'Obres · V87.137

Versió de millora funcional sobre V87.136.

Canvis:
- Pàgina d'inici més neta i útil: mes actual, expedients oberts del mes, pròximes cites futures i feines pendents.
- Correcció de pròximes cites: només futures/reals, amb lectura robusta de dates `data`, `date`, `year/month/day`.
- Feines pendents amb accions ràpides: en procés, pendent resposta, fet, anul·lar i obrir a Gestió temps per posar el crono.
- Seguiment d'expedients amb etiquetes de color per estat.
- Resum de l'obra més modern i funcional, amb proper avís només si és futur, última certificació/activitat real i tasques pendents.
- Darreres actuacions de l'expedient deduplicades i sense avisos caducats.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
