# APP Control d’Obres · V87.170

Base recuperada fiable V87.162 amb millores petites i validables sobre pressupost d’obra.

Canvis:
- Edició de pressupost més controlada: les partides s’obren una a una amb desplegable, en lloc de mostrar totes les dades obertes a la vegada.
- El descomposat Excel / IA / BEDEC ja no s’edita incrustat dins la taula; s’obre en una finestra/modal pròpia.
- El descomposat queda editable i revisable abans d’aplicar-lo.
- El botó d’aplicar passa a funcionar com a “Validar i aplicar al preu/ut”, amb camp manual de preu validat per evitar imports detectats erronis.
- Importar un descomposat ja no aplica automàticament el preu; primer el deixa revisar.
- Guardar una partida a la llibreria ja no obre tota la llibreria i no deixa panells oberts innecessaris.
- Ajustos d’alineació a la taula de pressupost perquè conceptes i camps quedin alineats a dalt.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
