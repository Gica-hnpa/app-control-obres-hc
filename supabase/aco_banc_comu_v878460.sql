-- APP CONTROL D'OBRES · V87.460 · Banc de preus comú
-- Executar UNA vegada a Supabase > SQL Editor > New query > Run.
--
-- Una sola fila amb el banc de preus que l'Héctor comparteix amb tots els comptes (Preus › Banc de preus › «Compartir amb
-- tots els comptes»). Tots els comptes el poden llegir. Només el pot posar, canviar o treure el compte de l'Héctor: l'únic
-- que no és @usuaris.controlobres.app (el registre de comptes és tancat), la mateixa regla que aco_espai().
-- Si no s'executa, l'app funciona igual: cada compte amb el seu banc, com fins ara.
create table if not exists public.aco_banc_comu (
  id smallint primary key default 1 check (id = 1),
  nom text not null default '',
  any_preus integer,
  pct numeric(6,2) not null default 0,   -- % d'actualització (IPC) sobre els preus
  n integer not null default 0,
  dades jsonb not null default '[]'::jsonb,
  versio timestamptz not null default now(),   -- canvia quan canvien les partides: els aparells només les tornen a baixar llavors
  updated_at timestamptz not null default now()
);

alter table public.aco_banc_comu enable row level security;

-- Les taules noves ja no tenen permisos automàtics (canvi de Supabase del 30/10/2026).
revoke all on table public.aco_banc_comu from public, anon;
grant select, insert, update, delete on table public.aco_banc_comu to authenticated;
grant select, insert, update, delete on table public.aco_banc_comu to service_role;

drop policy if exists aco_banc_comu_llegir on public.aco_banc_comu;
drop policy if exists aco_banc_comu_afegir on public.aco_banc_comu;
drop policy if exists aco_banc_comu_canviar on public.aco_banc_comu;
drop policy if exists aco_banc_comu_treure on public.aco_banc_comu;

create policy aco_banc_comu_llegir on public.aco_banc_comu for select to authenticated
  using (true);
create policy aco_banc_comu_afegir on public.aco_banc_comu for insert to authenticated
  with check (coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app');
create policy aco_banc_comu_canviar on public.aco_banc_comu for update to authenticated
  using (coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app')
  with check (coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app');
create policy aco_banc_comu_treure on public.aco_banc_comu for delete to authenticated
  using (coalesce((select auth.jwt() ->> 'email'), '@usuaris.controlobres.app') not like '%@usuaris.controlobres.app');
