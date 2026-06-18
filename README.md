# APP Control d'Obres · V87.121

Versió derivada de V87.120.

Canvis principals:
- Correcció reforçada del guardat de la tipologia de feina / encàrrec.
- El canvi de tipologia actualitza `tipusTreball` i `tipologia` tant a la llista d'expedients com a la còpia interna de `odata`.
- La fitxa de dades refresca quan canvia la tipologia o l'encàrrec, no només quan canvia l'ID de l'expedient.
- Plantilles automàtiques editables per tipus d'encàrrec: descripció breu, definició de la feina i criteri/direcció de l'obra.
- Nou formulari de creació d'expedient amb definició de feina i direcció/criteri de l'obra preomplerts segons el tipus seleccionat.
- Nova secció Supabase Sync dins Configuració per pujar/baixar clients, expedients i dades internes de l'app.
- Inclou l'arxiu SQL `supabase/aco_supabase_sync_schema.sql` per crear la taula de sincronització.

Build Command: `npm install --no-audit --no-fund --legacy-peer-deps && npm run build`
Publish Directory: `dist`
