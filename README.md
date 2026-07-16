# APP Control d'Obres · V87.184

Versió de correcció de persistència/exportació de tasques.

Canvis:
- Exportació JSON inclou també l’estat viu carregat en pantalla: clients, expedients i odata.
- Importació JSON normalitza claus dobles tipus `aco_v8782__hector__aco_odata__hector`.
- Recupera millor tasques creades des d’Inici, clients nous i expedients nous.
- Manté la recuperació profunda de V87.183.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
