-- APP CONTROL D'OBRES · V87.259 · Obres compartides entre comptes
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run.
--
-- Cada obra compartida és una fila: la fitxa de l'obra, les seves dades i la foto.
-- La veuen el propietari i els comptes que hi ha a «lectors» o «editors».
-- Només el propietari i els editors la poden modificar, i només el propietari
-- pot decidir amb qui es comparteix o deixar de compartir-la.

create table if not exists public.aco_shared (
  obra_id text primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  owner_email text,
  owner_nom text,
  lectors text[] not null default '{}',
  editors text[] not null default '{}',
  obra text,
  dades text,
  foto text,
  updated_at timestamptz not null default clock_timestamp(),
  updated_by text
);

create or replace function public.aco_shared_guard() returns trigger
language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  if tg_op = 'UPDATE' and auth.uid() is distinct from old.owner then
    -- Un editor no pot canviar de propietari ni amb qui es comparteix.
    new.owner := old.owner;
    new.owner_email := old.owner_email;
    new.owner_nom := old.owner_nom;
    new.lectors := old.lectors;
    new.editors := old.editors;
  end if;
  return new;
end $$;

drop trigger if exists aco_shared_guard on public.aco_shared;
create trigger aco_shared_guard before insert or update on public.aco_shared
  for each row execute function public.aco_shared_guard();

alter table public.aco_shared enable row level security;

drop policy if exists "aco_shared veure" on public.aco_shared;
create policy "aco_shared veure" on public.aco_shared for select to authenticated
  using (auth.uid() = owner or (auth.jwt() ->> 'email') = any(lectors) or (auth.jwt() ->> 'email') = any(editors));

drop policy if exists "aco_shared crear" on public.aco_shared;
create policy "aco_shared crear" on public.aco_shared for insert to authenticated
  with check (auth.uid() = owner);

drop policy if exists "aco_shared modificar" on public.aco_shared;
create policy "aco_shared modificar" on public.aco_shared for update to authenticated
  using (auth.uid() = owner or (auth.jwt() ->> 'email') = any(editors))
  with check (auth.uid() = owner or (auth.jwt() ->> 'email') = any(editors));

drop policy if exists "aco_shared esborrar" on public.aco_shared;
create policy "aco_shared esborrar" on public.aco_shared for delete to authenticated
  using (auth.uid() = owner);
