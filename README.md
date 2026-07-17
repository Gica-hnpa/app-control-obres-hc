# APP Control d'Obres · V87.185

Versió de sanejament i persistència abans de tornar a entrar dades noves.

Canvis principals:
- Detecta i mostra l'ús aproximat de localStorage.
- Botó **Netejar espai local** a Configuració / JSON.
- El guardat intenta netejar còpies pesades i guardar en mode lleuger si el navegador dona `QuotaExceededError`.
- Les còpies JSON eliminen logos/base64/fotos pesades, però mantenen clients, expedients, tasques, pressupostos, partides i descompostos.
- `aco_odata` i `aco_odata_core_v87104` es guarden sense base64 per evitar pèrdues silencioses.
- Supabase puja clients/obres/odata en versió lleugera, sense logos/base64.
- Import JSON manté la recuperació profunda de tasques/clients/expedients de V87.184.

Build Command: npm install --no-audit --no-fund --legacy-peer-deps && npm run build
Publish Directory: dist
