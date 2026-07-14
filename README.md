# APP Control d’Obres · V87.155

Versió de refinament de Pressupost ràpid sobre V87.154.

Canvis:
- Preus unitaris, quantitats i imports de pressupost sempre visibles amb 2 decimals, per exemple `89,00 €` i no `89 €`.
- Pressupostos d’obra mantenen i imprimeixen la descripció llarga de les partides.
- Pressupost ràpid incorpora camps finals editables d’Observacions i Forma de pagament.
- La previsualització i impressió/PDF del pressupost inclouen al final els apartats Observacions i Forma de pagament.
- El càlcul de pressupost ràpid usa `parseNum8770`, de manera que accepta decimals amb coma o punt sense perdre import.
- Es manté la millora V87.154 del lector Excel prioritzant el full PRESSUPOST.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
