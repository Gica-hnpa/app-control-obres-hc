-- APP CONTROL D'OBRES · V87.262 · Arxius al núvol (fotos, croquis i documents)
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run.
--
-- Espai d'arxius PRIVAT «aco-fitxers». Cada arxiu va a:  <compte propietari>/<obra>/<arxiu>
--   · El propietari de l'obra hi pot fer de tot.
--   · Els comptes amb qui s'ha compartit l'obra (aco_shared): lectors el poden veure; editors, també afegir-ne.
--     Ningú més que el propietari pot esborrar arxius.
--   · El compte de còpies (copies@usuaris.controlobres.app) els pot llegir tots, per a la còpia diària.
--   · Ningú sense entrar (anònim) no hi té accés.

-- 1. Fora les regles antigues de la V87.121, que donaven accés anònim als arxius.
drop policy if exists "ACO storage anon read" on storage.objects;
drop policy if exists "ACO storage anon insert" on storage.objects;
drop policy if exists "ACO storage anon update" on storage.objects;
drop policy if exists "ACO storage anon delete" on storage.objects;

-- 2. L'espai d'arxius, privat, amb un màxim de 50 MB per arxiu (el límit del pla gratuït).
insert into storage.buckets (id, name, public, file_size_limit)
values ('aco-fitxers', 'aco-fitxers', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- 3. Obres compartides: l'identificador d'una obra ja no es pot canviar, i el correu del propietari el posa
--    el servidor (abans un compte podia fer-se passar per un altre). Sense això, un editor podria canviar
--    l'identificador i arribar als arxius d'una altra obra del propietari.
create or replace function public.aco_shared_guard() returns trigger
language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  if tg_op = 'INSERT' then
    new.owner_email := auth.jwt() ->> 'email';
  end if;
  if tg_op = 'UPDATE' then
    if new.obra_id is distinct from old.obra_id then
      raise exception 'L''identificador d''una obra compartida no es pot canviar';
    end if;
    new.owner := old.owner;
    new.owner_email := old.owner_email;
    if auth.uid() is distinct from old.owner then
      -- Un editor no pot canviar el nom del propietari ni amb qui es comparteix.
      new.owner_nom := old.owner_nom;
      new.lectors := old.lectors;
      new.editors := old.editors;
    end if;
  end if;
  return new;
end $$;

-- 4. Regles de l'espai d'arxius.
--    (storage.foldername(name))[1] = compte propietari · [2] = obra
drop policy if exists "aco-fitxers veure" on storage.objects;
create policy "aco-fitxers veure" on storage.objects for select to authenticated
using (
  bucket_id = 'aco-fitxers' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select auth.jwt() ->> 'email') = 'copies@usuaris.controlobres.app'
    or exists (
      select 1 from public.aco_shared s
      where s.obra_id = (storage.foldername(name))[2]
        and s.owner::text = (storage.foldername(name))[1]
        and ((select auth.jwt() ->> 'email') = any(s.lectors) or (select auth.jwt() ->> 'email') = any(s.editors))
    )
  )
);

drop policy if exists "aco-fitxers afegir" on storage.objects;
create policy "aco-fitxers afegir" on storage.objects for insert to authenticated
with check (
  bucket_id = 'aco-fitxers' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.aco_shared s
      where s.obra_id = (storage.foldername(name))[2]
        and s.owner::text = (storage.foldername(name))[1]
        and (select auth.jwt() ->> 'email') = any(s.editors)
    )
  )
);

drop policy if exists "aco-fitxers substituir" on storage.objects;
create policy "aco-fitxers substituir" on storage.objects for update to authenticated
using (
  bucket_id = 'aco-fitxers' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.aco_shared s
      where s.obra_id = (storage.foldername(name))[2]
        and s.owner::text = (storage.foldername(name))[1]
        and (select auth.jwt() ->> 'email') = any(s.editors)
    )
  )
)
with check (
  bucket_id = 'aco-fitxers' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.aco_shared s
      where s.obra_id = (storage.foldername(name))[2]
        and s.owner::text = (storage.foldername(name))[1]
        and (select auth.jwt() ->> 'email') = any(s.editors)
    )
  )
);

drop policy if exists "aco-fitxers esborrar" on storage.objects;
create policy "aco-fitxers esborrar" on storage.objects for delete to authenticated
using (
  bucket_id = 'aco-fitxers' and (storage.foldername(name))[1] = (select auth.uid())::text
);
