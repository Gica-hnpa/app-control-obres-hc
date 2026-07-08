# APP Control d'Obres · V87.131

Versió derivada de V87.130.

Canvis:
- Eliminació/neteja de partides dins la certificació: si és una partida només de certificació s'elimina; si és del pressupost base, es treu de la certificació actual i queda a 0.
- Quadre mensual d'administració amb memòria de conceptes de feina repetits.
- Materials desglossables per línia: es poden afegir diversos conceptes de material amb import i l'app en calcula el total.
- Impressió del quadre d'administració com a justificació, amb detall i resum agrupat per concepte, hores, materials i imports.
- Es manté l'aplicació directa a partida existent sense crear codis ADM duplicats.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
