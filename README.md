# APP Control d'Obres · V87.116

Versió provisional de refinament: mòbil, impressió i llibreria de partides per client.

Canvis principals:
- Gestió d'obra en mòbil més neta: s'elimina el bloc inicial duplicat de pressupost i el selector queda dins la pestanya Pressupost obra.
- Accions de resums de Pressupostos/Honoraris i Factures amb desplegable compacte i columna sticky per reduir scroll horitzontal.
- Amplades de columnes refinades: imports i quantitats més estrets, concepte/descripció més ample.
- Impressió mòbil/iPad de certificacions i factures/proformes reforçada mitjançant document HTML aïllat en iframe, mantenint el retorn a l'app.
- Correcció de capçaleres i taules de certificació: Concepte / descripció visible i columnes numèriques ajustades.
- Llibreria de partides per client amb autoalimentació des de partides històriques del mateix client guardades al navegador, incloses obres com Maricel si estan dins les dades locals.

Render:
Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
