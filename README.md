# APP Control d'Obres · V87.134

Versió derivada de V87.133.

Canvis principals:
- Darrers expedients: ordenació per últim accés/treball real, evitant que dates futures d'agenda/certificacions facin aparèixer dates incorrectes com desembre de 2026.
- En obrir un expedient, el darrer accés/treball s'actualitza sempre amb la data actual.
- Clients/contactes: afegit desplegable de gestió per editar o eliminar clients des del llistat.
- Dades de l'obra: bloc d'agents principals més clar, amb promotor/propietat a dalt.
- Agents de l'obra ordenats per rol: Promotor/propietat, constructor, direcció facultativa, tècnics i resta.
- Quan es completa un agent Promotor/propietat, la fitxa interna de l'obra actualitza propietat i NIF perquè surtin als documents.
- Impressió de certificació i proforma: dades de client/promotor extretes de l'agent Promotor/propietat quan existeix.
- Certificacions: accions globals agrupades en un desplegable, deixant a dins de cada partida les accions pròpies de partida com línies de medició, quadre administració, descripció, canvi de codi/capítol i treure certificació.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
