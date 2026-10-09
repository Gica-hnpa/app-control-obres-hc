-- APP CONTROL D'OBRES · V87.257 · Núvol amb usuari i contrasenya
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run.
--
-- Cada usuari (Supabase Auth) només pot llegir i escriure les seves dades.
-- Les dades es guarden per peces: cada clau de l'app és una fila, i les dades
-- de cada expedient van en una fila pròpia, així només viatja el que canvia.

create table if not exists public.aco_kv (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null,
  value text,
  deleted boolean not null default false,
  device text,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, key)
);

create index if not exists aco_kv_user_updated_idx on public.aco_kv (user_id, updated_at);

-- La data de modificació la posa sempre el servidor.
create or replace function public.aco_kv_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists aco_kv_touch on public.aco_kv;
create trigger aco_kv_touch before insert or update on public.aco_kv
  for each row execute function public.aco_kv_touch();

alter table public.aco_kv enable row level security;

drop policy if exists "aco_kv nomes les meves dades" on public.aco_kv;
create policy "aco_kv nomes les meves dades" on public.aco_kv
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seguretat: la taula antiga de la V87.121 (si existeix) deixava llegir les
-- dades a qualsevol que tingués la clau pública. Es tanca l'accés anònim;
-- les dades antigues hi queden guardades però ja no són visibles des de fora.
do $$
begin
  if to_regclass('public.aco_user_state') is not null then
    execute 'drop policy if exists "ACO sync anon read" on public.aco_user_state';
    execute 'drop policy if exists "ACO sync anon insert" on public.aco_user_state';
    execute 'drop policy if exists "ACO sync anon update" on public.aco_user_state';
    execute 'drop policy if exists "ACO sync anon delete" on public.aco_user_state';
  end if;
end $$;
