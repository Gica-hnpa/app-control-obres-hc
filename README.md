# APP CONTROL D’OBRES — V87.183

Versió de seguretat per desencallar la importació de tasques i clients.

## Canvis
- Manté V87.182 com a base.
- Import JSON més robust quan les tasques estan dins `odata` però l’expedient no queda visible a `aco_obres`.
- Reconciliació d’`odata[obraId].obra` amb la llista principal d’expedients.
- Si hi ha tasques/documents/pressupostos dins una clau d’obra sense expedient visible, crea un expedient recuperat.
- Genera events de calendari per les tasques pendents importades.
- El missatge d’importació indica tasques totals i tasques pendents visibles a Inici.
- Conserva creació de client amb rol/tipologia des d’Afegir tasca.

Base protegida: V87.182 / V87.180.
