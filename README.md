# APP Control d'Obres · V87.176

Versió quirúrgica sobre V87.175/V87.174 fiable.

Canvis:
- Importació massiva de descomposats Excel des del mode edició de pressupost.
- Assignació automàtica del descomposat a la partida pel codi detectat al nom del full o a les primeres files.
- Si no troba codi, intenta coincidència per concepte/títol del full.
- El descomposat importat queda pendent de validació: no aplica automàticament el preu unitari.
- Els camps de quantitat i preu unitari es normalitzen a dos decimals en guardar.
- Cancel·lar l'edició recupera una còpia interna de l'estat inicial i no deixa canvis aplicats.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
