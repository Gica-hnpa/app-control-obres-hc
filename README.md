# APP Control d'Obres · V87.168

Versió de recuperació visual i ordre funcional sobre V87.167.

Canvis principals:
- Recuperació de les pestanyes de l'expedient en format horitzontal/compacte a PC i iPad, evitant el llistat vertical llarg que ocupava massa pantalla.
- En mòbil es manté el flux d'opcions perquè sigui compacte.
- Directori d'agents convertit en llistat desplegable editable per grups: tècnics, constructors, promotors, CSS i altres.
- Creació i edició d'agents directament des de la pantalla Agents.
- Deduplicació reforçada d'agents per email, NIF i coincidència de nom/rol perquè el mateix tècnic no aparegui diverses vegades.
- Relació d'agents de l'obra més controlada, amb biblioteca deduplicada i alta/edició des de panells desplegables.
- Pressupost ràpid manté la vista prèvia i l'editor plegat sense amagar opcions de descomposats ni impressió.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
