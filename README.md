# APP Control d'Obres · V87.178

Base fiable derivada de V87.177 / V87.171.

Canvis:
- Correcció de la importació massiva de descomposats per capítol.
- L'assignació dels fulls `02.01`, `02.02`, etc. es calcula abans d'actualitzar l'estat React.
- Evita que el missatge final digui `0` per culpa de l'actualització asíncrona de `setCaps`.
- Mostra resum amb descomposats llegits, assignats i sense coincidència.
- Es manté que els descomposats queden pendents de validació i no apliquen automàticament el preu.
- Es manté Cancel·lar edició sense guardar canvis.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
