# APP Control d'Obres · V87.149

Versió de millora funcional sobre V87.148.

Canvis principals:
- Correcció del formulari de nou expedient: en canviar el tipus de treball es refresquen correctament la definició i el criteri de l'encàrrec.
- Afegit tipus de feina: **Elaboració de pressupost per client**.
- Codificació d'expedients més compacta: any, número, inicials del tipus, inicials del client i paraula clau.
- Millora visual del llistat de pressupostos amb targetes més modernes i tècniques.
- Llibreria de partides: es pot reclassificar la partida canviant el capítol/tipologia des de la mateixa llibreria del client.
- Afegit botó **Buscar IA** a la llibreria per generar un prompt de consulta de partida/descomposat i copiar-lo al porta-retalls.
- Afegit apartat **Gantt** dins Gestió obra amb visió orientativa pressupost/certificació.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
