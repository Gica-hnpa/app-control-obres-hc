# APP Control d'Obres · V87.122

Versió derivada de V87.121.

Canvis principals:
- Correcció del botó **Renombrar** de pressupostos: el nou nom es guarda a `budgetGroups`, marcadors de pressupost, certificacions/factures vinculades i també permet nom editable del pressupost principal.
- Importació Excel protegida: abans d'importar es crea una còpia local de recuperació.
- Si el pressupost actiu ja té certificacions o factures, l'Excel **no substitueix** la feina existent; entra com a nou pressupost/annex independent.
- Si el pressupost actiu té partides però encara no té certificacions/factures, l'app pregunta si vols substituir o crear annex nou.
- Les importacions Excel ja no eliminen certificacions ni factures existents.
- Nova secció **Còpies locals de recuperació** a Configuració, amb opcions de crear còpia, exportar-la i restaurar-la.
- Millora del flux del pressupost actiu després d'una importació segura.
- Es mantenen Supabase Sync, tipologia/encàrrec i totes les millores de V87.121.

Build Command: `npm install --no-audit --no-fund --legacy-peer-deps && npm run build`
Publish Directory: `dist`
