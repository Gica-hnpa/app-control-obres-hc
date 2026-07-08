# APP Control d'Obres · V87.139

Versió de refinament sobre V87.138 centrada a poder crear feines pendents directament des de la pàgina d'inici.

Canvis:
- Afegit botó `+ Afegir feina pendent` dins del bloc `Feines pendents a fer` de la pàgina d'inici.
- Nova feina pendent amb flux Client → Expedient → Feina pendent → Prioritat → Estat → Data/Hora.
- La feina queda guardada dins la pestanya `Tasques` de l'expedient corresponent.
- Si té data, també queda sincronitzada amb Agenda/Avisos com a tasca.
- Es manté el llistat de feines pendents agrupat per client amb accions Entrar/crono, Pendent resposta, Fet i Anul·lar.
- En mòbil/iPad el formulari queda en una sola columna i no deforma la pantalla.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
