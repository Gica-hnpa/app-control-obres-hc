# APP Control d'Obres · V87.150

Versió centrada en flux de pressupost, codificació i sincronització segura.

Canvis:
- Correcció reforçada de tipus de treball en nou expedient: Pressupost d’obra / amidaments i Elaboració de pressupost per client ja no tornen a Seguretat i salut.
- Afegida pestanya Pressupost ràpid per encàrrecs d’elaboració de pressupost, sense haver d’entrar primer a tot el flux de certificacions/factures.
- Renombrar pressupost queda plegat en desplegable i ja no ocupa espai fix dins Gestió obra.
- Codificació compacta mantinguda: ANY-NÚM-TIPUS-CLIENT-PARAULA.
- Botó Buscar amb IA amb avís clar: integració directa requerirà API/servidor; de moment copia prompt segur per ChatGPT.
- Supabase app_version actualitzada a 87.150.0.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
