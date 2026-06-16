# APP Control d'Obres · V87.119

Versió de refinament mòbil sobre V87.118.

Canvis principals:
- Agenda mòbil més semblant a Google Calendar: calendari mensual visible a pantalla, controls compactes i sense formulari obert per defecte.
- En seleccionar un dia, es mostra un resum bàsic de les cites del dia; des d’allà es pot veure/editar una cita o crear-ne una de nova.
- Formulari de nova cita/edició només visible quan es demana expressament.
- Llistat de Treballs / Expedients en mòbil reorganitzat per desplegables jeràrquics: Any → Client → Expedients.
- Filtres d’expedients en mòbil amagats dins d’un desplegable per evitar que quedin tallats en vertical.
- Navegació dins l’expedient en mòbil convertida en flux d’opcions: botó “Obrir opcions de l’expedient”, selecció de pestanya i tancament automàtic després d’escollir.
- Eliminat el text de “pestanya actual” del capçal de l’expedient en mòbil.
- Es mantenen els canvis bons de V87.118: llibreria amb descripcions llargues reforçades, accions mòbil i descripcions amagades.

Base protegida: V87.118, derivada de V87.117.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
