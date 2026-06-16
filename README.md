# APP Control d'Obres · V87.118

Versió de refinament quirúrgic sobre V87.117.

Canvis:
- Mòbil: substitució del selector simple de pestanyes de l’expedient per un desplegable tipus llistat amb totes les pestanyes seguides.
- Mòbil: accions de l’expedient agrupades en desplegable per deixar la capçalera més neta.
- Mòbil: neteja del resum de l’expedient amagant targetes poc productives com avisos, tipus de treball, propera cita, temps registrat i documents/fotos, que ja es poden consultar a les pestanyes corresponents.
- Mòbil: accions de pressupostos/factures tècniques convertides en desplegable compacte.
- Llibreria de partides: recuperació més robusta de descripcions llargues des de camps alternatius (`desc`, `descripcio`, `descripcion`, `description`, `detall`, `observacions`, etc.).
- Llibreria de partides: fusió intel·ligent de partides repetides conservant la descripció llarga més completa.
- Pressupost obra: retirada del botó “Guardar llibreria” dins de cada partida per evitar soroll, mantenint la llibreria com a eina pròpia del client.

Base protegida: V87.117.
Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
