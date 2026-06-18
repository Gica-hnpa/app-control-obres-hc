# Configuració Supabase Sync · APP Control d'Obres V87.121

1. Ves a Supabase i crea un projecte.
2. Obre **SQL Editor** i executa el fitxer:
   `supabase/aco_supabase_sync_schema.sql`
3. A Supabase, copia:
   - **Project URL**
   - **anon public key**
4. A l'app, entra a **Configuració > Supabase Sync · dades de l’app**.
5. Enganxa la URL, la anon key i escriu una **clau privada de sincronització** pròpia.
6. Clica **Guardar sync**.
7. Clica **Pujar ara dades locals** per fer la primera còpia al núvol.
8. En un altre dispositiu, configura les mateixes dades i clica **Carregar última còpia del núvol**.

Notes:
- L'app continua funcionant amb localStorage encara que Supabase no estigui configurat.
- En aquesta fase, la sincronització és per usuari intern de l'app + clau privada de sincronització.
- Més endavant es pot substituir per Supabase Auth i polítiques RLS per usuari real.
