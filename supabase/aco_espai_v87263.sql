-- APP CONTROL D'OBRES · V87.263 · Espai ocupat al núvol (Configuració → «Espai al núvol»)
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run (després de aco_permisos_v87262_1).
--
-- Torna només dos números (mida de la base de dades i dels arxius) per saber quan cal passar al pla Pro.
-- No torna cap dada de ningú. Els comptes d'empresa reben «null» (l'app no els ensenya res).
-- És «security definer» (s'executa amb permisos del propietari) perquè un usuari sol no pot sumar els arxius
-- dels altres comptes; per això el Security Advisor la marcarà com a avís informatiu, i és d'esperar.
create or replace function public.aco_espai() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or coalesce((select auth.jwt() ->> 'email'), '') like '%@usuaris.controlobres.app' then
    return null;
  end if;
  return json_build_object(
    'base_dades', pg_catalog.pg_database_size(pg_catalog.current_database()),
    'arxius', (select coalesce(sum((o.metadata ->> 'size')::bigint), 0) from storage.objects o where o.bucket_id = 'aco-fitxers'),
    'arxius_n', (select count(*) from storage.objects o where o.bucket_id = 'aco-fitxers')
  );
end $$;

-- Només els usuaris connectats la poden cridar (ningú sense entrar).
revoke all on function public.aco_espai() from public, anon, authenticated;
grant execute on function public.aco_espai() to authenticated;
