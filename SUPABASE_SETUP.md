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


## Recuperar connexió si falla la clau privada

Si l'app mostra error en carregar o comprovar Supabase després de canviar la clau privada:

1. No cliquis **Carregar última còpia del núvol** amb una clau nova si encara no has pujat dades amb aquesta clau.
2. Torna a posar la **clau privada antiga** si vols recuperar la còpia existent.
3. Clica **Guardar sync**.
4. Clica **Comprovar connexió**.
5. Si diu que troba còpia, clica **Carregar última còpia del núvol**.
6. Exporta un **JSON complet** com a còpia local.
7. Si vols canviar la clau, escriu la clau nova, clica **Guardar sync** i després **Pujar ara dades locals**. Això crea una nova còpia amb la clau nova.

La URL Supabase i la clau pública `anon`/`publishable` han de ser les mateixes. La `service_role` no s'ha d'enganxar mai dins l'app.

## V87.146 · Cites globals entre dispositius

A partir d'aquesta versió, la sincronització manual també inclou les cites globals de l'agenda que no estan vinculades a cap expedient. Això evita que al PC surtin dues cites i al mòbil només una.

Ordre recomanat:

1. Al dispositiu bo: **Configuració → Supabase Sync → Pujar ara dades locals**.
2. A l'altre dispositiu: **Configuració → Supabase Sync → Carregar última còpia del núvol**.
3. Recarrega l'app si encara veus l'agenda antiga en memòria.

Mantingues la sincronització automàtica desactivada fins que validem que PC, iPad i mòbil mostren el mateix.
