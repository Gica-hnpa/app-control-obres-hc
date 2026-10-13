-- APP CONTROL D'OBRES · V87.260 · Compte de còpies de seguretat (només llegir)
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run.
-- Abans: crear l'usuari copies@usuaris.controlobres.app a Authentication > Users > Add user
-- (Create new user, amb «Auto Confirm User»).
--
-- El compte de còpies pot LLEGIR les dades de tots els comptes (per fer-ne la còpia a l'ordinador),
-- però no pot modificar ni esborrar res de ningú: les regles d'escriure continuen sent
-- «cadascú només les seves files». No s'ha de fer servir mai per entrar a l'app.

drop policy if exists "aco_kv copia de seguretat (nomes llegir)" on public.aco_kv;
create policy "aco_kv copia de seguretat (nomes llegir)" on public.aco_kv
  for select to authenticated
  using ((select auth.jwt() ->> 'email') = 'copies@usuaris.controlobres.app');

drop policy if exists "aco_shared copia de seguretat (nomes llegir)" on public.aco_shared;
create policy "aco_shared copia de seguretat (nomes llegir)" on public.aco_shared
  for select to authenticated
  using ((select auth.jwt() ->> 'email') = 'copies@usuaris.controlobres.app');
