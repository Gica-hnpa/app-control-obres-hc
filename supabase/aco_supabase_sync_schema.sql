-- APP CONTROL D'OBRES · V87.121
-- Taula mínima per sincronitzar les dades principals de l'app amb Supabase.
-- Executar a Supabase > SQL Editor > New query.

create table if not exists public.aco_user_state (
  id uuid primary key default gen_random_uuid(),
  app_user text not null,
  sync_key text not null,
  device_id text,
  app_version text,
  clients jsonb not null default '[]'::jsonb,
  obres jsonb not null default '[]'::jsonb,
  odata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (app_user, sync_key)
);

create index if not exists aco_user_state_app_user_idx on public.aco_user_state (app_user);
create index if not exists aco_user_state_updated_at_idx on public.aco_user_state (updated_at desc);

alter table public.aco_user_state enable row level security;

-- Mode simple per començar ara amb anon key + clau privada de sincronització dins la pròpia app.
-- Aquesta política permet operar a l'app mentre no hi ha Auth d'usuaris.
-- Recomanació futura: substituir per Supabase Auth i polítiques per auth.uid().
drop policy if exists "ACO sync anon read" on public.aco_user_state;
create policy "ACO sync anon read"
  on public.aco_user_state
  for select
  to anon
  using (true);

drop policy if exists "ACO sync anon insert" on public.aco_user_state;
create policy "ACO sync anon insert"
  on public.aco_user_state
  for insert
  to anon
  with check (true);

drop policy if exists "ACO sync anon update" on public.aco_user_state;
create policy "ACO sync anon update"
  on public.aco_user_state
  for update
  to anon
  using (true)
  with check (true);

-- Bucket recomanat per documents, fotos i PDFs si vols activar Storage.
insert into storage.buckets (id, name, public)
values ('app-control-obres', 'app-control-obres', true)
on conflict (id) do nothing;

-- Polítiques bàsiques de Storage per a la fase de prova.
drop policy if exists "ACO storage anon read" on storage.objects;
create policy "ACO storage anon read"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'app-control-obres');

drop policy if exists "ACO storage anon insert" on storage.objects;
create policy "ACO storage anon insert"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'app-control-obres');

drop policy if exists "ACO storage anon update" on storage.objects;
create policy "ACO storage anon update"
  on storage.objects
  for update
  to anon
  using (bucket_id = 'app-control-obres')
  with check (bucket_id = 'app-control-obres');

drop policy if exists "ACO storage anon delete" on storage.objects;
create policy "ACO storage anon delete"
  on storage.objects
  for delete
  to anon
  using (bucket_id = 'app-control-obres');
