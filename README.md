# APP Control d'Obres · V87.101 refinament facturació i clients

Base: V87.100.

Canvis:
- Evita duplicació de raó social/NIF-CIF en certificacions i proformes.
- Ajust de fitxa client: nom visible/raó social, NIF/CIF fiscal separat, província i validacions.
- Facturació d'obra més ampla, amb resum visual de pressupost/facturat i avís de VERI*FACTU.
- Finestra d'impressió més gran i adaptable.

Render:
- Static Site
- Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
- Publish Directory: dist

No pujar node_modules ni dist ni package-lock.json.
