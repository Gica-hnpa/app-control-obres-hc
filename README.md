# APP Control d’Obres V87.195

Versió derivada de la V87.194 amb ajustos concrets a la capçalera i les signatures del pressupost.

## Canvis

- El bloc `Client / promotor` de la capçalera queda més desplaçat cap a la dreta.
- A la signatura esquerra apareix directament el nom fiscal del client emissor del pressupost, per exemple `VERTICAL TREK ESPAÑA SL`.
- A la dreta apareix l’etiqueta `Client` i, a sota, el nom del client del pressupost, per exemple `SOCOTERM`.
- Eliminades de l’editor les dues dades manuals de signatura, perquè ara s’obtenen automàticament dels clients ja vinculats.
- Corregit el text erroni `function Object() { [native code] }` que podia aparèixer en utilitzar el camp antic `constructor`.
- Es mantenen l’A4 optimitzat, la numeració per client i els amidaments de la V87.194.

## Build

```bash
npm install
npm run build
```
