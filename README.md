# APP Control d'Obres · V87.135

Versió de correcció sobre V87.134.

Canvis:
- Clients/contactes: el botó Gestionar contacte ara rep correctament `setClients` i permet guardar o eliminar clients.
- Darrers expedients: ordenació per últim accés/treball real; s'eviten dates futures de certificacions/agenda.
- Certificació: etiqueta abreujada a `Import certificació X` en previsualització i impressió.
- Dades de l'obra: promotor/propietat documental únic i resta d'agents principals separats.
- Agents de l'obra: relació pròpia per expedient amb desplegable d'agents de biblioteca; els selectors de DO/DEO/CSS només mostren agents creats en aquella obra.
- Rols d'agent ampliats per poder marcar un mateix agent com DO, DEO, DO+DEO, CSS o DO+DEO+CSS.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
