-- APP CONTROL D'OBRES · V87.262.1 · Permisos, avisos del Security/Performance Advisor i canvi de Supabase del 30/10/2026
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run (després dels fitxers anteriors, en ordre:
-- aco_nuvol_v87257, aco_compartits_v87259, aco_copies_v87260, aco_fitxers_v87262 i aquest).
--
-- No esborra cap dada. Fa:
--   1. Permisos justos a cada taula: ningú sense entrar (anon) hi té accés; els usuaris (authenticated) només
--      llegir/afegir/modificar/esborrar (les regles RLS decideixen quines files); el servidor (service_role)
--      igual, per a la restauració de còpies. Fora TRUNCATE, TRIGGER i REFERENCES, que l'app no fa servir.
--   2. La taula antiga aco_user_state (juliol) queda tancada també per permisos (no s'esborra).
--   3. Les dues funcions de les taules amb el camí de cerca fixat (avís «Function Search Path Mutable»).
--   4. Regles RLS reescrites perquè comprovin «qui ets» una sola vegada per consulta i ajuntades
--      (avisos «Auth RLS Initialization Plan» i «Multiple Permissive Policies»). El resultat és el mateix.
--   5. Índex per propietari a les obres compartides (avís «Unindexed foreign keys»).
--   6. Les taules noves que es creïn a «public» ja no tindran permisos automàtics (el canvi que Supabase
--      aplicarà a tots els projectes el 30/10/2026); cada fitxer SQL nou els haurà de donar expressament.

-- 1. Permisos justos
revoke all on table public.aco_kv, public.aco_shared from anon, authenticated, service_role;
grant select, insert, update, delete on table public.aco_kv, public.aco_shared to authenticated, service_role;

-- 2. Taula antiga (V87.121): tancada, sense esborrar-la
revoke all on table public.aco_user_state from anon, authenticated, service_role;
grant select on table public.aco_user_state to service_role;

-- 3. Funcions amb el camí de cerca fixat (fan servir només auth.* i funcions de Postgres)
alter function public.aco_kv_touch() set search_path = '';
alter function public.aco_shared_guard() set search_path = '';

-- 4. Regles RLS: una per acció, amb (select auth.…()) perquè es calculi una sola vegada
--    aco_kv: cadascú les seves files; el compte de còpies pot llegir-les totes.
drop policy if exists "aco_kv nomes les meves dades" on public.aco_kv;
drop policy if exists "aco_kv copia de seguretat (nomes llegir)" on public.aco_kv;
drop policy if exists "aco_kv veure" on public.aco_kv;
drop policy if exists "aco_kv crear" on public.aco_kv;
drop policy if exists "aco_kv modificar" on public.aco_kv;
drop policy if exists "aco_kv esborrar" on public.aco_kv;
create policy "aco_kv veure" on public.aco_kv for select to authenticated
  using ((select auth.uid()) = user_id or (select auth.jwt() ->> 'email') = 'copies@usuaris.controlobres.app');
create policy "aco_kv crear" on public.aco_kv for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "aco_kv modificar" on public.aco_kv for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "aco_kv esborrar" on public.aco_kv for delete to authenticated
  using ((select auth.uid()) = user_id);

--    aco_shared: propietari, lectors i editors veuen; propietari crea i esborra; propietari i editors modifiquen;
--    el compte de còpies pot llegir-les totes.
drop policy if exists "aco_shared copia de seguretat (nomes llegir)" on public.aco_shared;
drop policy if exists "aco_shared veure" on public.aco_shared;
drop policy if exists "aco_shared crear" on public.aco_shared;
drop policy if exists "aco_shared modificar" on public.aco_shared;
drop policy if exists "aco_shared esborrar" on public.aco_shared;
create policy "aco_shared veure" on public.aco_shared for select to authenticated
  using (
    (select auth.uid()) = owner
    or (select auth.jwt() ->> 'email') = any(lectors)
    or (select auth.jwt() ->> 'email') = any(editors)
    or (select auth.jwt() ->> 'email') = 'copies@usuaris.controlobres.app'
  );
create policy "aco_shared crear" on public.aco_shared for insert to authenticated
  with check ((select auth.uid()) = owner);
create policy "aco_shared modificar" on public.aco_shared for update to authenticated
  using ((select auth.uid()) = owner or (select auth.jwt() ->> 'email') = any(editors))
  with check ((select auth.uid()) = owner or (select auth.jwt() ->> 'email') = any(editors));
create policy "aco_shared esborrar" on public.aco_shared for delete to authenticated
  using ((select auth.uid()) = owner);

-- 5. Índex per propietari
create index if not exists aco_shared_owner_idx on public.aco_shared (owner);

-- 6. Taules noves a «public»: sense permisos automàtics (com farà Supabase el 30/10/2026)
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
