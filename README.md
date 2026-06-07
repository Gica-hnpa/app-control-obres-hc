# APP Control d'Obres · V87.70

Base: V87.69 pestanyes intel·ligents + editor de plànols/croquis en actes.

Canvis principals V87.70:
- Documents adjunts vinculats a cada expedient: s'eliminen documents per defecte globals que podien aparèixer en obres noves.
- Importació Excel de pressupost més robusta per formats visuals amb capítols tipus C02/C 02, partides 02.01, columnes buides i imports al final de fila.
- Previsualització i impressió de documents amb finestra d'impressió aïllada per evitar PDFs en blanc.
- Certificacions: primera pàgina amb resum de partides modificades/certificades en la certificació en curs i pàgina següent en horitzontal amb el quadre general compacte.

Render:
- Static Site
- Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
- Publish Directory: dist

No pujar node_modules ni package-lock.json.
