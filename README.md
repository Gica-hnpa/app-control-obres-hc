# APP Control d'Obres · V87.175

Versió quirúrgica sobre V87.174/V87.173.

Canvis:
- Correcció de l'eliminació de pressupostos importats/annexos.
- Quan s'elimina una versió associada a un pressupost annex, ara s'elimina tot el paquet del pressupost: marcador, budgetGroup, partides, certificacions i factures vinculades a aquell `budgetId`.
- Evita que quedin partides orfes quan s'elimina un pressupost importat.
- El botó en versions mostra “Eliminar tot” quan el pressupost és annex/importat.
- El pressupost principal no es buida automàticament per seguretat; només s'elimina la fitxa de versió.

Base protegida: V87.174 / V87.173 / V87.171 fiable.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
