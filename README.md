# APP Control d’Obres · V87.161

Versió derivada de V87.160.

Canvis principals:
- Descomposats de partida importables des d’Excel directament dins de cada partida del pressupost.
- Compatible amb Excels generats per IA, BEDEC/TCQ o bases pròpies sempre que tinguin concepte/descripció i imports o quantitat/preu/import.
- En importar un descomposat, l’app calcula el total i pot aplicar-lo com a preu unitari de la partida.
- El descomposat queda editable després d’importar-lo.
- La llibreria de partides també permet importar i guardar descomposats Excel per reutilitzar-los en altres pressupostos.
- Es manté la base V87.160: pressupost progressiu, llibreries client/general, descripció llarga, observacions i forma de pagament.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
