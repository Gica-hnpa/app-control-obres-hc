# APP Control d'Obres · V87.124

Correcció directa sobre V87.123 per al renombrat de pressupostos.

Canvis:
- Camp molt visible “Canviar nom del pressupost seleccionat” dins Gestió obra.
- Botó directe “Guardar nom” al costat del camp.
- El botó antic passa a “Renombrar amb finestra”.
- El nom es propaga a budgetGroups, marcador del pressupost, partides, certificacions i factures.
- Es mantenen les proteccions d'importació segura i recuperació local de V87.122/V87.123.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
