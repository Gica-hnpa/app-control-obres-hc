# APP Control d’Obres V87.194

Versió derivada de la V87.193, centrada en la creació i impressió de pressupostos d’obra.

## Canvis principals

- A4 més aprofitat: marges de 9 mm, columnes compactes `Quant.` i `€/ut`, i més amplada per a la descripció llarga.
- Capçalera reorganitzada: dades del client desplaçades cap a la dreta i identificador amb només número de pressupost i versió.
- Numeració automàtica correlativa per client amb estructura `ANY-CODICLIENT-SEQ`.
- Observacions i forma de pagament col·locades una sota l’altra.
- Espai final de signatures per a qui realitza el pressupost i per al client final.
- Cada partida admet una quantitat directa o línies d’amidament amb suma automàtica.
- L’exportació Excel incorpora un full `AMIDAMENTS` quan existeixen línies detallades.
- Es mantenen les correccions de Documents, PDF fidel, Agents, Clients i ordenació de les versions anteriors.

## Build

```bash
npm install
npm run build
```
