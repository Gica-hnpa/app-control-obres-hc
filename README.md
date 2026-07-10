# APP Control d'Obres · V87.151

Versió derivada de V87.150.

Canvis principals:
- Nou expedient redissenyat com a formulari progressiu per passos i desplegables.
- El tipus `Pressupost d’obra / amidaments` manté la seva descripció correcta i no arrossega camps de Seguretat i Salut.
- Els encàrrecs simples com pressupost/amidaments o elaboració de pressupost per client només demanen dades essencials d'inici.
- Constructor, direcció d’obra, direcció d’execució, CSS, adreça completa i dades tècniques queden com a blocs opcionals plegables segons el tipus de feina.
- Afegit estat `En procés` per treballs de preparació de pressupost.
- Format més modern, tècnic i adaptable a iPad/mòbil, amb camps obligatoris marcats amb `*`.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
