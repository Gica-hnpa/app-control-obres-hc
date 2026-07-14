# APP Control d'Obres · V87.159

Versió derivada de V87.158.

Canvis principals:
- Dades de l'expedient: el client/carpeta ja no és només lectura; es pot canviar amb desplegable de clients existents o crear un client nou des de la mateixa pantalla.
- Nou expedient: els agents d'obra passen a funcionar amb desplegables de tècnics/empreses existents i opció d'escriure/crear-ne un de nou.
- Dades tècniques: constructor, DO, DEO i CSS es poden escollir des de la llibreria d'agents de l'obra/global o crear fitxa nova.
- Es manté el criteri general de desplegable + crear nou per a clients, agents i camps reutilitzables.
- Es manté la base de pressupost V87.158: header, alineacions, dos decimals, descripció llarga, observacions i forma de pagament.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
