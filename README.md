# APP Control d’Obres V87.192

Versió derivada de la V87.191. La V87.190 queda descartada.

Canvis:

- Expedients ordenats per número de manera predeterminada, amb el més alt primer.
- Totes les columnes principals permeten alternar ordre ascendent/descendent: número, codi, client, nom del treball, tipologia, adreça/municipi i estat.
- Reparació segura de numeracions duplicades o incompletes. Conserva els codis únics existents i només renumera el duplicat posterior.
- En les dades reals de prova, `2026-001-INF-SP-CEDULA` es repara com `2026-006-INF-SP-CEDULA`, mantenint intacta la resta del codi.
- Agents s’obre sense carregar cap llistat: només carrega el grup seleccionat i limita la visualització a 120 resultats.
- L’edició d’un agent es guarda amb un botó explícit; escriure ja no recorre ni desa tots els expedients a cada tecla.
- Eliminat el tècnic sintètic que reapareixia després d’eliminar-lo.
- Els clients continuen separats dels agents, però ara tots són seleccionables com a participants d’una obra, visita o acta. A Agents s’identifiquen amb l’etiqueta `Origen: client`.
- Agents i Clients tenen protecció de pantalla perquè una incidència no bloquegi tota l’app.
- Filtre de Clients sempre visible i funcional per nom, empresa, NIF/CIF, telèfon, email, adreça, població i tipologia.
- Es mantenen Documents/pressupostos amb format i el sanejament/guardat segur de localStorage de la V87.185/V87.189.

Validació:

- Còpia real: 10 expedients, 10 numeracions úniques després de la reparació.
- Build correcte amb Vite.
