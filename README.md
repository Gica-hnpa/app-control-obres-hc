# APP Control d'Obres · V87.174

Versió de correcció focalitzada sobre la base fiable V87.173/V87.171.

Canvis:
- El descomposat d'una partida s'obre en una finestra pròpia en format quadre tipus Excel.
- Importació de descomposats Excel amb columnes Concepte, Unitat, Rendiment, Preu/Ut i Preu Total.
- Reconeixement de files de secció tipus MÀ D'OBRA, MATERIALS, ALTRES RECURSOS i totals finals.
- Les cel·les del descomposat són editables dins del quadre.
- El total detectat prioritza el PREU UNITARI FINAL quan existeix.
- El preu/ut validat no s'aplica automàticament: cal confirmar-lo amb el botó d'aplicar.
- Manté la vista general fiable del pressupost.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
