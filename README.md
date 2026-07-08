# APP Control d'Obres · V87.140

Versió derivada de V87.139 centrada en la pantalla d'Inici i la gestió real de tasques pendents.

Canvis principals:
- Inici redissenyat com a panell operatiu més modern i net.
- Radar/gràfica circular de tasques pendents per estat, urgència i vençudes.
- Feines pendents a fer com a bloc principal, agrupades per client.
- Botó `+ Afegir tasca` amb flux optimitzat: client existent o crear client, expedient o crear expedient, tasca, prioritat, estat i data màxima d'entrega.
- La data de la tasca passa a ser `data màxima d'entrega`.
- Cada tasca té barra de color segons proximitat al venciment: normal, propera, crítica o vençuda.
- Accions per tasca en desplegable: veure/editar, entrar a l'expedient, iniciar temps, marcar en procés, fet o anul·lar.
- Modal per veure i editar la tasca abans d'entrar a l'expedient.
- Treballs oberts del mes queden com a bloc plegable i agrupats per client.
- Pròximes cites manté només cites futures reals.

Build correcte amb Vite.
Paquet net: sense `node_modules`, sense `dist` i sense `package-lock.json`.
