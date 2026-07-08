# APP Control d'Obres · V87.142

Versió de correcció sobre V87.141.

Canvis:
- Pròximes cites de la pantalla Inici reforçades: ara llegeix cites de l'agenda global local i cites d'expedient, incloent camps `iso`, `data`, `date`, `fecha`, `year/month/day`.
- Es mostren fins a 8 cites futures reals i s'eviten cites caducades.
- Rendiment d'expedient corregit: ja no agafa hores antigues o fantasma de `data.hores`; només compta registres visibles de Gestió temps del navegador/expedient.
- Si no hi ha registres de temps, la targeta mostra “Sense temps registrat” i no calcula resultat intern estimat negatiu.
- Supabase Sync reforçat amb botó “Comprovar connexió”, missatges més clars si la clau privada no troba cap còpia i versió de pujada actualitzada a 87.142.0.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
