# APP Control d'Obres · V87.123

Versió quirúrgica sobre V87.122.

Canvis:
- Correcció reforçada del renombrat de pressupostos/annexos d'obra.
- Nou camp visible “Nom pressupost” amb guardat directe, a més del botó Renombrar.
- El nou nom es propaga a `budgetGroups`, marcadors de pressupost, partides, certificacions i factures vinculades.
- El pressupost principal també conserva el nom amb `principalBudgetName`.
- Botó “Guardar nom” i missatge de confirmació perquè no sembli que no fa res.
- Es mantenen les proteccions de V87.122: importació Excel segura i còpies locals de recuperació.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
