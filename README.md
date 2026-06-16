# APP Control d’Obres · V87.113

Hotfix sobre V87.112.

Canvis:
- Correcció del bloqueig a la pestanya principal de Pressupostos/Honoraris.
- Correcció de la pantalla protegida de Factures causada pel resum/informes.
- El component d’informes accepta ara `k/v` i `label/value` per evitar errors de renderitzat.
- Pressupostos queda també embolcallat amb mode segur perquè un error de pantalla no bloquegi tota l’app.
- Es manté la base V87.111/V87.112: mòbil, eliminació d’expedients i accés a calculadora d’honoraris.

Sincronització futura recomanada:
- Fase 1: export/import JSON manual amb còpia de seguretat.
- Fase 2: sincronització real amb backend tipus Supabase/Firebase.
- Google Drive pot servir com a còpia o pont, però no és la millor base de dades automàtica per treball multi-dispositiu.

Render:
Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
