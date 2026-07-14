# APP Control d'Obres · V87.157

Versió sobre V87.156.

Canvis:
- Nou expedient: selector de client clar amb clients existents per defecte i opció `+ Crear client nou` dins del mateix desplegable.
- Quan es tria un client existent es mostra una fitxa resum amb NIF/contacte perquè es vegi què s'està assignant.
- Si no hi ha clients o es tria crear-ne un, s'obre el bloc de creació de client dins del mateix flux.
- Manté el criteri de formulari progressiu: primer dades obligatòries, després blocs opcionals segons tipologia.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
