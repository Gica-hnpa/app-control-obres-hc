# APP Control d’Obres V87.193

Versió derivada de la V87.192.

Canvis:

- Documents recupera i obre el contingut real dels pressupostos i factures d’honoraris vinculats, inclosos registres antics.
- Els honoraris existents també apareixen automàticament a la carpeta `00 · Despatx tècnic / honoraris` si no tenien registre documental.
- Les certificacions, proformes, pressupostos d’obra i honoraris s’obren des de Documents amb el seu format complet.
- La previsualització utilitza exactament la mateixa plantilla HTML que la impressió/PDF, respectant A4 vertical, A4 horitzontal o el format definit pel document.
- Els encàrrecs de pressupost o amidaments tenen una acció directa `Crear / editar pressupost` i mantenen el flux de Pressupost ràpid.
- `Ampliar encàrrec` permet passar després a direcció o gestió integral sense crear un expedient nou ni perdre partides, documents o pressupostos.
- Si un expedient evoluciona a gestió integral, la pestanya Pressupost ràpid es conserva sempre que hi hagi dades pressupostàries prèvies.
- Es mantenen les correccions de numeració, Agents, Clients i ordenació de la V87.192.

Validació:

- Build correcte amb Vite.
